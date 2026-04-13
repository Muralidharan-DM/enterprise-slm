import json
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import ColumnSecurityGroup, RowSecurityGroup, SecurityGroup, RowLevelSecurity, ColumnLevelSecurity, SecurityScope
from users.models import User, Domain, SubDomain, UserProfile

# Column schema per subdomain dataset
DATASET_SCHEMA = {
    "Revenue":      ["REVENUE_ID", "PERIOD", "REGION", "PRODUCT", "AMOUNT", "CURRENCY", "GROWTH_RATE", "TARGET"],
    "Orders":       ["ORDER_ID", "ORDER_DATE", "CUSTOMER", "PRODUCT", "QUANTITY", "STATUS", "REGION", "AMOUNT"],
    "Customers":    ["CUSTOMER_ID", "NAME", "EMAIL", "REGION", "SEGMENT", "JOIN_DATE", "LIFETIME_VALUE"],
    "Catalog":      ["PRODUCT_ID", "NAME", "CATEGORY", "SKU", "PRICE", "STOCK_QTY", "DESCRIPTION"],
    "Categories":   ["CATEGORY_ID", "NAME", "PARENT_CATEGORY", "PRODUCT_COUNT", "CREATED_DATE"],
    "Demographics": ["DEMO_ID", "AGE_GROUP", "GENDER", "INCOME_BAND", "REGION", "SEGMENT", "HEADCOUNT"],
    "Geography":    ["GEO_ID", "COUNTRY", "REGION", "CITY", "ZONE", "POSTAL_CODE", "TERRITORY"],
    "Costs":        ["COST_ID", "PERIOD", "CATEGORY", "AMOUNT", "VARIANCE", "BUDGET", "ACTUAL"],
    "Profit":       ["PROFIT_ID", "PERIOD", "BUSINESS_UNIT", "REVENUE", "COST", "MARGIN", "YOY_CHANGE"],
    "Trends":       ["TREND_ID", "METRIC", "PERIOD", "VALUE", "DIRECTION", "BASELINE", "INDEX"],
    "Forecasting":  ["FORECAST_ID", "METRIC", "PERIOD", "PREDICTED", "CONFIDENCE", "ACTUAL", "DEVIATION"],
}


def _set_relations(group, data):
    if "domains" in data:
        group.domains.set(Domain.objects.filter(name__in=data["domains"]))
    if "subdomains" in data:
        group.subdomains.set(SubDomain.objects.filter(name__in=data["subdomains"]))
    if "users" in data:
        group.users.set(User.objects.filter(email__in=data["users"]))


def _auto_add_users(group):
    """Auto-add users whose UserProfile domain/subdomain overlaps with the group's scope."""
    group_domain_ids = set(group.domains.values_list('id', flat=True))
    group_sub_ids = set(group.subdomains.values_list('id', flat=True))
    for profile in UserProfile.objects.prefetch_related('domains', 'subdomains').select_related('user').all():
        user_domain_ids = set(profile.domains.values_list('id', flat=True))
        user_sub_ids = set(profile.subdomains.values_list('id', flat=True))
        if (group_domain_ids & user_domain_ids) or (group_sub_ids & user_sub_ids):
            group.users.add(profile.user)


# ── Datasets endpoint ───────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_datasets(request):
    """Returns dataset→columns map, filtered by ?subdomains=A,B,C"""
    sub_param = request.query_params.get('subdomains', '')
    if sub_param:
        names = [s.strip() for s in sub_param.split(',') if s.strip()]
        schema = {name: DATASET_SCHEMA[name] for name in names if name in DATASET_SCHEMA}
    else:
        schema = DATASET_SCHEMA
    return Response(schema)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_schema(request):
    """Returns full dataset schema (table → columns list) for RLS/CLS rule builders."""
    return Response(DATASET_SCHEMA)


