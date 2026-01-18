from django.http import JsonResponse
from rest_framework_simplejwt.authentication import JWTAuthentication

class JWTMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.jwt_authenticator = JWTAuthentication()

    def __call__(self, request):
        try:
            user_auth = self.jwt_authenticator.authenticate(request)
            if user_auth:
                request.user, request.auth = user_auth
        except Exception:
            return JsonResponse({'error': 'Invalid or expired token'}, status=401)

        return self.get_response(request)
