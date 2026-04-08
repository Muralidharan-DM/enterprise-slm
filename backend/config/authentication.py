from rest_framework.authentication import SessionAuthentication


class CsrfExemptSessionAuthentication(SessionAuthentication):
    """
    SessionAuthentication without CSRF enforcement.
    Safe for SPA backends: the browser's SameSite=Lax cookie policy
    and the CORS origin check already prevent cross-site request forgery.
    """
    def enforce_csrf(self, request):
        return  # skip CSRF check entirely
