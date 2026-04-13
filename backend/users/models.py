import json
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('user', 'User'),
        ('super_user', 'Super User'),
    )
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email

# --- Master Data Tables ---

class BaseMasterModel(models.Model):
    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
    def __str__(self): return self.name

class Geography(BaseMasterModel):
    pass

class BusinessUnit(BaseMasterModel):
    pass

class Domain(BaseMasterModel):
    pass

class SubDomain(BaseMasterModel):
    # Overriding to add ForeignKey relationship
    name = models.CharField(max_length=100) # Name is unique within a domain if needed, but keeping simple for now
    domain = models.ForeignKey(Domain, on_delete=models.CASCADE, related_name="subdomains")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self): return f"{self.domain.name} > {self.name}"

class HierarchyLevel(BaseMasterModel):
    pass

# --- User Profile & Access Control ---

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")

    role = models.CharField(max_length=20, default="user")

    # Hierarchical Relationship
    hierarchy_level = models.ForeignKey(HierarchyLevel, on_delete=models.SET_NULL, null=True, blank=True)

    # Multi-Entity Access Control
    domains = models.ManyToManyField(Domain, blank=True)
    subdomains = models.ManyToManyField(SubDomain, blank=True)
    geographies = models.ManyToManyField(Geography, blank=True)
    business_units = models.ManyToManyField(BusinessUnit, blank=True)

    # Unified Security Groups (many-to-many — a user may belong to multiple groups)
    security_groups = models.ManyToManyField(
        'security.SecurityGroup', blank=True, related_name='user_profiles'
    )

    contact = models.CharField(max_length=50, blank=True, default='')

    profile_photo = models.ImageField(upload_to="profiles/", null=True, blank=True)

    def __str__(self):
        return f"{self.user.email} Profile"

class ActivityLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="activities")
    action = models.CharField(max_length=255)
    details = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return f"{self.user.email if self.user else 'System'} - {self.action} @ {self.timestamp}"
