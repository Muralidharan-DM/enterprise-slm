from rest_framework import serializers
from .models import ColumnSecurityGroup, RowSecurityGroup
from users.models import User, Domain, SubDomain

class CSGSerializer(serializers.ModelSerializer):
    datasets = serializers.ReadOnlyField()
    columns = serializers.ReadOnlyField()
    
    class Meta:
        model = ColumnSecurityGroup
        fields = '__all__'

class RSGSerializer(serializers.ModelSerializer):
    filters = serializers.ReadOnlyField()
    
    class Meta:
        model = RowSecurityGroup
        fields = '__all__'
