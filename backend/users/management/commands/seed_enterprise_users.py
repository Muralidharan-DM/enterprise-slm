from django.core.management.base import BaseCommand
from users.models import User, UserProfile
from django.db import transaction

class Command(BaseCommand):
    help = "Seed enterprise users and admins for production demo"

    def handle(self, *args, **kwargs):
        admins = [
            "ganesh@decisionminds.com",
            "venkatesh@decisionminds.com",
            "joseph@decisionminds.com",
            "jayakanth@decisionminds.com",
            "arun@decisionminds.com",
            "suresh@decisionminds.com"
        ]
        
        users = [
            "kumar@decisionminds.com",
            "rahul@decisionminds.com",
            "divya@decisionminds.com",
            "anita@decisionminds.com",
            "vijay@decisionminds.com"
        ]
        
        password = "User@123"

        with transaction.atomic():
            # Seed Admins
            for email in admins:
                user, created = User.objects.get_or_create(
                    email=email,
                    defaults={'username': email.split('@')[0], 'role': 'admin'}
                )
                if created or user.role != 'admin':
                    user.role = 'admin'
                    user.set_password(password)
                    user.save()
                    UserProfile.objects.get_or_create(user=user)
                self.stdout.write(self.style.SUCCESS(f"Admin {'created' if created else 'updated'}: {email}"))

            # Seed Users
            for email in users:
                user, created = User.objects.get_or_create(
                    email=email,
                    defaults={'username': email.split('@')[0], 'role': 'user'}
                )
                if created or user.role != 'user':
                    user.role = 'user'
                    user.set_password(password)
                    user.save()
                    UserProfile.objects.get_or_create(user=user)
                self.stdout.write(self.style.SUCCESS(f"User {'created' if created else 'updated'}: {email}"))
