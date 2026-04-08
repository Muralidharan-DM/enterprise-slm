from django.urls import path
from .views import (
    login_user, get_users, get_user_detail, 
    create_user, update_user_api, get_master_data,
    my_profile, get_audit_logs, get_domains,
    manage_domains, update_domain_mgmt,
    create_subdomain_mgmt, update_subdomain_mgmt
)

urlpatterns = [
    path('', get_users, name='get_users_root'), # api/users/
    path('login/', login_user, name='login_user'),
    path('domains/', get_domains, name='get_domains'),
    path('domains/manage/', manage_domains, name='manage_domains'),
    path('domains/manage/<int:pk>/', update_domain_mgmt, name='update_domain_mgmt'),
    path('subdomains/create/', create_subdomain_mgmt, name='create_subdomain_mgmt'),
    path('subdomains/<int:pk>/', update_subdomain_mgmt, name='update_subdomain_mgmt'),
    path('me/', my_profile, name='my_profile'),
    path('audit-logs/', get_audit_logs, name='get_audit_logs'),
    path('users/', get_users, name='get_users'), # Keep old for compat
    path('users/<int:user_id>/', get_user_detail, name='get_user_detail'),
    path('users/create/', create_user, name='create_user'),
    path('users/update/<int:user_id>/', update_user_api, name='update_user'),
    path('master-data/', get_master_data, name='get_master_data'),
]
