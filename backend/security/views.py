from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import ColumnSecurityGroup, RowSecurityGroup
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
