# Granular Intent Mapping for Seeded Analytics
INTENT_MAP = {
    # 1. Customers
    "high_credit_customers": {
        "keywords": ["credit", "limit", "top consumers", "high credit"],
        "dataset": "customers"
    },
    "customer_list": {
        "keywords": ["all customers", "client list", "shopper directory"],
        "dataset": "customers"
    },
    
    # 2. Orders & Sales
    "all_orders": {
        "keywords": ["orders", "transactions", "purchases"],
        "dataset": "orders"
    },
    "sales_summary": {
        "keywords": ["total sales", "revenue sum", "order volume"],
        "dataset": "orders"
    },
    
    # 3. Inventory
    "inventory_stock": {
        "keywords": ["inventory", "warehouse", "stock", "in stock"],
        "dataset": "inventory"
    },
    
    # 4. Revenue
    "monthly_revenue": {
        "keywords": ["revenue", "monthly", "trend", "money made"],
        "dataset": "revenue"
    },
    
    # 5. Employees
    "employee_directory": {
        "keywords": ["employees", "staff", "workers", "headcount"],
        "dataset": "employees"
    }
}

def detect_intent(query):
    query = query.lower()
    for intent, config in INTENT_MAP.items():
        if any(word in query for word in config["keywords"]):
            return intent
    return None
