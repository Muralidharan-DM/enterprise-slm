from rest_framework import serializers
from .models import User, UserProfile, Geography, BusinessUnit, Domain, SubDomain

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role']

class GeographySerializer(serializers.ModelSerializer):
    class Meta:
        model = Geography
        fields = ['id', 'name']

class BusinessUnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessUnit
        fields = ['id', 'name']

class DomainSerializer(serializers.ModelSerializer):
    class Meta:
        model = Domain
        fields = ['id', 'name']

class SubDomainSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubDomain
        fields = ['id', 'name', 'domain']

class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    email = serializers.ReadOnlyField(source='user.email')
    role = serializers.ReadOnlyField(source='user.role')
    
    geographies = serializers.SlugRelatedField(
        many=True, slug_field='name', queryset=Geography.objects.all()
    )
    business_units = serializers.SlugRelatedField(
        many=True, slug_field='name', queryset=BusinessUnit.objects.all()
    )
    domains = serializers.SlugRelatedField(
        many=True, slug_field='name', queryset=Domain.objects.all()
    )
    subdomains = serializers.SlugRelatedField(
        many=True, slug_field='name', queryset=SubDomain.objects.all()
    )

    class Meta:
        model = UserProfile
        fields = [
            'id', 'user', 'username', 'email', 'role', 'hierarchy_level', 
            'geographies', 'business_units', 'domains', 'subdomains', 'profile_photo'
        ]
