from django.contrib.auth import authenticate, login as auth_login
from django.middleware.csrf import get_token
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import User, UserProfile, Geography, BusinessUnit, Domain, SubDomain, HierarchyLevel, ActivityLog
from core.domain_config import DOMAIN_CONFIG

# ---------- helpers ----------

def _profile_domains(profile):
    return list(profile.domains.values_list('name', flat=True))

def _profile_subdomains(profile):
    return list(profile.subdomains.values_list('name', flat=True))

def _profile_geographies(profile):
    return list(profile.geographies.values_list('name', flat=True))

def _profile_business_units(profile):
    return list(profile.business_units.values_list('name', flat=True))

def _set_m2m(profile, data):
    domain_names = data.get("domains", [])
    profile.domains.set(Domain.objects.filter(name__in=domain_names))

    sub_names = data.get("subdomains", [])
    profile.subdomains.set(SubDomain.objects.filter(name__in=sub_names))

    geo_names = data.get("geographies", [])
    profile.geographies.set(Geography.objects.filter(name__in=geo_names))

    bu_names = data.get("business_units", [])
    profile.business_units.set(BusinessUnit.objects.filter(name__in=bu_names))

    hierarchy_name = data.get("hierarchy")
    if hierarchy_name:
        try:
            profile.hierarchy_level = HierarchyLevel.objects.get(name=hierarchy_name)
        except HierarchyLevel.DoesNotExist:
            profile.hierarchy_level = None
    else:
        profile.hierarchy_level = None

# ---------- auth ----------

@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def get_csrf(request):
    """Set the CSRF cookie so the frontend can read it before login."""
    token = get_token(request)
    return JsonResponse({"csrfToken": token})

@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def login_user(request):
    email = request.data.get("email")
    password = request.data.get("password")
    if not email or not password:
        return Response({"error": "Email and password required"}, status=400)
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

# ---------- profile ----------

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def my_profile(request):
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    if request.method == 'GET':
        photo_url = None
        if profile.profile_photo:
            photo_url = request.build_absolute_uri(profile.profile_photo.url)
        return Response({
            "id": request.user.id,
            "username": request.user.username,
            "first_name": request.user.first_name,
            "last_name": request.user.last_name,
            "email": request.user.email,
            "role": profile.role,
            "hierarchy": profile.hierarchy_level.name if profile.hierarchy_level else "",
            "domains": _profile_domains(profile),
            "subdomains": _profile_subdomains(profile),
            "geographies": _profile_geographies(profile),
            "business_units": _profile_business_units(profile),
            "profile_photo": photo_url,
        })
    if request.method == 'PUT':
        if "username" in request.data:
            request.user.username = request.data["username"]
        if "first_name" in request.data:
            request.user.first_name = request.data["first_name"]
        if "last_name" in request.data:
            request.user.last_name = request.data["last_name"]
        if "password" in request.data and request.data["password"]:
            request.user.set_password(request.data["password"])
        request.user.save()
        if "profile_photo" in request.FILES:
            profile.profile_photo = request.FILES["profile_photo"]
        profile.save()
        return Response({"message": "Profile updated successfully"})

# ---------- user list / CRUD ----------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_users(request):
    try:
        users = User.objects.all().order_by('username')
        data = []
        for u in users:
            profile = (
                UserProfile.objects
                .filter(user=u)
                .prefetch_related('domains', 'geographies', 'business_units', 'subdomains')
                .select_related('hierarchy_level')
                .first()
            )
            data.append({
                "id": u.id,
                "name": u.username,
                "email": u.email,
                "role": profile.role if profile else "user",
                "hierarchy": profile.hierarchy_level.name if profile and profile.hierarchy_level else None,
                "domains": _profile_domains(profile) if profile else [],
                "subdomains": _profile_subdomains(profile) if profile else [],
                "geographies": _profile_geographies(profile) if profile else [],
                "business_units": _profile_business_units(profile) if profile else [],
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
            "hierarchy": profile.hierarchy_level.name if profile.hierarchy_level else "",
            "domains": _profile_domains(profile),
            "subdomains": _profile_subdomains(profile),
            "geographies": _profile_geographies(profile),
            "business_units": _profile_business_units(profile),
        })
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_user(request):
    try:
        role = request.data.get("role", "user")
        user = User.objects.create_user(
            username=request.data["username"],
            email=request.data["email"],
            password=request.data["password"],
            role=role,
        )
        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.role = role
        _set_m2m(profile, request.data)
        profile.save()
        return Response({"message": "User created", "id": user.id}, status=201)
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

        new_role = request.data.get("role")
        if new_role:
            user.role = new_role
            profile.role = new_role

        new_password = request.data.get("password", "").strip()
        if new_password:
            user.set_password(new_password)

        user.save()

        _set_m2m(profile, request.data)
        profile.save()
        return Response({"message": "Updated successfully"})
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=400)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_user(request, user_id):
    try:
        user = User.objects.get(id=user_id)
        if user == request.user:
            return Response({"error": "You cannot delete your own account"}, status=400)
        user.delete()
        return Response({"message": "User deleted"})
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

