from django.db import models
from django.conf import settings
from users.models import Domain, SubDomain
import json


# ── Unified Security Group ────────────────────────────────────────────────────

class SecurityGroup(models.Model):
    ROLE_CHOICES = (
        ('super_user', 'Super User'),
        ('admin', 'Admin'),
        ('user', 'User'),
    )
    name = models.CharField(max_length=100, unique=True)
    description = models.CharField(max_length=200, blank=True, default='')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class RowLevelSecurity(models.Model):
    security_group = models.ForeignKey(SecurityGroup, on_delete=models.CASCADE, related_name="rls")
    table_name = models.CharField(max_length=100)
    column_name = models.CharField(max_length=100)
    condition = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.security_group.name}: {self.table_name}.{self.column_name}={self.condition}"


class ColumnLevelSecurity(models.Model):
    security_group = models.ForeignKey(SecurityGroup, on_delete=models.CASCADE, related_name="cls")
    table_name = models.CharField(max_length=100)
    column_name = models.CharField(max_length=100)
    is_masked = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.security_group.name}: {self.table_name}.{self.column_name}"


class SecurityScope(models.Model):
    security_group = models.OneToOneField(SecurityGroup, on_delete=models.CASCADE, related_name="scope")
    region = models.TextField(blank=True, default='[]')          # JSON list of region names
    domain = models.TextField(blank=True, default='[]')          # JSON list of domain names
    subdomain = models.TextField(blank=True, default='[]')       # JSON list of subdomain names
    business_unit = models.TextField(blank=True, default='[]')   # JSON list of business unit names


# ── Legacy CSG / RSG (kept for existing migrations) ──────────────────────────

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
