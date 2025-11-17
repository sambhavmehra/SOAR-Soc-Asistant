import os
import json
import logging
import firebase_admin
from firebase_admin import credentials
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

def initialize_firebase():
    """
    Initialize Firebase Admin SDK using service account JSON file or environment variables.
    """
    if firebase_admin._apps:
        logger.info("Firebase already initialized")
        return True

    # Method 1: Try to load from service account JSON file
    service_account_path = os.getenv('FIREBASE_SERVICE_ACCOUNT_PATH', 'firebase-service-account.json')

    if os.path.exists(service_account_path):
        try:
            cred = credentials.Certificate(service_account_path)
            firebase_admin.initialize_app(cred)
            logger.info("Firebase initialized successfully using service account JSON file")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize Firebase from JSON file: {str(e)}")
            return False

    # Method 2: Try to load from environment variables
    try:
        firebase_config = {
            "type": os.getenv('FIREBASE_TYPE', "service_account"),
            "project_id": os.getenv('FIREBASE_PROJECT_ID'),
            "private_key_id": os.getenv('FIREBASE_PRIVATE_KEY_ID'),
            "private_key": os.getenv('FIREBASE_PRIVATE_KEY', '').replace('\\n', '\n'),
            "client_email": os.getenv('FIREBASE_CLIENT_EMAIL'),
            "client_id": os.getenv('FIREBASE_CLIENT_ID'),
            "auth_uri": os.getenv('FIREBASE_AUTH_URI', "https://accounts.google.com/o/oauth2/auth"),
            "token_uri": os.getenv('FIREBASE_TOKEN_URI', "https://oauth2.googleapis.com/token"),
            "auth_provider_x509_cert_url": os.getenv('FIREBASE_AUTH_PROVIDER_X509_CERT_URL', "https://www.googleapis.com/oauth2/v1/certs"),
            "client_x509_cert_url": os.getenv('FIREBASE_CLIENT_X509_CERT_URL')
        }

        # Check if required fields are present
        required_fields = ['project_id', 'private_key', 'client_email', 'token_uri']
        missing_fields = [field for field in required_fields if not firebase_config.get(field)]

        if missing_fields:
            logger.warning(f"Missing required Firebase environment variables: {', '.join(missing_fields)}")
            logger.warning("Firebase authentication will not be available")
            return False

        cred = credentials.Certificate(firebase_config)
        firebase_admin.initialize_app(cred)
        logger.info("Firebase initialized successfully using environment variables")
        return True

    except Exception as e:
        logger.error(f"Failed to initialize Firebase from environment variables: {str(e)}")
        logger.warning("Firebase authentication will not be available")
        return False

# Initialize Firebase when this module is imported
firebase_initialized = initialize_firebase()
