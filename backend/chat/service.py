from analytics.seed_data import DATASETS
from chat.intents import INTENT_MAP, detect_intent
from security.utils import filter_columns, apply_row_filter


def _is_admin(user):
    """Admins (superuser or role=admin on User OR UserProfile) have unrestricted access."""
    if user is None:
        return True
    if user.is_superuser or getattr(user, 'role', '') == 'admin':
        return True
    try:
        return user.profile.role == 'admin'
    except Exception:
        return False


def _get_user_accessible_datasets(user):
    """
    Returns the set of dataset names the user can access based on their
    domain/subdomain profile. Dataset names match SubDomain names exactly.
    """
    if _is_admin(user):
        return set(INTENT_MAP[k]["dataset"] for k in INTENT_MAP)
    try:
        profile = user.profile
        accessible = set()
        # Subdomains the user is directly assigned to
        for sub in profile.subdomains.values_list('name', flat=True):
            accessible.add(sub)
        # All subdomains of domains the user belongs to
        for domain in profile.domains.prefetch_related('subdomains').all():
            for sub in domain.subdomains.values_list('name', flat=True):
                accessible.add(sub)
        return accessible
    except Exception:
        return set()


def process_query(query, user=None):
    """
    Routes a user query to the correct dataset, applies security filters,
    builds charts, and returns { summary, table, charts }.
    """
    intent = detect_intent(query)

    if not intent:
        accessible_datasets = _get_user_accessible_datasets(user)
        available_labels = [
            INTENT_MAP[k]["label"] for k in INTENT_MAP
            if INTENT_MAP[k]["dataset"] in accessible_datasets
        ]
        return {
            "summary": (
                "I couldn't match your query to a known dataset. "
                f"Try asking about: {', '.join(available_labels) or 'your assigned datasets'}."
            ),
            "table": [],
            "charts": [],
        }

    dataset_name = INTENT_MAP[intent]["dataset"]
    label = INTENT_MAP[intent]["label"]

    # ── Domain / subdomain access gate ──────────────────────────────────────
    if not _is_admin(user):
        accessible = _get_user_accessible_datasets(user)
        if dataset_name not in accessible:
            return {
                "summary": (
                    f"Access Denied. You do not have permission to view {label} data. "
                    "This dataset is outside your assigned domain scope. "
                    "Please contact your administrator if you need access."
                ),
                "table": [],
                "charts": [],
                "access_denied": True,
            }

    data = list(DATASETS.get(dataset_name, []))   # work on a copy

    # Apply row-level and column-level security
    if not _is_admin(user):
        data = apply_row_filter(user, dataset_name, data)
        data = filter_columns(user, dataset_name, data)

    if not data:
        return {
            "summary": f"No accessible records found in {label}. Your security policy may restrict this data.",
            "table": [],
            "charts": [],
        }

    charts = build_charts(intent, data)
    row_count = len(data)

    return {
        "summary": f"{label}: {row_count} record{'s' if row_count != 1 else ''} retrieved successfully.",
        "table": data,
        "charts": charts,
    }


# ── Chart builders ────────────────────────────────────────────────────────────

def _safe_list(data, key, limit=15):
    """Extract values for a key, up to limit rows."""
    return [row.get(key) for row in data[:limit]]


