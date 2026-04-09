import oracledb
import os
from security.utils import filter_columns, apply_row_filter

def get_oracle_connection():
    """
    Creates and returns a connection to the Oracle Database using .env credentials.
    Uses python-oracledb thin mode (no Oracle Client library required).
    Raises an exception on failure so callers can detect the error.
    """
    connection = oracledb.connect(
        user=os.getenv("ORACLE_USER"),
        password=os.getenv("ORACLE_PASSWORD"),
        host=os.getenv("ORACLE_HOST"),
        port=int(os.getenv("ORACLE_PORT", 1521)),
        service_name=os.getenv("ORACLE_SERVICE"),
    )
    print("✅ Oracle Connected Successfully")
    return connection

SYSTEM_SCHEMAS = frozenset([
    'SYS', 'AUDSYS', 'CTXSYS', 'DBSFWUSER', 'DBSNMP', 'DVSYS',
    'GGSYS', 'GSMADMIN_INTERNAL', 'GSMCATUSER', 'GSMUSER',
    'LBACSYS', 'MDDATA', 'MDSYS', 'OJVMSYS', 'OLAPSYS',
    'ORACLE_OCM', 'ORDDATA', 'ORDPLUGINS', 'ORDSYS', 'OUTLN',
    'REMOTE_SCHEDULER_AGENT', 'SI_INFORMTN_SCHEMA', 'SYS$UMF',
    'SYSBACKUP', 'SYSDG', 'SYSKM', 'SYSRAC', 'WMSYS', 'XDB', 'XS$NULL',
])

def get_tables():
    """
    Fetches all non-system tables from the Oracle database.
    """
    conn = get_oracle_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT owner, table_name
            FROM all_tables
            ORDER BY owner, table_name
        """)
        tables = [
            f"{row[0]}.{row[1]}"
            for row in cursor.fetchall()
            if row[0] not in SYSTEM_SCHEMAS
        ]
        cursor.close()
        print("Tables fetched:", len(tables))
        return tables
    finally:
        conn.close()

def get_table_data(table_name):
    """
    Fetches the first 100 rows of data from a specific Oracle table.
    """
    conn = get_oracle_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(f"SELECT * FROM {table_name} FETCH FIRST 100 ROWS ONLY")
        columns = [col[0] for col in cursor.description]
        rows = cursor.fetchall()
        data = [dict(zip(columns, row)) for row in rows]
        cursor.close()
        return columns, data
    finally:
        conn.close()

def get_filtered_data(user, table_name):
    """
    Fetches table data and applies security filters (RSG + CSG).
    """
    columns, data = get_table_data(table_name)

    if data:
        data = apply_row_filter(user, table_name, data)
        data = filter_columns(user, table_name, data)

    return columns, data