# ── CSG ─────────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_csg(request):
    groups = ColumnSecurityGroup.objects.prefetch_related('domains', 'subdomains', 'users').all()
    data = []
    for g in groups:
        data.append({
            "id": g.id,
            "name": g.name,
            "domains": [d.name for d in g.domains.all()],
            "subdomains": [s.name for s in g.subdomains.all()],
            "datasets": g.datasets,
            "columns": g.columns,
            "users": [u.email for u in g.users.all()],
            "created_at": g.created_at,
        })
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_csg(request):
    group = ColumnSecurityGroup.objects.create(name=request.data.get("name", ""))
    group.datasets = request.data.get("datasets", [])
    group.columns = request.data.get("columns", {})
    group.save()
    _set_relations(group, request.data)
    _auto_add_users(group)
    return Response({"message": "CSG Created", "id": group.id}, status=201)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_csg_detail(request, id):
    try:
        group = ColumnSecurityGroup.objects.prefetch_related('domains', 'subdomains', 'users').get(id=id)
    except ColumnSecurityGroup.DoesNotExist:
        return Response({"error": "CSG not found"}, status=404)
    return Response({
        "id": group.id,
        "name": group.name,
        "domains": [d.name for d in group.domains.all()],
        "subdomains": [s.name for s in group.subdomains.all()],
        "datasets": group.datasets,
        "columns": group.columns,
        "users": [u.email for u in group.users.all()],
    })


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_csg(request, id):
    try:
        group = ColumnSecurityGroup.objects.get(id=id)
    except ColumnSecurityGroup.DoesNotExist:
        return Response({"error": "CSG not found"}, status=404)
    group.name = request.data.get("name", group.name)
    group.datasets = request.data.get("datasets", group.datasets)
    group.columns = request.data.get("columns", group.columns)
    group.save()
    _set_relations(group, request.data)
    return Response({"message": "Updated successfully"})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_csg(request, id):
    try:
        ColumnSecurityGroup.objects.get(id=id).delete()
        return Response({"message": "Deleted"})
    except ColumnSecurityGroup.DoesNotExist:
        return Response({"error": "Not found"}, status=404)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def csg_auto_users(request, id):
    """Returns users whose domain/subdomain profile overlaps with the CSG scope."""
    try:
        group = ColumnSecurityGroup.objects.prefetch_related('domains', 'subdomains').get(id=id)
    except ColumnSecurityGroup.DoesNotExist:
        return Response([], status=404)

    group_domain_ids = set(group.domains.values_list('id', flat=True))
    group_sub_ids = set(group.subdomains.values_list('id', flat=True))

    matched = []
    for profile in UserProfile.objects.prefetch_related('domains', 'subdomains').select_related('user').all():
        user_domain_ids = set(profile.domains.values_list('id', flat=True))
        user_sub_ids = set(profile.subdomains.values_list('id', flat=True))
        if (group_domain_ids & user_domain_ids) or (group_sub_ids & user_sub_ids):
            matched.append({"email": profile.user.email, "username": profile.user.username})

    return Response(matched)


# ── RSG ─────────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_rsg(request):
    groups = RowSecurityGroup.objects.prefetch_related('domains', 'subdomains', 'users').all()
    data = []
    for g in groups:
        data.append({
            "id": g.id,
            "name": g.name,
            "domains": [d.name for d in g.domains.all()],
            "subdomains": [s.name for s in g.subdomains.all()],
            "filters": g.filters,
            "users": [u.email for u in g.users.all()],
            "created_at": g.created_at,
        })
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_rsg(request):
    group = RowSecurityGroup.objects.create(name=request.data.get("name", ""))
    group.filters = request.data.get("filters", {})
    group.save()
    _set_relations(group, request.data)
    _auto_add_users(group)
    return Response({"message": "RSG Created", "id": group.id}, status=201)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_rsg_detail(request, id):
    try:
        group = RowSecurityGroup.objects.prefetch_related('domains', 'subdomains', 'users').get(id=id)
    except RowSecurityGroup.DoesNotExist:
        return Response({"error": "RSG not found"}, status=404)
    return Response({
        "id": group.id,
        "name": group.name,
        "domains": [d.name for d in group.domains.all()],
        "subdomains": [s.name for s in group.subdomains.all()],
        "filters": group.filters,
        "users": [u.email for u in group.users.all()],
    })


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_rsg(request, id):
    try:
        group = RowSecurityGroup.objects.get(id=id)
    except RowSecurityGroup.DoesNotExist:
        return Response({"error": "RSG not found"}, status=404)
    group.name = request.data.get("name", group.name)
    group.filters = request.data.get("filters", group.filters)
    group.save()
    _set_relations(group, request.data)
    return Response({"message": "Updated successfully"})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_rsg(request, id):
    try:
        RowSecurityGroup.objects.get(id=id).delete()
        return Response({"message": "Deleted"})
    except RowSecurityGroup.DoesNotExist:
        return Response({"error": "Not found"}, status=404)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def rsg_auto_users(request, id):
    """Returns users whose domain/subdomain profile overlaps with the RSG scope."""
    try:
        group = RowSecurityGroup.objects.prefetch_related('domains', 'subdomains').get(id=id)
    except RowSecurityGroup.DoesNotExist:
        return Response([], status=404)

    group_domain_ids = set(group.domains.values_list('id', flat=True))
    group_sub_ids = set(group.subdomains.values_list('id', flat=True))

    matched = []
    for profile in UserProfile.objects.prefetch_related('domains', 'subdomains').select_related('user').all():
        user_domain_ids = set(profile.domains.values_list('id', flat=True))
        user_sub_ids = set(profile.subdomains.values_list('id', flat=True))
        if (group_domain_ids & user_domain_ids) or (group_sub_ids & user_sub_ids):
            matched.append({"email": profile.user.email, "username": profile.user.username})

    return Response(matched)


