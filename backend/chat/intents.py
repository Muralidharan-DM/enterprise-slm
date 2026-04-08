INTENT_MAP = {
    # 1. Inventory & Stock
    "inventory_stock": ["inventory stock per warehouse", "stock per warehouse", "warehouse inventory", "how much stock do we have"],
    "low_stock_products": ["products low on stock", "low inventory", "running out of stock", "needs restock"],
    
    # 2. Customers
    "customer_list": ["list all customers", "show customers", "all customers", "customer database"],
    "high_credit_customers": ["customers with credit limit > 50000", "high credit limit", "top credit customers"],
    "customer_by_country": ["customers per country", "customers by country", "where are our customers"],
    
    # 3. Orders & Sales
    "orders_with_customer": ["orders with customer names", "sales and customers", "who ordered what"],
    "sales_summary": ["sales summary", "total sales", "overall revenue", "how much did we sell"],
    "top_products": ["top selling products", "best products", "most popular products"],
    "revenue_by_region": ["revenue by region", "sales by region", "regional sales"],
    "orders_by_status": ["orders by status", "order status count", "how many orders are pending"],
    "recent_orders": ["recently placed orders", "latest orders", "new orders"],
    
    # 4. Products
    "product_list": ["list all products", "show products", "what do we sell"],
    "products_by_category": ["products per category", "product categories", "items by category"],
    "expensive_products": ["most expensive products", "premium products", "high price products"],
    
    # 5. Employees & HR
    "employee_list": ["list all employees", "show employees", "who works here"],
    "high_salary_employees": ["employees earning over 10000", "high paid employees", "top earners"],
    "employees_by_department": ["employees per department", "department headcount", "how many people per department"],
    "recent_hires": ["recently hired employees", "new hires", "newest employees"],
    "longest_serving_employees": ["longest serving employees", "oldest employees", "senior staff"],
    "commissions": ["employees with commissions", "commission pct", "who gets commission"],
    
    # 6. Departments & Roles
    "department_list": ["list departments", "show departments", "all departments"],
    "manager_list": ["list all managers", "who are the managers", "management team"],
    "job_roles": ["available job roles", "list job titles", "what jobs exist"],
    "average_salary_by_job": ["average salary per job", "how much does each role make", "salary by title"],
    "total_salary_by_dept": ["total salary per department", "department budget", "salary spend per department"]
}

def detect_intent(query):
    """
    Scans the user query and returns the matching intent key from INTENT_MAP.
    Returns None if no intent matches natively.
    """
    query = query.lower()
    
    for intent, phrases in INTENT_MAP.items():
        for phrase in phrases:
            if phrase in query:
                return intent
                
    return None
