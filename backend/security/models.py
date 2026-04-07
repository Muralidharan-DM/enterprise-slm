from django.db import models
from django.conf import settings
from users.models import Domain, SubDomain
import json

class ColumnSecurityGroup(models.Model):
    name = models.CharField(max_length=100)
    
    # Organizational filters
    domains = models.ManyToManyField(Domain, blank=True)
    subdomains = models.ManyToManyField(SubDomain, blank=True)
    
    # Data restrictions - Using TextField for SQLite compatibility
    # Structure: ["HR.EMPLOYEES", "SALES.ORDERS"]
    _datasets = models.TextField(default="[]", blank=True)
    
    # Structure: {"HR.EMPLOYEES": ["EMP_ID", "NAME"], "SALES.ORDERS": ["ORDER_ID"]}
    _columns = models.TextField(default="{}", blank=True)
    
    @property
    def datasets(self):
        try:
            return json.loads(self._datasets)
        except:
            return []
    
    @datasets.setter
    def datasets(self, value):
        self._datasets = json.dumps(value)

    @property
    def columns(self):
        try:
            return json.loads(self._columns)
        except:
            return {}
    
    @columns.setter
    def columns(self, value):
        self._columns = json.dumps(value)
    
    # User assignment
    users = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True, related_name="csgs")
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class RowSecurityGroup(models.Model):
    name = models.CharField(max_length=100)
    
    # Organizational filters
    domains = models.ManyToManyField(Domain, blank=True)
    subdomains = models.ManyToManyField(SubDomain, blank=True)
    
    # Row filters - Using TextField for SQLite compatibility
    # Structure: {"Region": "APAC", "BusinessUnit": "Finance"}
    _filters = models.TextField(default="{}", blank=True)
    
    @property
    def filters(self):
        try:
            return json.loads(self._filters)
        except:
            return {}
    
    @filters.setter
    def filters(self, value):
        self._filters = json.dumps(value)
    
    # User assignment
    users = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True, related_name="rsgs")
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
