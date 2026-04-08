# Seeded Database for 25 Questions Demo
DATASETS = {
    "customers": [
        {"name": "Global Tech", "credit": 95000, "city": "London", "type": "Enterprise"},
        {"name": "Innovate Inc", "credit": 45000, "city": "NY", "type": "Startup"},
        {"name": "Skyline Corp", "credit": 82000, "city": "Tokyo", "type": "Enterprise"},
        {"name": "Apex Logic", "credit": 30000, "city": "Berlin", "type": "SME"},
        {"name": "Zenith Ltd", "credit": 75000, "city": "Mumbai", "type": "Enterprise"}
    ],
    "orders": [
        {"order_id": "ORD-001", "customer": "Global Tech", "total": 12500, "status": "Shipped", "date": "2026-03-01"},
        {"order_id": "ORD-002", "customer": "Innovate Inc", "total": 8400, "status": "Pending", "date": "2026-03-05"},
        {"order_id": "ORD-003", "customer": "Zenith Ltd", "total": 5600, "status": "Shipped", "date": "2026-02-28"},
        {"order_id": "ORD-004", "customer": "Apex Logic", "total": 3200, "status": "Processing", "date": "2026-03-10"},
        {"order_id": "ORD-005", "customer": "Skyline Corp", "total": 15000, "status": "Shipped", "date": "2026-03-12"}
    ],
    "inventory": [
        {"warehouse": "W-East", "stock": 450, "capacity": 500, "location": "NJ"},
        {"warehouse": "W-West", "stock": 280, "capacity": 600, "location": "CA"},
        {"warehouse": "W-South", "stock": 610, "capacity": 800, "location": "TX"},
        {"warehouse": "W-North", "stock": 120, "capacity": 400, "location": "WA"}
    ],
    "revenue": [
        {"month": "Jan", "value": 450000, "forecast": 420000},
        {"month": "Feb", "value": 510000, "forecast": 480000},
        {"month": "Mar", "value": 490000, "forecast": 550000},
        {"month": "Apr", "value": 620000, "forecast": 600000}
    ],
    "employees": [
        {"name": "Sarah Chen", "dept": "Risk", "salary": 120000, "performance": 4.8},
        {"name": "Michael Ross", "dept": "Finance", "salary": 95000, "performance": 4.2},
        {"name": "Anita Rao", "dept": "Analytics", "salary": 145000, "performance": 4.9},
        {"name": "James Bond", "dept": "Security", "salary": 200000, "performance": 5.0}
    ]
}
