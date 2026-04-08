import os
from .oracle_service import get_oracle_connection, get_tables, get_table_data, get_filtered_data

def get_db_connection(db_config):
    """
    Creates and returns a connection. Logic for Oracle uses .env.
    """
    db_type = db_config.get('type')
    try:
        if db_type == 'oracle':
            return get_oracle_connection()
        elif db_type == 'mysql':
            import mysql.connector
            return mysql.connector.connect(
                host=db_config.get('host'),
                port=int(db_config.get('port', 3306)),
                user=db_config.get('user'),
                password=db_config.get('password'),
                database=db_config.get('database')
            )
        elif db_type == 'postgres':
            import psycopg2
            return psycopg2.connect(
                host=db_config.get('host'),
                port=int(db_config.get('port', 5432)),
                user=db_config.get('user'),
                password=db_config.get('password'),
                dbname=db_config.get('database')
            )
    except Exception as e:
        print(f"Connection Error: {e}")
        raise e

def fetch_tables(conn, db_type):
    """
    Fetches raw table list.
    """
    if db_type == 'oracle':
        return get_tables()
        
    cursor = conn.cursor()
    if db_type == 'mysql':
        cursor.execute("SHOW TABLES")
        tables = [row[0] for row in cursor.fetchall()]
    elif db_type == 'postgres':
        cursor.execute("""
            SELECT table_name FROM information_schema.tables
            WHERE table_schema='public'
        """)
        tables = [row[0] for row in cursor.fetchall()]
    
    cursor.close()
    return tables

def fetch_table_data(conn, db_type, table_name):
    """
    Fetches raw table data (first 50 rows).
    """
    if db_type == 'oracle':
        # oracle_service expects table_name and handles its own connection for filtered data,
        # but here we follow the existing pattern for raw fetch if possible.
        # However, for consistency we'll just use oracle_service's helper.
        cols, data = get_table_data(table_name)
        return cols, data

    cursor = conn.cursor()
    query = f"SELECT * FROM {table_name} LIMIT 50"
    cursor.execute(query)
    columns = [col[0] for col in cursor.description]
    rows = cursor.fetchall()
    data = [dict(zip(columns, row)) for row in rows]
    cursor.close()
    return columns, data

def get_secured_data(user, db_config, table_name):
    """
    Unified entry point for secured data access.
    """
    if db_config['type'] == 'oracle':
        return get_filtered_data(user, table_name)
        
    conn = get_db_connection(db_config)
    columns, data = fetch_table_data(conn, db_config['type'], table_name)
    
    if hasattr(conn, 'close'):
        conn.close()

    from security.utils import filter_columns, apply_row_filter
    if data:
        data = apply_row_filter(user, table_name, data)
        data = filter_columns(user, table_name, data)

    return columns, data
