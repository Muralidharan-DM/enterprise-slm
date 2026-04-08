from django.urls import path
from .views import (
    get_csrf, login_user, get_users, get_user_detail,
    create_user, update_user_api, delete_user, get_master_data,
    my_profile, get_audit_logs, get_domains,
    manage_domains, update_domain_mgmt,
    create_subdomain_mgmt, update_subdomain_mgmt,
    manage_hierarchy_levels, update_hierarchy_level,
    manage_geographies, update_geography,
    manage_business_units, update_business_unit,
)

urlpatterns = [
    path('', get_users, name='get_users_root'),
    path('csrf/', get_csrf, name='get_csrf'),
    path('login/', login_user, name='login_user'),
    path('me/', my_profile, name='my_profile'),
    path('master-data/', get_master_data, name='get_master_data'),
    path('audit-logs/', get_audit_logs, name='get_audit_logs'),

    # User CRUD — specific paths before parameterised ones
    path('users/', get_users, name='get_users'),
    path('users/create/', create_user, name='create_user'),
    path('users/update/<int:user_id>/', update_user_api, name='update_user'),
    path('users/delete/<int:user_id>/', delete_user, name='delete_user'),
    path('users/<int:user_id>/', get_user_detail, name='get_user_detail'),

    # Domain management
    path('domains/', get_domains, name='get_domains'),
    path('domains/manage/', manage_domains, name='manage_domains'),
    path('domains/manage/<int:pk>/', update_domain_mgmt, name='update_domain_mgmt'),
    path('subdomains/create/', create_subdomain_mgmt, name='create_subdomain_mgmt'),
    path('subdomains/<int:pk>/', update_subdomain_mgmt, name='update_subdomain_mgmt'),

    # Hierarchy levels
    path('hierarchy-levels/', manage_hierarchy_levels, name='manage_hierarchy_levels'),
    path('hierarchy-levels/<int:pk>/', update_hierarchy_level, name='update_hierarchy_level'),

    # Geography
    path('geographies/', manage_geographies, name='manage_geographies'),
    path('geographies/<int:pk>/', update_geography, name='update_geography'),

    # Business units
    path('business-units/', manage_business_units, name='manage_business_units'),
    path('business-units/<int:pk>/', update_business_unit, name='update_business_unit'),
]
