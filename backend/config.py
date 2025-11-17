import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    GOOGLE_SHEETS_API_KEY = os.getenv('GOOGLE_SHEETS_API_KEY')
    GOOGLE_SHEETS_ID = os.getenv('GOOGLE_SHEETS_ID', '1PflvP_NfmoVc5b5wBsAIUnM6f6wngqQCt02-uYxEuDk')
    GOOGLE_SHEETS_TAB = os.getenv('GOOGLE_SHEETS_TAB', 'Sheet1')
    GROQ_API_KEY = os.getenv('GROQ_API_KEY')
    N8N_BASE_WEBHOOK_URL = os.getenv('N8N_BASE_WEBHOOK_URL', 'https://shubhammm.app.n8n.cloud/webhook')
   
    N8N_AGENT_URL = os.getenv('N8N_AGENT_URL', 'https://shubhammm.app.n8n.cloud/webhook/soc_assistant')
    N8N_WEBHOOK_CHATBOT = os.getenv('N8N_WEBHOOK_CHATBOT', f'{N8N_BASE_WEBHOOK_URL}/soc_assistant')
    N8N_WEBHOOK_IPSCANNING = os.getenv('N8N_WEBHOOK_IP_SCAN', f'{N8N_BASE_WEBHOOK_URL}/soc_assistan')
    N8N_WEBHOOK_PHISHING = os.getenv('N8N_WEBHOOK_PHISHING', f'{N8N_BASE_WEBHOOK_URL}/soc_assistan')
    FIREBASE_PROJECT_ID = os.getenv('FIREBASE_PROJECT_ID')

    FIREBASE_CLIENT_EMAIL = os.getenv('FIREBASE_CLIENT_EMAIL')

    # IDS Configurationnp
    IDS_MODEL_PATH = os.getenv('IDS_MODEL_PATH', os.path.join(os.path.dirname(__file__), 'services', 'nids_model_balanced.joblib'))
    IDS_LOG_FILE = os.getenv('IDS_LOG_FILE', os.path.join(os.path.dirname(__file__), 'ids_logs.json'))

    # N8n timeout and retry configuration
    N8N_TIMEOUT_SECONDS = int(os.getenv('N8N_TIMEOUT_SECONDS', '25'))
    N8N_MAX_RETRIES = int(os.getenv('N8N_MAX_RETRIES', '3'))
    N8N_RETRY_DELAY = int(os.getenv('N8N_RETRY_DELAY', '2'))
    @classmethod
    def validate(cls):
        required = ['GOOGLE_SHEETS_API_KEY', 'GROQ_API_KEY']
        missing = [key for key in required if not getattr(cls, key)]
        if missing:
            raise ValueError(f"Missing required environment variables: {', '.join(missing)}")
