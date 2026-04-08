from django.contrib.auth import authenticate
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import User, UserProfile, Geography, BusinessUnit, Domain, SubDomain, ActivityLog
from .serializers import (
    UserSerializer, UserProfileSerializer, 
    GeographySerializer, BusinessUnitSerializer, 
    DomainSerializer, SubDomainSerializer
)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    email = request.data.get("email")
    password = request.data.get("password")

    if not email or not password:
        return Response({"error": "Email and password required"}, status=400)

    if not email.endswith("@decisionminds.com"):
        return Response({"error": "Only company emails allowed"}, status=400)

    user = authenticate(username=email, password=password)

    if user:
        # Get or create profile just in case signal missed it
        profile, _ = UserProfile.objects.get_or_create(user=user)
        serializer = UserSerializer(user)
        user_data = serializer.data
        user_data['profile_id'] = profile.id
        return Response(user_data)

    return Response({"error": "Invalid credentials"}, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_users(request):
    profiles = UserProfile.objects.all()
    serializer = UserProfileSerializer(profiles, many=True)
    return Response(serializer.data)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_user(request, id):
    try:
        profile = UserProfile.objects.get(id=id)
    except UserProfile.DoesNotExist:
        return Response({"error": "User profile not found"}, status=404)

    # Update basic fields
    profile.hierarchy_level = request.data.get("hierarchy_level", profile.hierarchy_level)
    
    # Update Many-to-Many relationships by names (slugs)
    if "geographies" in request.data:
        geos = Geography.objects.filter(name__in=request.data["geographies"])
        profile.geographies.set(geos)
        
    if "business_units" in request.data:
        bus = BusinessUnit.objects.filter(name__in=request.data["business_units"])
        profile.business_units.set(bus)
        
    if "domains" in request.data:
        doms = Domain.objects.filter(name__in=request.data["domains"])
        profile.domains.set(doms)
        
    if "subdomains" in request.data:
        subs = SubDomain.objects.filter(name__in=request.data["subdomains"])
        profile.subdomains.set(subs)

    profile.save()
    return Response({"message": "Updated successfully", "data": UserProfileSerializer(profile).data})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_master_data(request):
    geos = Geography.objects.all()
    bus = BusinessUnit.objects.all()
    doms = Domain.objects.all()
    subs = SubDomain.objects.all()
    
    return Response({
        "geographies": [g.name for g in geos],
        "business_units": [b.name for b in bus],
        "domains": [d.name for d in doms],
        "subdomains": [
            {"name": s.name, "domain": s.domain.name} for s in subs
        ]
    })

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def my_profile(request):
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    
    if request.method == 'GET':
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)
    
    if request.method == 'PUT':
        # Name update (AbstractUser)
        user = request.user
        if "first_name" in request.data: user.first_name = request.data["first_name"]
        if "last_name" in request.data: user.last_name = request.data["last_name"]
        if "password" in request.data and request.data["password"]:
            user.set_password(request.data["password"])
        user.save()

        # Photo upload (Step 10.17)
        if "profile_photo" in request.FILES:
            profile.profile_photo = request.FILES["profile_photo"]
        
        profile.save()
        
        # Log this edit logic (Step 10.14)
        ActivityLog.objects.create(
            user=user,
            action="Profile Update",
            details="User updated personal profile details/photo"
        )
        
        return Response({"message": "Profile updated", "data": UserProfileSerializer(profile).data})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_audit_logs(request):
    # Only admins can view audit logs (Step 10.14)
    if request.user.role != 'admin':
        return Response({"error": "Admin access required"}, status=403)
        
    logs = ActivityLog.objects.all().order_by('-timestamp')[:100]
    data = [{
        "user": l.user.email if l.user else "System",
        "action": l.action,
        "details": l.details,
        "timestamp": l.timestamp
    } for l in logs]
    return Response(data)