# ---------- master data ----------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_master_data(request):
    return Response({
        "domains": list(Domain.objects.values('id', 'name')),
        "subdomains": [
            {"id": s.id, "name": s.name, "domain": s.domain.name}
            for s in SubDomain.objects.select_related('domain').all()
        ],
        "geographies": list(Geography.objects.values('id', 'name')),
        "business_units": list(BusinessUnit.objects.values('id', 'name')),
        "hierarchy_levels": list(HierarchyLevel.objects.values('id', 'name')),
    })

# ---------- domain management ----------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_domains(request):
    return Response(DOMAIN_CONFIG)

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

# ---------- hierarchy levels ----------

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def manage_hierarchy_levels(request):
    if request.method == 'GET':
        return Response(list(HierarchyLevel.objects.values('id', 'name').order_by('id')))
    name = request.data.get("name", "").strip()
    if not name:
        return Response({"error": "Name is required"}, status=400)
    obj = HierarchyLevel.objects.create(name=name)
    return Response({"id": obj.id, "name": obj.name}, status=201)

@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def update_hierarchy_level(request, pk):
    try:
        obj = HierarchyLevel.objects.get(pk=pk)
    except HierarchyLevel.DoesNotExist:
        return Response({"error": "Not found"}, status=404)
    if request.method == 'PUT':
        obj.name = request.data.get("name", obj.name).strip()
        obj.save()
        return Response({"id": obj.id, "name": obj.name})
    obj.delete()
    return Response({"message": "Deleted"})

# ---------- geography ----------

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def manage_geographies(request):
    if request.method == 'GET':
        return Response(list(Geography.objects.values('id', 'name').order_by('id')))
    name = request.data.get("name", "").strip()
    if not name:
        return Response({"error": "Name is required"}, status=400)
    obj = Geography.objects.create(name=name)
    return Response({"id": obj.id, "name": obj.name}, status=201)

@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def update_geography(request, pk):
    try:
        obj = Geography.objects.get(pk=pk)
    except Geography.DoesNotExist:
        return Response({"error": "Not found"}, status=404)
    if request.method == 'PUT':
        obj.name = request.data.get("name", obj.name).strip()
        obj.save()
        return Response({"id": obj.id, "name": obj.name})
    obj.delete()
    return Response({"message": "Deleted"})

# ---------- business units ----------

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def manage_business_units(request):
    if request.method == 'GET':
        return Response(list(BusinessUnit.objects.values('id', 'name').order_by('id')))
    name = request.data.get("name", "").strip()
    if not name:
        return Response({"error": "Name is required"}, status=400)
    obj = BusinessUnit.objects.create(name=name)
    return Response({"id": obj.id, "name": obj.name}, status=201)

@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def update_business_unit(request, pk):
    try:
        obj = BusinessUnit.objects.get(pk=pk)
    except BusinessUnit.DoesNotExist:
        return Response({"error": "Not found"}, status=404)
    if request.method == 'PUT':
        obj.name = request.data.get("name", obj.name).strip()
        obj.save()
        return Response({"id": obj.id, "name": obj.name})
    obj.delete()
    return Response({"message": "Deleted"})

# ---------- audit ----------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_audit_logs(request):
    logs = ActivityLog.objects.all().order_by('-timestamp')[:50]
    return Response([{
        "user": l.user.email if l.user else "System",
        "action": l.action,
        "details": l.details,
        "timestamp": l.timestamp
    } for l in logs])