def build_charts(intent, data):
    if not data:
        return []

    charts = []

    if intent == "revenue_analysis":
        # Line: AMOUNT over PERIOD
        charts.append({
            "type": "line",
            "title": "Revenue Amount by Period",
            "x": _safe_list(data, "PERIOD"),
            "y": _safe_list(data, "AMOUNT"),
            "color": "#6366f1",
        })
        # Bar: AMOUNT by REGION (aggregate)
        region_totals = {}
        for row in data:
            region_totals[row["REGION"]] = region_totals.get(row["REGION"], 0) + row["AMOUNT"]
        charts.append({
            "type": "bar",
            "title": "Total Revenue by Region",
            "x": list(region_totals.keys()),
            "y": list(region_totals.values()),
            "color": "#a78bfa",
        })

    elif intent == "orders_analysis":
        # Pie: STATUS distribution
        status_map = {}
        for row in data:
            status_map[row["STATUS"]] = status_map.get(row["STATUS"], 0) + 1
        charts.append({
            "type": "pie",
            "title": "Order Status Distribution",
            "labels": list(status_map.keys()),
            "values": list(status_map.values()),
        })
        # Bar: AMOUNT by CUSTOMER (top 10)
        cust_totals = {}
        for row in data:
            cust_totals[row["CUSTOMER"]] = cust_totals.get(row["CUSTOMER"], 0) + row["AMOUNT"]
        top = sorted(cust_totals.items(), key=lambda x: x[1], reverse=True)[:10]
        charts.append({
            "type": "bar",
            "title": "Order Value by Customer",
            "x": [t[0] for t in top],
            "y": [t[1] for t in top],
            "color": "#38bdf8",
        })

    elif intent == "customer_analysis":
        # Bar: LIFETIME_VALUE by NAME (top 10)
        top = sorted(data, key=lambda r: r.get("LIFETIME_VALUE", 0), reverse=True)[:10]
        if "LIFETIME_VALUE" in (top[0] if top else {}):
            charts.append({
                "type": "bar",
                "title": "Customer Lifetime Value (Top 10)",
                "x": [r["NAME"] for r in top],
                "y": [r["LIFETIME_VALUE"] for r in top],
                "color": "#f472b6",
            })
        # Pie: SEGMENT distribution
        seg_map = {}
        for row in data:
            seg_map[row.get("SEGMENT", "Unknown")] = seg_map.get(row.get("SEGMENT", "Unknown"), 0) + 1
        charts.append({
            "type": "pie",
            "title": "Customer Segment Distribution",
            "labels": list(seg_map.keys()),
            "values": list(seg_map.values()),
        })

    elif intent == "catalog_analysis":
        # Bar: PRICE by NAME
        charts.append({
            "type": "bar",
            "title": "Product Price List",
            "x": [r["NAME"] for r in data[:15]],
            "y": [r["PRICE"] for r in data[:15]],
            "color": "#34d399",
        })
        # Pie: CATEGORY distribution
        cat_map = {}
        for row in data:
            cat_map[row.get("CATEGORY", "Other")] = cat_map.get(row.get("CATEGORY", "Other"), 0) + 1
        charts.append({
            "type": "pie",
            "title": "Products by Category",
            "labels": list(cat_map.keys()),
            "values": list(cat_map.values()),
        })

    elif intent == "category_analysis":
        # Bar: PRODUCT_COUNT by NAME
        charts.append({
            "type": "bar",
            "title": "Product Count per Category",
            "x": [r["NAME"] for r in data[:15]],
            "y": [r.get("PRODUCT_COUNT", 0) for r in data[:15]],
            "color": "#fbbf24",
        })

    elif intent == "demographics_analysis":
        # Bar: HEADCOUNT by AGE_GROUP
        age_map = {}
        for row in data:
            age_map[row["AGE_GROUP"]] = age_map.get(row["AGE_GROUP"], 0) + row.get("HEADCOUNT", 0)
        charts.append({
            "type": "bar",
            "title": "Headcount by Age Group",
            "x": list(age_map.keys()),
            "y": list(age_map.values()),
            "color": "#a78bfa",
        })
        # Pie: by GENDER
        gender_map = {}
        for row in data:
            gender_map[row["GENDER"]] = gender_map.get(row["GENDER"], 0) + row.get("HEADCOUNT", 0)
        charts.append({
            "type": "pie",
            "title": "Headcount by Gender",
            "labels": list(gender_map.keys()),
            "values": list(gender_map.values()),
        })

    elif intent == "geography_analysis":
        # Bar: by REGION
        region_map = {}
        for row in data:
            region_map[row["REGION"]] = region_map.get(row["REGION"], 0) + 1
        charts.append({
            "type": "bar",
            "title": "Offices by Region",
            "x": list(region_map.keys()),
            "y": list(region_map.values()),
            "color": "#38bdf8",
        })
        # Pie: by TERRITORY
        terr_map = {}
        for row in data:
            terr_map[row.get("TERRITORY", "Other")] = terr_map.get(row.get("TERRITORY", "Other"), 0) + 1
        charts.append({
            "type": "pie",
            "title": "Distribution by Territory",
            "labels": list(terr_map.keys()),
            "values": list(terr_map.values()),
        })

    elif intent == "costs_analysis":
        # Line: ACTUAL over PERIOD (aggregate)
        period_map = {}
        for row in data:
            period_map[row["PERIOD"]] = period_map.get(row["PERIOD"], 0) + row.get("ACTUAL", 0)
        periods = sorted(period_map.keys())
        charts.append({
            "type": "line",
            "title": "Total Actual Cost by Period",
            "x": periods,
            "y": [period_map[p] for p in periods],
            "color": "#f87171",
        })
        # Bar: ACTUAL by CATEGORY
        cat_map = {}
        for row in data:
            cat_map[row["CATEGORY"]] = cat_map.get(row["CATEGORY"], 0) + row.get("ACTUAL", 0)
        charts.append({
            "type": "bar",
            "title": "Cost by Category",
            "x": list(cat_map.keys()),
            "y": list(cat_map.values()),
            "color": "#fbbf24",
        })

    elif intent == "profit_analysis":
        # Line: MARGIN over PERIOD (average)
        period_margins = {}
        period_counts = {}
        for row in data:
            p = row["PERIOD"]
            period_margins[p] = period_margins.get(p, 0) + row.get("MARGIN", 0)
            period_counts[p] = period_counts.get(p, 0) + 1
        periods = sorted(period_margins.keys())
        charts.append({
            "type": "line",
            "title": "Average Profit Margin (%) by Period",
            "x": periods,
            "y": [round(period_margins[p] / period_counts[p], 1) for p in periods],
            "color": "#34d399",
        })
        # Bar: MARGIN by BUSINESS_UNIT (latest period)
        latest = max(period_margins.keys()) if period_margins else None
        if latest:
            bu_rows = [r for r in data if r["PERIOD"] == latest]
            charts.append({
                "type": "bar",
                "title": f"Profit Margin by Business Unit ({latest})",
                "x": [r["BUSINESS_UNIT"] for r in bu_rows],
                "y": [r.get("MARGIN", 0) for r in bu_rows],
                "color": "#6366f1",
            })

    elif intent == "trends_analysis":
        # Line: VALUE over PERIOD for DAU metric
        dau = [r for r in data if r.get("METRIC") == "DAU"]
        if dau:
            charts.append({
                "type": "line",
                "title": "Daily Active Users (DAU) Trend",
                "x": [r["PERIOD"] for r in dau],
                "y": [r["VALUE"] for r in dau],
                "color": "#6366f1",
            })
        # Bar: INDEX by METRIC (latest period per metric)
        metric_index = {}
        for row in data:
            metric_index[row["METRIC"]] = row.get("INDEX", 100)
        charts.append({
            "type": "bar",
            "title": "Performance Index by Metric",
            "x": list(metric_index.keys()),
            "y": list(metric_index.values()),
            "color": "#a78bfa",
        })

    elif intent == "forecast_analysis":
        # Line: PREDICTED over PERIOD for Revenue
        rev_fcst = [r for r in data if r.get("METRIC") == "Revenue"]
        if rev_fcst:
            charts.append({
                "type": "line",
                "title": "Revenue Forecast",
                "x": [r["PERIOD"] for r in rev_fcst],
                "y": [r["PREDICTED"] for r in rev_fcst],
                "color": "#6366f1",
            })
        # Bar: CONFIDENCE by METRIC
        met_conf = {}
        for row in data:
            met_conf[row["METRIC"]] = row.get("CONFIDENCE", 0)
        charts.append({
            "type": "bar",
            "title": "Forecast Confidence (%) by Metric",
            "x": list(met_conf.keys()),
            "y": list(met_conf.values()),
            "color": "#34d399",
        })

    return charts
