import firebase_admin
from firebase_admin import credentials, auth
from rest_framework import authentication, exceptions
from django.contrib.auth.models import User
from django.conf import settings
import os

# Initialize Firebase Admin SDK
if not firebase_admin._apps:
    cred_path = settings.FIREBASE_SERVICE_ACCOUNT_PATH
    if os.path.exists(cred_path):
        cred = credentials.Certificate(str(cred_path))
        firebase_admin.initialize_app(cred)
    else:
        # For development without service account, skip Firebase init
        pass


class FirebaseAuthentication(authentication.BaseAuthentication):
    """
    Firebase token authentication for REST Framework.
    Verifies Firebase ID tokens and creates/gets Django users.
    """

    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')

        if not auth_header:
            return None  # No auth header, allow anonymous access

        # Extract token from "Bearer <token>"
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return None

        token = parts[1]

        try:
            # Verify the Firebase token
            decoded_token = auth.verify_id_token(token)
            uid = decoded_token['uid']
            email = decoded_token.get('email', f'{uid}@firebase.user')
            name = decoded_token.get('name', '')

            # Get or create Django user
            user, created = User.objects.get_or_create(
                username=uid,
                defaults={
                    'email': email,
                    'first_name': name.split()[0] if name else '',
                    'last_name': ' '.join(name.split()[1:]) if name and len(name.split()) > 1 else '',
                }
            )

            # Update user info if it changed
            if not created:
                if user.email != email:
                    user.email = email
                    user.save()

            return (user, decoded_token)

        except firebase_admin.exceptions.FirebaseError as e:
            raise exceptions.AuthenticationFailed(f'Invalid Firebase token: {str(e)}')
        except Exception as e:
            # If Firebase is not initialized, allow anonymous
            if not firebase_admin._apps:
                return None
            raise exceptions.AuthenticationFailed(f'Authentication failed: {str(e)}')

    def authenticate_header(self, request):
        return 'Bearer'
