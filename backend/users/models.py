from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('user', 'User'),
    )

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='user')

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email

class Geography(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class BusinessUnit(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class Domain(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class SubDomain(models.Model):
    name = models.CharField(max_length=100)
    domain = models.ForeignKey(Domain, on_delete=models.CASCADE, related_name="subdomains")

    def __str__(self):
        return self.name

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    hierarchy_level = models.CharField(max_length=50, null=True, blank=True)

    geographies = models.ManyToManyField(Geography, blank=True)
    business_units = models.ManyToManyField(BusinessUnit, blank=True)

    domains = models.ManyToManyField(Domain, blank=True)
    subdomains = models.ManyToManyField(SubDomain, blank=True)

    profile_photo = models.ImageField(upload_to="profiles/", null=True, blank=True)

    def __str__(self):
        return f"{self.user.email} Profile"