# ── CSG available / add user ─────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def csg_available_users(request, id):
    """Users in the CSG's scope but NOT yet in the group."""
    try:
        group = ColumnSecurityGroup.objects.prefetch_related('domains', 'subdomains', 'users').get(id=id)
    except ColumnSecurityGroup.DoesNotExist:
        return Response([], status=404)

    group_domain_ids = set(group.domains.values_list('id', flat=True))
    group_sub_ids = set(group.subdomains.values_list('id', flat=True))
    existing_ids = set(group.users.values_list('id', flat=True))

    matched = []
    for profile in UserProfile.objects.prefetch_related('domains', 'subdomains').select_related('user').all():
        if profile.user.id in existing_ids:
            continue
        user_domain_ids = set(profile.domains.values_list('id', flat=True))
        user_sub_ids = set(profile.subdomains.values_list('id', flat=True))
        if (group_domain_ids & user_domain_ids) or (group_sub_ids & user_sub_ids):
            matched.append({"email": profile.user.email, "username": profile.user.username})

    return Response(matched)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def csg_add_user(request, id):
    """Add a user to the CSG manually."""
    try:
        group = ColumnSecurityGroup.objects.get(id=id)
    except ColumnSecurityGroup.DoesNotExist:
        return Response({"error": "Not found"}, status=404)
    try:
        user = User.objects.get(email=request.data.get("email", ""))
        group.users.add(user)
        return Response({"message": "User added"})
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)


# ── RSG available / add user ─────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def rsg_available_users(request, id):
    """Users in the RSG's scope but NOT yet in the group."""
    try:
        group = RowSecurityGroup.objects.prefetch_related('domains', 'subdomains', 'users').get(id=id)
    except RowSecurityGroup.DoesNotExist:
        return Response([], status=404)

    group_domain_ids = set(group.domains.values_list('id', flat=True))
    group_sub_ids = set(group.subdomains.values_list('id', flat=True))
    existing_ids = set(group.users.values_list('id', flat=True))

    matched = []
    for profile in UserProfile.objects.prefetch_related('domains', 'subdomains').select_related('user').all():
        if profile.user.id in existing_ids:
            continue
        user_domain_ids = set(profile.domains.values_list('id', flat=True))
        user_sub_ids = set(profile.subdomains.values_list('id', flat=True))
        if (group_domain_ids & user_domain_ids) or (group_sub_ids & user_sub_ids):
            matched.append({"email": profile.user.email, "username": profile.user.username})

    return Response(matched)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def rsg_add_user(request, id):
    """Add a user to the RSG manually."""
    try:
        group = RowSecurityGroup.objects.get(id=id)
    except RowSecurityGroup.DoesNotExist:
        return Response({"error": "Not found"}, status=404)
    try:
        user = User.objects.get(email=request.data.get("email", ""))
        group.users.add(user)
        return Response({"message": "User added"})
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)


