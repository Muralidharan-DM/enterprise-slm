from django.contrib.auth import authenticate, login as auth_login
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import User, UserProfile, Geography, BusinessUnit, Domain, SubDomain, HierarchyLevel, ActivityLog
from core.domain_config import DOMAIN_CONFIG

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_domains(request):
    return Response(DOMAIN_CONFIG)

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def my_profile(request):
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    if request.method == 'GET':
        return Response({
            "id": request.user.id,
            "username": request.user.username,
            "email": request.user.email,
            "role": profile.role,
            "hierarchy": profile.hierarchy_level,
            "domains": profile.domains,
            "subdomains": profile.subdomains,
            "geographies": profile.geographies,
            "business_units": profile.business_units
        })
    if request.method == 'PUT':
        if "username" in request.data: request.user.username = request.data["username"]
        if "email" in request.data: request.user.email = request.data["email"]
        request.user.save()
        profile.role = request.data.get("role", profile.role)
        profile.hierarchy_level = request.data.get("hierarchy", profile.hierarchy_level)
        profile.save()
        return Response({"message": "Profile updated successfully"})

@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    email = request.data.get("email")
    password = request.data.get("password")
    if not email or not password: return Response({"error": "Email and password required"}, status=400)
    user = authenticate(username=email, password=password)
    if user:
        auth_login(request, user)
        profile, _ = UserProfile.objects.get_or_create(user=user)
        return Response({
            "token": "token-not-required-for-session",
            "user": {
                "id": user.id,
                "email": user.email,
                "role": profile.role
            }
        })
    return Response({"error": "Invalid credentials"}, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_users(request):
    try:
        users = User.objects.all()
        data = []
        for u in users:
            profile = UserProfile.objects.filter(user=u).first()
            data.append({
                "id": u.id,
                "name": u.username, # Requested Key: name
                "email": u.email,
                "role": profile.role if profile else "user",
                "domains": profile.domains if profile else []
            })
        return Response(data)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_detail(request, user_id):
    try:
        user = User.objects.get(id=user_id)
        profile, _ = UserProfile.objects.get_or_create(user=user)
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": profile.role,
            "hierarchy": profile.hierarchy_level,
            "domains": profile.domains,
            "subdomains": profile.subdomains,
            "geographies": profile.geographies,
            "business_units": profile.business_units
        })
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_user(request):
    try:
        user = User.objects.create_user(
            username=request.data["username"],
            email=request.data["email"],
            password=request.data["password"]
        )
        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.role = request.data.get("role")
        profile.hierarchy_level = request.data.get("hierarchy")
        profile.domains = request.data.get("domains", [])
        profile.subdomains = request.data.get("subdomains", [])
        profile.geographies = request.data.get("geographies", [])
        profile.business_units = request.data.get("business_units", [])
        profile.save()
        return Response({"message": "User created"})
    except Exception as e:
        return Response({"error": str(e)}, status=400)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_user_api(request, user_id):
    try:
        user = User.objects.get(id=user_id)
        profile, _ = UserProfile.objects.get_or_create(user=user)
        user.username = request.data.get("username", user.username)
        user.email = request.data.get("email", user.email)
        user.save()
        profile.role = request.data.get("role", profile.role)
        profile.hierarchy_level = request.data.get("hierarchy", profile.hierarchy_level)
        profile.domains = request.data.get("domains", profile.domains)
        profile.subdomains = request.data.get("subdomains", profile.subdomains)
        profile.geographies = request.data.get("geographies", profile.geographies)
        profile.business_units = request.data.get("business_units", profile.business_units)
        profile.save()
        return Response({"message": "Updated successfully"})
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_master_data(request):
    return Response({
        "domains": list(Domain.objects.values()),
        "subdomains": list(SubDomain.objects.values()),
        "geographies": list(Geography.objects.values()),
        "business_units": list(BusinessUnit.objects.values()),
        "hierarchy_levels": list(HierarchyLevel.objects.values())
    })

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def manage_domains(request):
    if request.method == 'GET':
        doms = Domain.objects.all().prefetch_related('subdomains')
        return Response([{
            "id": d.id, "name": d.name,
            "subdomains": [{"id": s.id, "name": s.name} for s in d.subdomains.all()]
        } for d in doms])
    if request.method == 'POST':
        domain = Domain.objects.create(name=request.data.get("name"))
        return Response({"id": domain.id, "name": domain.name, "subdomains": []})

@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def update_domain_mgmt(request, pk):
    domain = Domain.objects.get(pk=pk)
    if request.method == 'PUT':
        domain.name = request.data.get("name", domain.name)
        domain.save()
        return Response({"message": "Domain updated"})
    if request.method == 'DELETE':
        domain.delete()
        return Response({"message": "Domain deleted"})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_subdomain_mgmt(request):
    domain = Domain.objects.get(id=request.data.get("domainId"))
    sub = SubDomain.objects.create(domain=domain, name=request.data.get("name"))
    return Response({"id": sub.id, "name": sub.name})

@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def update_subdomain_mgmt(request, pk):
    sub = SubDomain.objects.get(pk=pk)
    if request.method == 'PUT':
        sub.name = request.data.get("name", sub.name)
        sub.save()
        return Response({"message": "Subdomain updated"})
    if request.method == 'DELETE':
        sub.delete()
        return Response({"message": "Subdomain deleted"})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_audit_logs(request):
    logs = ActivityLog.objects.all().order_by('-timestamp')[:50]
    return Response([{"user": l.user.email if l.user else "System", "action": l.action, "details": l.details, "timestamp": l.timestamp} for l in logs])
