from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import ColumnSecurityGroup, RowSecurityGroup
from .serializers import CSGSerializer, RSGSerializer
from users.models import User, Domain, SubDomain
import json

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_csg(request):
    group = ColumnSecurityGroup.objects.create(
        name=request.data.get("name"),
    )
    group.datasets = request.data.get("datasets", [])
    group.columns = request.data.get("columns", {})
    if "domains" in request.data:
        group.domains.set(request.data["domains"])
    if "subdomains" in request.data:
        group.subdomains.set(request.data["subdomains"])
    if "users" in request.data:
        group.users.set(request.data["users"])
    group.save()
    return Response({"message": "CSG Created", "id": group.id})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_csg(request):
    groups = ColumnSecurityGroup.objects.all()
    serializer = CSGSerializer(groups, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_csg_detail(request, id):
    try:
        group = ColumnSecurityGroup.objects.get(id=id)
    except ColumnSecurityGroup.DoesNotExist:
        return Response({"error": "CSG not found"}, status=404)
    return Response({
        "id": group.id,
        "name": group.name,
        "domains": [d.name for d in group.domains.all()],
        "subdomains": [s.name for s in group.subdomains.all()],
        "datasets": group.datasets,
        "columns": group.columns,
        "users": [u.email for u in group.users.all()]
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
    if "domains" in request.data:
        group.domains.set(request.data["domains"])
    if "subdomains" in request.data:
        group.subdomains.set(request.data["subdomains"])
    if "users" in request.data:
        group.users.set(request.data["users"])
    group.save()
    return Response({"message": "Updated successfully"})

# RSG Views
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_rsg(request):
    group = RowSecurityGroup.objects.create(
        name=request.data.get("name"),
    )
    group.filters = request.data.get("filters", {})
    if "domains" in request.data:
        group.domains.set(request.data["domains"])
    if "subdomains" in request.data:
        group.subdomains.set(request.data["subdomains"])
    if "users" in request.data:
        group.users.set(request.data["users"])
    group.save()
    return Response({"message": "RSG Created", "id": group.id})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_rsg(request):
    groups = RowSecurityGroup.objects.all()
    serializer = RSGSerializer(groups, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_rsg_detail(request, id):
    try:
        group = RowSecurityGroup.objects.get(id=id)
    except RowSecurityGroup.DoesNotExist:
        return Response({"error": "RSG not found"}, status=404)
    return Response({
        "id": group.id,
        "name": group.name,
        "domains": [d.name for d in group.domains.all()],
        "subdomains": [s.name for s in group.subdomains.all()],
        "filters": group.filters,
        "users": [u.email for u in group.users.all()]
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
    if "domains" in request.data:
        group.domains.set(request.data["domains"])
    if "subdomains" in request.data:
        group.subdomains.set(request.data["subdomains"])
    if "users" in request.data:
        group.users.set(request.data["users"])
    group.save()
    return Response({"message": "Updated successfully"})
