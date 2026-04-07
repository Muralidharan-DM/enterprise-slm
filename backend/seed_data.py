import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import Geography, BusinessUnit, Domain, SubDomain

def seed_data():
    # Geographies
    geos = ["India", "APAC", "Europe", "Middle East"]
    for geo in geos:
        Geography.objects.get_or_create(name=geo)
    print(f"Seeded {len(geos)} Geographies.")

    # Business Units
    bus = ["Retail Banking", "Risk & Compliance", "Finance"]
    for bu in bus:
        BusinessUnit.objects.get_or_create(name=bu)
    print(f"Seeded {len(bus)} Business Units.")

    # Domains and Subdomains
    domains_data = {
        "Sales": ["Revenue", "Orders", "Customers"],
        "Product": ["Catalog", "Categories"],
        "Customer": ["Demographics", "Geography"],
        "Finance": ["Costs", "Profit"],
        "Analytics": ["Trends", "Forecasting"]
    }

    for domain_name, subdomains in domains_data.items():
        domain_obj, _ = Domain.objects.get_or_create(name=domain_name)
        for sub_name in subdomains:
            SubDomain.objects.get_or_create(name=sub_name, domain=domain_obj)
    
    print(f"Seeded {len(domains_data)} Domains and their Subdomains.")

if __name__ == "__main__":
    seed_data()
