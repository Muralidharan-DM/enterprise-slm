from security.models import ColumnSecurityGroup, RowSecurityGroup

# Datasets that are partitioned by REGION — geography filter applies here
REGION_FILTERED_DATASETS = {
    'Revenue':      'REGION',
    'Orders':       'REGION',
    'Customers':    'REGION',
    'Demographics': 'REGION',
    'Geography':    'REGION',
}


def apply_geography_filter(user, dataset_name, data):
    """
    Restricts dataset rows to those matching the user's assigned geographies.
    Only applies to datasets that have a REGION column.
    - If the dataset has no REGION column → return all rows (not region-partitioned).
    - If the user has no geographies assigned → return all rows (no restriction applied).
    - Admin users are skipped by the caller before this is invoked.
    """
    if not data:
        return data

    region_col = REGION_FILTERED_DATASETS.get(dataset_name)
    if not region_col:
        return data  # Dataset is not region-partitioned

    try:
        user_geos = set(user.profile.geographies.values_list('name', flat=True))
    except Exception:
        return data  # No profile — no restriction

    if not user_geos:
        return data  # No geographies assigned to this user — no restriction

    return [row for row in data if row.get(region_col, '') in user_geos]


def apply_row_filter(user, table, data):
    """
    Applies Row Security Group (RSG) filters to analytical data.
    Supports operators: =, !=, >, <, >=, <=, contains, starts_with, ends_with
    Filter structure: {"DatasetName": {"COLUMN": {"op": "=", "value": "APAC"}}}
    """
    if user.is_superuser:
        return data

    groups = RowSecurityGroup.objects.filter(users=user)

    if not groups.exists():
        return data

    filtered_data = []

    for row in data:
        row_allowed = False
        for g in groups:
            all_filters = g.filters  # {"dataset": {"col": {"op": ..., "value": ...}}}

            # Get filters for this specific table/dataset
            ds_filters = all_filters.get(table, {})

            if not ds_filters:
                # Group has no filter for this dataset — allow all rows
                row_allowed = True
                break

            group_match = True
            for col, filter_val in ds_filters.items():
                # Support both new {op, value} format and legacy plain-string format
                if isinstance(filter_val, dict):
                    op = filter_val.get('op', '=')
                    value = str(filter_val.get('value', ''))
                else:
                    op = '='
                    value = str(filter_val)

                row_val = str(row.get(col, ''))

                if op == '=':
                    match = row_val == value
                elif op == '!=':
                    match = row_val != value
                elif op == '>':
                    try:
                        match = float(row_val) > float(value)
                    except (ValueError, TypeError):
                        match = row_val > value
                elif op == '<':
                    try:
                        match = float(row_val) < float(value)
                    except (ValueError, TypeError):
                        match = row_val < value
                elif op == '>=':
                    try:
                        match = float(row_val) >= float(value)
                    except (ValueError, TypeError):
                        match = row_val >= value
                elif op == '<=':
                    try:
                        match = float(row_val) <= float(value)
                    except (ValueError, TypeError):
                        match = row_val <= value
                elif op == 'contains':
                    match = value.lower() in row_val.lower()
                elif op == 'starts_with':
                    match = row_val.lower().startswith(value.lower())
                elif op == 'ends_with':
                    match = row_val.lower().endswith(value.lower())
                else:
                    match = row_val == value

                if not match:
                    group_match = False
                    break

            if group_match:
                row_allowed = True
                break

        if row_allowed:
            filtered_data.append(row)

    return filtered_data


def filter_columns(user, table, data):
    """
    Applies Column Security Group (CSG) to analytical data.
    Selected columns are EXCLUSIVELY visible to group members —
    non-members cannot see those columns; members can see them.
    Users not in any CSG see all non-exclusive columns.
    """
    if user.is_superuser:
        return data

    # Collect all columns marked as exclusive for this table (across all CSGs)
    all_groups = ColumnSecurityGroup.objects.prefetch_related('users').all()
    exclusive_columns = set()
    user_accessible = set()

    for g in all_groups:
        cols_dict = g.columns
        if table in cols_dict:
            cols = set(cols_dict[table])
            exclusive_columns.update(cols)
            if g.users.filter(id=user.id).exists():
                user_accessible.update(cols)

    if not exclusive_columns:
        return data  # No exclusive columns defined for this table

    # Each row: keep non-exclusive columns + exclusive columns the user can access
    return [
        {k: v for k, v in row.items() if k not in exclusive_columns or k in user_accessible}
        for row in data
    ]
