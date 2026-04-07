from django.db import models
from django.conf import settings
from users.models import Domain, SubDomain

class ColumnSecurityGroup(models.Model):
    name = models.CharField(max_length=100)
    
    # Organizational filters
    domains = models.ManyToManyField(Domain, blank=True)
    subdomains = models.ManyToManyField(SubDomain, blank=True)
    
    # Data restrictions
    # Structure: ["HR.EMPLOYEES", "SALES.ORDERS"]
    datasets = models.JSONField(default=list, blank=True)
    
    # Structure: {"HR.EMPLOYEES": ["EMP_ID", "NAME"], "SALES.ORDERS": ["ORDER_ID"]}
    columns = models.JSONField(default=dict, blank=True)
    
    # User assignment
    users = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True, related_name="csgs")
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