# ── Unified Security Groups ───────────────────────────────────────────────────

def _parse_json_list(val):
    """Parse a stored JSON list string; fall back gracefully.
    Legacy rows stored plain strings (e.g. 'India') — wrap them in a list."""
    if not val:
        return []
    try:
        result = json.loads(val)
        if isinstance(result, list):
            return result
        # json.loads parsed it as a non-list (e.g. a number) — treat as single item
        return [result]
    except (ValueError, TypeError):
        # Plain string value — legacy single entry
        return [val] if val.strip() else []


def _serialize_group(g):
    try:
        s = g.scope
        # Handle legacy single-string values for region/business_unit
        raw_region = s.region or '[]'
        raw_bu = s.business_unit or '[]'
        regions = _parse_json_list(raw_region)
        if not isinstance(regions, list):
            regions = [raw_region] if raw_region else []
        bus = _parse_json_list(raw_bu)
        if not isinstance(bus, list):
            bus = [raw_bu] if raw_bu else []
        scope = {
            "regions": regions,
            "domains": _parse_json_list(s.domain),
            "subdomains": _parse_json_list(s.subdomain),
            "business_units": bus,
        }
    except SecurityScope.DoesNotExist:
        scope = {"regions": [], "domains": [], "subdomains": [], "business_units": []}
    return {
        "id": g.id,
        "name": g.name,
        "description": g.description,
        "role": g.role,
        "created_at": g.created_at,
        "updated_at": g.updated_at,
        "rls": [{"id": r.id, "table_name": r.table_name, "column_name": r.column_name, "condition": r.condition} for r in g.rls.all()],
        "cls": [{"id": c.id, "table_name": c.table_name, "column_name": c.column_name, "is_masked": c.is_masked} for c in g.cls.all()],
        "scope": scope,
    }


def _save_group_details(group, data):
    if "rls" in data:
        group.rls.all().delete()
        for r in data["rls"]:
            if r.get("table_name") and r.get("column_name"):
                RowLevelSecurity.objects.create(
                    security_group=group,
                    table_name=r["table_name"],
                    column_name=r["column_name"],
                    condition=r.get("condition", ""),
                )
    if "cls" in data:
        group.cls.all().delete()
        for c in data["cls"]:
            if c.get("table_name") and c.get("column_name"):
                ColumnLevelSecurity.objects.create(
                    security_group=group,
                    table_name=c["table_name"],
                    column_name=c["column_name"],
                    is_masked=c.get("is_masked", False),
                )
    if "scope" in data:
        sc = data["scope"]
        SecurityScope.objects.update_or_create(
            security_group=group,
            defaults={
                "region": json.dumps(sc.get("regions", [])),
                "domain": json.dumps(sc.get("domains", [])),
                "subdomain": json.dumps(sc.get("subdomains", [])),
                "business_unit": json.dumps(sc.get("business_units", [])),
            },
        )


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def manage_security_groups(request):
    if request.method == 'GET':
        groups = SecurityGroup.objects.prefetch_related('rls', 'cls').all().order_by('id')
        return Response([_serialize_group(g) for g in groups])
    name = request.data.get("name", "").strip()
    if not name:
        return Response({"error": "Name is required"}, status=400)
    if SecurityGroup.objects.filter(name=name).exists():
        return Response({"error": "A security group with this name already exists"}, status=400)
    group = SecurityGroup.objects.create(
        name=name,
        description=request.data.get("description", "").strip(),
        role=request.data.get("role", ""),
    )
    _save_group_details(group, request.data)
    return Response({"id": group.id, "message": "Security group created"}, status=201)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def security_group_detail(request, id):
    try:
        group = SecurityGroup.objects.prefetch_related('rls', 'cls').get(id=id)
    except SecurityGroup.DoesNotExist:
        return Response({"error": "Not found"}, status=404)
    if request.method == 'GET':
        return Response(_serialize_group(group))
    if request.method == 'PUT':
        group.name = request.data.get("name", group.name).strip()
        group.description = request.data.get("description", group.description).strip()
        group.role = request.data.get("role", group.role)
        group.save()
        _save_group_details(group, request.data)
        return Response({"message": "Updated"})
    group.delete()
    return Response({"message": "Deleted"})
