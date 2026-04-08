from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, UserProfile

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Auto-create a UserProfile when a new User is saved."""
    if created:
        UserProfile.objects.get_or_create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """Save the related UserProfile whenever the User is saved.
    Uses try/except to avoid errors when the profile does not yet exist
    (e.g. during the very first post_save before create_user_profile runs)."""
    try:
        if hasattr(instance, '_profile_cache') or UserProfile.objects.filter(user=instance).exists():
            profile = UserProfile.objects.get(user=instance)
            profile.save()
    except UserProfile.DoesNotExist:
        pass
