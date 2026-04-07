from security.models import ColumnSecurityGroup, RowSecurityGroup

def apply_row_filter(user, table, data):
    """
    Applies Row Security Group (RSG) filters to analytical data.
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
            group_match = True
            for key, value in g.filters.items():
                if str(row.get(key)) != str(value):
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
    Applies Column Security Group (CSG) filters to analytical data.
    """
    if user.is_superuser:
        return data

    groups = ColumnSecurityGroup.objects.filter(users=user)
    
    allowed_columns = []
    
    for g in groups:
        cols_dict = g.columns
        if table in cols_dict:
            allowed_columns.extend(cols_dict[table])
    
    if not groups.exists():
        return data
        
    if not allowed_columns:
        has_restriction_on_table = any(table in g.columns for g in groups)
        if not has_restriction_on_table:
            return data
        return []

    allowed_columns = list(set(allowed_columns))

    return [
        {k: v for k, v in row.items() if k in allowed_columns}
        for row in data
    ]
