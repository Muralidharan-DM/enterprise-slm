# Intent mapping — keywords → dataset name (must match analytics/seed_data.py keys)
INTENT_MAP = {
    # Revenue
    "revenue_analysis": {
        "keywords": ["revenue", "income", "earnings", "sales amount", "money made", "growth rate", "target revenue"],
        "dataset": "Revenue",
        "label": "Revenue Analysis",
    },
    # Orders
    "orders_analysis": {
        "keywords": ["order", "orders", "transaction", "purchase", "fulfillment", "shipped", "pending", "order status"],
        "dataset": "Orders",
        "label": "Orders Analysis",
    },
    # Customers
    "customer_analysis": {
        "keywords": ["customer", "client", "shopper", "buyer", "lifetime value", "segment", "account"],
        "dataset": "Customers",
        "label": "Customer Analysis",
    },
    # Catalog / Products
    "catalog_analysis": {
        "keywords": ["product", "catalog", "item", "stock", "price", "sku", "inventory"],
        "dataset": "Catalog",
        "label": "Product Catalog",
    },
    # Categories
    "category_analysis": {
        "keywords": ["category", "categories", "product type", "parent category", "classification"],
        "dataset": "Categories",
        "label": "Category Analysis",
    },
    # Demographics
    "demographics_analysis": {
        "keywords": ["demographic", "age group", "gender", "income band", "headcount", "population", "segment distribution"],
        "dataset": "Demographics",
        "label": "Demographics Analysis",
    },
    # Geography
    "geography_analysis": {
        "keywords": ["geography", "country", "city", "region", "zone", "territory", "location", "office"],
        "dataset": "Geography",
        "label": "Geography Analysis",
    },
    # Costs
    "costs_analysis": {
        "keywords": ["cost", "costs", "expense", "budget", "spending", "variance", "actual spend", "opex"],
        "dataset": "Costs",
        "label": "Cost Analysis",
    },
    # Profit
    "profit_analysis": {
        "keywords": ["profit", "margin", "business unit", "yoy", "year over year", "profitability", "net"],
        "dataset": "Profit",
        "label": "Profit & Margin Analysis",
    },
    # Trends
    "trends_analysis": {
        "keywords": ["trend", "trends", "index", "baseline", "direction", "nps", "dau", "churn", "performance trend"],
        "dataset": "Trends",
        "label": "Trends Analysis",
    },
    # Forecasting
    "forecast_analysis": {
        "keywords": ["forecast", "predict", "prediction", "confidence", "deviation", "projected", "projection", "outlook"],
        "dataset": "Forecasting",
        "label": "Forecasting & Predictions",
    },
}


def detect_intent(query):
    query = query.lower()
    for intent, config in INTENT_MAP.items():
        if any(word in query for word in config["keywords"]):
            return intent
    return None
