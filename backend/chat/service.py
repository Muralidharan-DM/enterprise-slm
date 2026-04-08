from analytics.seed_data import DATASETS
from chat.intents import INTENT_MAP, detect_intent

def process_query(query):
    """
    Pipes a user query into the seeded analytics engine.
    Returns: { summary, table, charts }
    """
    intent = detect_intent(query)
    
    if not intent:
        return {
            "summary": "Query unrecognized. Please ask about inventory, credit, orders, or revenue for this demo.",
            "table": [],
            "charts": []
        }

    dataset_name = INTENT_MAP[intent]["dataset"]
    data = DATASETS.get(dataset_name, [])
    
    # Trigger Multi-Chart Builder
    charts = build_charts(intent, data)
    
    return {
        "summary": f"Discovery complete for '{intent.replace('_',' ')}'. Intelligence assets refined.",
        "table": data,
        "charts": charts
    }

def build_charts(intent, data):
    """
    Logic-driven chart configuration generator.
    Returns a list of chart objects.
    """
    charts = []
    
    if intent == "inventory_stock":
        # Chart 1: Stock Levels
        charts.append({
            "type": "bar",
            "title": "Available Stock (Units)",
            "x": [d["warehouse"] for d in data],
            "y": [d["stock"] for d in data],
            "color": "#6366f1"
        })
        # Chart 2: Capacity Utilization
        charts.append({
            "type": "bar",
            "title": "Warehouse Capacity (Max)",
            "x": [d["warehouse"] for d in data],
            "y": [d["capacity"] for d in data],
            "color": "#a78bfa"
        })

    elif intent == "high_credit_customers":
        # Chart 1: Credit Distribution
        charts.append({
            "type": "bar",
            "title": "Customer Credit Standing",
            "x": [d["name"] for d in data],
            "y": [d["credit"] for d in data]
        })
        # Chart 2: Share of Credit
        charts.append({
            "type": "pie",
            "title": "Credit Portfolio %",
            "labels": [d["name"] for d in data],
            "values": [d["credit"] for d in data]
        })

    elif intent == "monthly_revenue":
        # Chart 1: Revenue Trend
        charts.append({
            "type": "line",
            "title": "Monthly Revenue (Actual)",
            "x": [d["month"] for d in data],
            "y": [d["value"] for d in data]
        })
        # Chart 2: Forecast Variance
        charts.append({
            "type": "line",
            "title": "Revenue vs Forecast",
            "x": [d["month"] for d in data],
            "y": [d["forecast"] for d in data]
        })

    elif intent == "all_orders":
        # Order Status Distribution
        status_map = {}
        for d in data:
            status_map[d["status"]] = status_map.get(d["status"], 0) + 1
            
        charts.append({
            "type": "pie",
            "title": "Fulfillment Lifecycle Status",
            "labels": list(status_map.keys()),
            "values": list(status_map.values())
        })

    elif intent == "employee_directory":
        charts.append({
            "type": "bar",
            "title": "Individual Performance Scores",
            "x": [d["name"] for d in data],
            "y": [d["performance"] for d in data]
        })

    return charts
