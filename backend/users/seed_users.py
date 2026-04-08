from users.models import User, UserProfile

def seed_enterprise_users():
    # Purge existing placeholders
    User.objects.all().delete()
    print("🧹 Purged existing users.")

    users_data = [
        # 🔷 ADMINS (REAL NAMES)
        {
            "username": "ganesh",
            "email": "ganesh@decisionminds.com",
            "password": "User@123",
            "role": "admin",
            "domains": ["Sales", "Finance"],
            "subdomains": ["Revenue", "Profit"],
            "geo": ["India", "APAC"],
            "bu": ["Consulting"]
        },
        {
            "username": "venkatesh",
            "email": "venkatesh@decisionminds.com",
            "password": "User@123",
            "role": "admin",
            "domains": ["Analytics"],
            "subdomains": ["Trends"],
            "geo": ["USA"],
            "bu": ["Products"]
        },
        {
            "username": "jayanth",
            "email": "jayanth@decisionminds.com",
            "password": "User@123",
            "role": "admin",
            "domains": ["Customer"],
            "subdomains": ["Geography"],
            "geo": ["EU"],
            "bu": ["Services"]
        },
        {
            "username": "gowtham",
            "email": "gowtham@decisionminds.com",
            "password": "User@123",
            "role": "admin",
            "domains": ["Product"],
            "subdomains": ["Catalog"],
            "geo": ["LATAM"],
            "bu": ["Products"]
        },
        {
            "username": "arun",
            "email": "arun@decisionminds.com",
            "password": "User@123",
            "role": "admin",
            "domains": ["Finance"],
            "subdomains": ["Costs"],
            "geo": ["APAC"],
            "bu": ["Risk & Compliance"]
        },

        # 👤 USERS (REAL NAMES)
        {
            "username": "karthik",
            "email": "karthik@decisionminds.com",
            "password": "User@123",
            "role": "user",
            "domains": ["Sales"],
            "subdomains": ["Orders"],
            "geo": ["India"],
            "bu": ["Retail Banking"]
        },
        {
            "username": "rahul",
            "email": "rahul@decisionminds.com",
            "password": "User@123",
            "role": "user",
            "domains": ["Customer"],
            "subdomains": ["Demographics"],
            "geo": ["USA"],
            "bu": ["Consulting"]
        },
        {
            "username": "anita",
            "email": "anita@decisionminds.com",
            "password": "User@123",
            "role": "user",
            "domains": ["Product"],
            "subdomains": ["Categories"],
            "geo": ["EU"],
            "bu": ["Products"]
        },
        {
            "username": "meena",
            "email": "meena@decisionminds.com",
            "password": "User@123",
            "role": "user",
            "domains": ["Analytics"],
            "subdomains": ["Forecasting"],
            "geo": ["India"],
            "bu": ["Services"]
        },
        {
            "username": "suresh",
            "email": "suresh@decisionminds.com",
            "password": "User@123",
            "role": "user",
            "domains": ["Finance"],
            "subdomains": ["Profit"],
            "geo": ["APAC"],
            "bu": ["Wealth Management"]
        }
    ]

    for u in users_data:
        user = User.objects.create_user(
            username=u["username"],
            email=u["email"],
            password=u["password"]
        )
        # Fetch the profile created by signals (Step 26.2.2.1.14)
        profile = user.profile 
        profile.role = u["role"]
        profile.hierarchy_level = "Manager"
        profile.domains = u["domains"]
        profile.subdomains = u["subdomains"]
        profile.geographies = u["geo"]
        profile.business_units = u["bu"]
        profile.save()
        print(f"✅ Onboarded: {u['username']} ({u['role']})")

    print("\n🎉 Enterprise Seeding Complete. Total Users: 10")

if __name__ == "__main__":
    seed_enterprise_users()
