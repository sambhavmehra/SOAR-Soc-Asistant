import logging
import time
import os
import socket
from datetime import datetime, timedelta
from services.n8n import N8nService
from services.google_sheets import GoogleSheetsService
from services.groq import GroqService
from services.pdf_generator import PDFReportGenerator
from services.ids_monitor import IDSMonitor
from firebase_init import firebase_initialized
from config import Config

logger = logging.getLogger(__name__)

class IntegrationChecker:
    def __init__(self):
        self.n8n_service = N8nService()
        self.google_sheets = GoogleSheetsService()
        self.groq_service = GroqService()
        self.pdf_generator = PDFReportGenerator()
        self.ids_monitor = IDSMonitor()
        self.last_check = {}
        self.check_cache = {}

    def check_n8n_integration(self):
        """Check N8n workflow integrations"""
        try:
            integrations = []

            # Check chatbot workflow
            chatbot_ping = self.n8n_service.ping()
            chatbot_status = 'connected' if chatbot_ping.get('ok', False) else 'error'
            integrations.append({
                'id': 'n8n-chatbot',
                'name': 'N8n Chatbot',
                'type': 'N8n Workflow',
                'status': chatbot_status,
                'lastSync': datetime.now(),
                'events': 0,  # We'll track this separately
                'health': 100 if chatbot_status == 'connected' else 0
            })

            # Check phishing analysis workflow
            phishing_url = getattr(Config, 'N8N_WEBHOOK_PHISHING', None)
            phishing_status = 'connected' if phishing_url else 'error'
            integrations.append({
                'id': 'n8n-phishing',
                'name': 'Phishing Analysis',
                'type': 'N8n Workflow',
                'status': phishing_status,
                'lastSync': datetime.now(),
                'events': 0,
                'health': 100 if phishing_status == 'connected' else 0
            })

            # Check IP scanning workflow
            ip_scan_url = getattr(Config, 'N8N_WEBHOOK_IPSCANNING', None)
            ip_status = 'connected' if ip_scan_url else 'error'
            integrations.append({
                'id': 'n8n-ip-scan',
                'name': 'IP Scanning',
                'type': 'N8n Workflow',
                'status': ip_status,
                'lastSync': datetime.now(),
                'events': 0,
                'health': 100 if ip_status == 'connected' else 0
            })

            return integrations
        except Exception as e:
            logger.error(f"Error checking N8n integrations: {str(e)}")
            return []

    def check_google_sheets_integration(self):
        """Check Google Sheets integration"""
        try:
            # Try to get incidents to test connectivity
            result = self.google_sheets.get_security_incidents()
            status = 'connected' if result.get('success', False) else 'error'
            incident_count = len(result.get('data', [])) if result.get('success') else 0

            return {
                'id': 'google-sheets',
                'name': 'Google Sheets',
                'type': 'Data Storage',
                'status': status,
                'lastSync': datetime.now(),
                'events': incident_count,
                'health': 100 if status == 'connected' else 0
            }
        except Exception as e:
            logger.error(f"Error checking Google Sheets integration: {str(e)}")
            return {
                'id': 'google-sheets',
                'name': 'Google Sheets',
                'type': 'Data Storage',
                'status': 'error',
                'lastSync': datetime.now(),
                'events': 0,
                'health': 0
            }

    def check_groq_integration(self):
        """Check Groq AI integration"""
        try:
            # Test with a simple prompt
            test_result = self.groq_service.chat_completion([
                {"role": "user", "content": "Hello"}
            ])
            status = 'connected' if test_result.get('success', False) else 'error'

            return {
                'id': 'groq-ai',
                'name': 'Groq AI',
                'type': 'AI Service',
                'status': status,
                'lastSync': datetime.now(),
                'events': 0,  # AI calls are not counted as events
                'health': 100 if status == 'connected' else 0
            }
        except Exception as e:
            logger.error(f"Error checking Groq integration: {str(e)}")
            return {
                'id': 'groq-ai',
                'name': 'Groq AI',
                'type': 'AI Service',
                'status': 'error',
                'lastSync': datetime.now(),
                'events': 0,
                'health': 0
            }

    def check_firebase_integration(self):
        """Check Firebase integration"""
        try:
            # Firebase is initialized at startup, so we check if it's working
            status = 'connected' if firebase_initialized else 'error'

            return {
                'id': 'firebase',
                'name': 'Firebase Auth',
                'type': 'Authentication',
                'status': status,
                'lastSync': datetime.now(),
                'events': 0,
                'health': 100 if status == 'connected' else 0
            }
        except Exception as e:
            logger.error(f"Error checking Firebase integration: {str(e)}")
            return {
                'id': 'firebase',
                'name': 'Firebase Auth',
                'type': 'Authentication',
                'status': 'error',
                'lastSync': datetime.now(),
                'events': 0,
                'health': 0
            }

    def check_pdf_generator_integration(self):
        """Check PDF generator integration"""
        try:
            # Test PDF generation with minimal data
            test_conversation_data = {
                'messages': [
                    {'sender': 'user', 'content': 'test message', 'timestamp': datetime.now()},
                    {'sender': 'assistant', 'content': 'test response', 'timestamp': datetime.now()}
                ]
            }
            test_analysis_data = {}
            pdf_bytes = self.pdf_generator.generate_chatbot_report(test_conversation_data, test_analysis_data)
            status = 'connected' if pdf_bytes and len(pdf_bytes) > 0 else 'error'

            return {
                'id': 'pdf-generator',
                'name': 'PDF Generator',
                'type': 'Report Service',
                'status': status,
                'lastSync': datetime.now(),
                'events': 0,
                'health': 100 if status == 'connected' else 0
            }
        except Exception as e:
            logger.error(f"Error checking PDF generator integration: {str(e)}")
            return {
                'id': 'pdf-generator',
                'name': 'PDF Generator',
                'type': 'Report Service',
                'status': 'error',
                'lastSync': datetime.now(),
                'events': 0,
                'health': 0
            }

    def check_ids_monitor_integration(self):
        """Check IDS Monitor integration and self-monitoring"""
        try:
            # Check if IDS monitor is available and get status
            status_info = self.ids_monitor.get_status()
            is_monitoring = status_info.get('is_monitoring', False)
            model_loaded = status_info.get('model_loaded', False)
            stats = status_info.get('stats', {})

            # Determine overall status
            if model_loaded and is_monitoring:
                status = 'connected'
                health = min(100, stats.get('system_health', 100))
            elif model_loaded:
                status = 'idle'  # Model loaded but not monitoring
                health = 50
            else:
                status = 'error'
                health = 0

            return {
                'id': 'ids-monitor',
                'name': 'IDS Monitor',
                'type': 'Network Security',
                'status': status,
                'lastSync': datetime.now(),
                'events': stats.get('packets_processed', 0),
                'health': health,
                'details': {
                    'is_monitoring': is_monitoring,
                    'model_loaded': model_loaded,
                    'packets_processed': stats.get('packets_processed', 0),
                    'alerts_generated': stats.get('alerts_generated', 0),
                    'system_health': stats.get('system_health', 100),
                    'cpu_usage': stats.get('cpu_usage', 0),
                    'memory_usage': stats.get('memory_usage', 0),
                    'uptime': stats.get('uptime', 0)
                }
            }
        except Exception as e:
            logger.error(f"Error checking IDS monitor integration: {str(e)}")
            return {
                'id': 'ids-monitor',
                'name': 'IDS Monitor',
                'type': 'Network Security',
                'status': 'error',
                'lastSync': datetime.now(),
                'events': 0,
                'health': 0,
                'details': {'error': str(e)}
            }

    def auto_detect_integrations(self):
        """Auto-detect available integrations without external calls"""
        detected_integrations = []

        # Check for N8n configuration
        n8n_configured = bool(getattr(Config, 'N8N_BASE_URL', None))
        if n8n_configured:
            detected_integrations.append({
                'id': 'n8n-auto',
                'name': 'N8n (Auto-detected)',
                'type': 'Automation Platform',
                'status': 'configured',
                'auto_detected': True
            })

        # Check for Google Sheets configuration
        sheets_configured = bool(getattr(Config, 'GOOGLE_SHEETS_SPREADSHEET_ID', None) and
                                getattr(Config, 'GOOGLE_SHEETS_API_KEY', None))
        if sheets_configured:
            detected_integrations.append({
                'id': 'google-sheets-auto',
                'name': 'Google Sheets (Auto-detected)',
                'type': 'Data Storage',
                'status': 'configured',
                'auto_detected': True
            })

        # Check for Groq configuration
        groq_configured = bool(getattr(Config, 'GROQ_API_KEY', None))
        if groq_configured:
            detected_integrations.append({
                'id': 'groq-auto',
                'name': 'Groq AI (Auto-detected)',
                'type': 'AI Service',
                'status': 'configured',
                'auto_detected': True
            })

        # Check for Firebase configuration
        firebase_configured = firebase_initialized
        if firebase_configured:
            detected_integrations.append({
                'id': 'firebase-auto',
                'name': 'Firebase (Auto-detected)',
                'type': 'Authentication',
                'status': 'configured',
                'auto_detected': True
            })

        # Check for IDS model file
        model_path = getattr(Config, 'IDS_MODEL_PATH', 'nids_model_balanced.joblib')
        ids_model_exists = os.path.exists(model_path)
        if ids_model_exists:
            detected_integrations.append({
                'id': 'ids-model-auto',
                'name': 'IDS ML Model (Auto-detected)',
                'type': 'Security Model',
                'status': 'available',
                'auto_detected': True
            })

        # Check network interfaces for IDS capability
        try:
            import psutil
            net_interfaces = list(psutil.net_if_addrs().keys())
            if net_interfaces:
                detected_integrations.append({
                    'id': 'network-interfaces-auto',
                    'name': f'Network Interfaces ({len(net_interfaces)} detected)',
                    'type': 'Network Hardware',
                    'status': 'available',
                    'auto_detected': True,
                    'details': {'interfaces': net_interfaces[:5]}  # Show first 5
                })
        except ImportError:
            pass

        return detected_integrations

    def get_all_integrations(self):
        """Get status of all system integrations"""
        integrations = []

        # Check integrations with caching (5 minute cache)
        now = datetime.now()

        def check_with_cache(check_func, cache_key):
            if cache_key in self.check_cache:
                last_check, result = self.check_cache[cache_key]
                if (now - last_check) < timedelta(minutes=5):
                    return result

            result = check_func()
            self.check_cache[cache_key] = (now, result)
            return result

        # N8n integrations
        n8n_integrations = check_with_cache(self.check_n8n_integration, 'n8n')
        integrations.extend(n8n_integrations)

        # Other integrations
        integrations.append(check_with_cache(self.check_google_sheets_integration, 'google_sheets'))
        integrations.append(check_with_cache(self.check_groq_integration, 'groq'))
        integrations.append(check_with_cache(self.check_firebase_integration, 'firebase'))
        integrations.append(check_with_cache(self.check_pdf_generator_integration, 'pdf_generator'))
        integrations.append(check_with_cache(self.check_ids_monitor_integration, 'ids_monitor'))

        # Add auto-detected integrations (no caching needed)
        auto_detected = self.auto_detect_integrations()
        integrations.extend(auto_detected)

        return integrations
