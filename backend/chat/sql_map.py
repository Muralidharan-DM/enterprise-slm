INTENT_SQL = {
    # 1. Inventory & Stock
    "inventory_stock": """
        SELECT warehouse_id, SUM(quantity_on_hand) AS total_stock
        FROM OE.INVENTORIES
        GROUP BY warehouse_id
    """,
    "low_stock_products": """
        SELECT product_id, warehouse_id, quantity_on_hand
        FROM OE.INVENTORIES
        WHERE quantity_on_hand < 50
        ORDER BY quantity_on_hand ASC
        FETCH FIRST 50 ROWS ONLY
    """,
    
    # 2. Customers
    "customer_list": """
        SELECT customer_id, cust_first_name as first_name, cust_last_name as last_name, 
               credit_limit, account_mgr_id 
        FROM OE.CUSTOMERS 
        FETCH FIRST 50 ROWS ONLY
    """,
    "high_credit_customers": """
        SELECT cust_first_name as first_name, cust_last_name as last_name, credit_limit
        FROM OE.CUSTOMERS
        WHERE credit_limit > 50000
        ORDER BY credit_limit DESC
        FETCH FIRST 50 ROWS ONLY
    """,
    "customer_by_country": """
        SELECT territory_code as country, count(*) as total_customers
        FROM OE.CUSTOMERS
        GROUP BY territory_code
        ORDER BY total_customers DESC
    """,
    
    # 3. Orders & Sales
    "orders_with_customer": """
        SELECT o.order_id, c.cust_first_name, o.order_total
        FROM OE.ORDERS o
        JOIN OE.CUSTOMERS c ON o.customer_id = c.customer_id
        FETCH FIRST 50 ROWS ONLY
    """,
    "sales_summary": """
        SELECT sum(order_total) as Total_Revenue, count(order_id) as Total_Orders
        FROM OE.ORDERS
    """,
    "top_products": """
        SELECT product_id, sum(unit_price * quantity) as total_sales
        FROM OE.ORDER_ITEMS
        GROUP BY product_id
        ORDER BY total_sales DESC
        FETCH FIRST 20 ROWS ONLY
    """,
    "revenue_by_region": """
        SELECT c.territory_code as region, sum(o.order_total) as revenue
        FROM OE.ORDERS o
        JOIN OE.CUSTOMERS c ON o.customer_id = c.customer_id
        GROUP BY c.territory_code
        ORDER BY revenue DESC
    """,
    "orders_by_status": """
        SELECT order_status as status, count(*) as volume
        FROM OE.ORDERS
        GROUP BY order_status
    """,
    "recent_orders": """
        SELECT order_id, order_date, order_total 
        FROM OE.ORDERS 
        ORDER BY order_date DESC 
        FETCH FIRST 20 ROWS ONLY
    """,
    
    # 4. Products
    "product_list": """
        SELECT product_id, product_name, list_price, category_id
        FROM OE.PRODUCT_INFORMATION
        FETCH FIRST 50 ROWS ONLY
    """,
    "products_by_category": """
        SELECT category_id, count(*) as count
        FROM OE.PRODUCT_INFORMATION
        GROUP BY category_id
    """,
    "expensive_products": """
        SELECT product_name, list_price
        FROM OE.PRODUCT_INFORMATION
        WHERE list_price > 1000
        ORDER BY list_price DESC
        FETCH FIRST 20 ROWS ONLY
    """,
    
    # 5. Employees & HR
    "employee_list": """
        SELECT employee_id, first_name, last_name, email, salary, department_id 
        FROM HR.EMPLOYEES 
        FETCH FIRST 50 ROWS ONLY
    """,
    "high_salary_employees": """
        SELECT first_name, last_name, salary, job_id
        FROM HR.EMPLOYEES
        WHERE salary > 10000
        ORDER BY salary DESC
        FETCH FIRST 50 ROWS ONLY
    """,
    "employees_by_department": """
        SELECT department_id, count(*) as headcount
        FROM HR.EMPLOYEES
        GROUP BY department_id
        ORDER BY headcount DESC
    """,
    "recent_hires": """
        SELECT first_name, last_name, hire_date
        FROM HR.EMPLOYEES
        ORDER BY hire_date DESC
        FETCH FIRST 20 ROWS ONLY
    """,
    "longest_serving_employees": """
        SELECT first_name, last_name, hire_date
        FROM HR.EMPLOYEES
        ORDER BY hire_date ASC
        FETCH FIRST 20 ROWS ONLY
    """,
    "commissions": """
        SELECT first_name, last_name, commission_pct
        FROM HR.EMPLOYEES
        WHERE commission_pct IS NOT NULL
        ORDER BY commission_pct DESC
    """,
    
    # 6. Departments & Roles
    "department_list": """
        SELECT department_id, department_name, manager_id, location_id
        FROM HR.DEPARTMENTS
    """,
    "manager_list": """
        SELECT e.first_name, e.last_name, d.department_name
        FROM HR.EMPLOYEES e
        JOIN HR.DEPARTMENTS d ON e.employee_id = d.manager_id
    """,
    "job_roles": """
        SELECT job_title, min_salary, max_salary
        FROM HR.JOBS
    """,
    "average_salary_by_job": """
        SELECT job_id as role, avg(salary) as avg_salary
        FROM HR.EMPLOYEES
        GROUP BY job_id
        ORDER BY avg_salary DESC
    """,
    "total_salary_by_dept": """
        SELECT department_id, sum(salary) as total_budget
        FROM HR.EMPLOYEES
        GROUP BY department_id
        ORDER BY total_budget DESC
    """
}
