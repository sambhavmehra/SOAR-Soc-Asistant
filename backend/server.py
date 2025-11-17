import io
import json
import logging
import os
import uuid
from datetime import datetime, timedelta
import firebase_admin
from firebase_admin import auth
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from functools import wraps
from config import Config
from services.google_sheets import GoogleSheetsService
from services.groq import GroqService
from services.n8n import N8nService
from services.self_learning import SelfLearningService
from services.self_enhancement import SelfEnhancementService
from services.pdf_generator import PDFReportGenerator
from services.integration_checker import IntegrationChecker
from services.ids_monitor import IDSMonitor
from services.scheduler_service import SchedulerService
from firebase_init import firebase_initialized
from chat_history import (
    create_conversation, add_message_to_conversation,
    get_user_conversations, get_conversation, delete_conversation,
    update_conversation_title
)
from chat_endpoints import add_chat_endpoints
from rt_agent import GroqAgent
from actions import REGISTRY, CAPABILITIES
# Configure logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  
agent = GroqAgent()

def verify_firebase_token(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'Authorization token required'}), 401

        token = auth_header.split(' ')[1]
        try:
            decoded_token = auth.verify_id_token(token)
            email = decoded_token['email']
            role = 'admin' if email == 'admin@admin.com' else 'user'
            # Add user info to request context
            request.user = {'email': email, 'role': role, 'uid': decoded_token['uid']}
        except Exception as e:
            logger.error(f"Token verification failed: {str(e)}")
            return jsonify({'success': False, 'error': 'Invalid token'}), 401

        return f(*args, **kwargs)
    return decorated_function

# Initialize services
google_sheets = GoogleSheetsService()
groq_service = GroqService()
n8n_service = N8nService()
self_learning_service = SelfLearningService()
self_enhancement_service = SelfEnhancementService()
pdf_generator = PDFReportGenerator()
integration_checker = IntegrationChecker()
ids_monitor = IDSMonitor()
scheduler_service = SchedulerService()

# Simple in-memory report storage (in production, use database)
report_storage = {}

# Add chat endpoints
add_chat_endpoints(app, verify_firebase_token)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'soar-soc-backend'})

@app.route('/incidents', methods=['GET'])
@verify_firebase_token
def get_incidents():
    """Get all security incidents"""
    try:
        result = google_sheets.get_security_incidents()
        return jsonify(result), 200 if result['success'] else 500
    except Exception as e:
        logger.error(f"Error fetching incidents: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/incidents', methods=['POST'])
def add_incident():
    """Add a new security incident with AI analysis"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400

        # Analyze with AI first
        ai_analysis = groq_service.analyze_security_event(data)
        enriched_data = data.copy()

        if ai_analysis['success']:
            enriched_data.update({
                'severity': ai_analysis['data'].get('severity', data.get('severity', 'Medium')),
                'attackType': ai_analysis['data'].get('attackType', data.get('attackType', 'Unknown')),
                'actionTaken': ai_analysis['data'].get('actions', data.get('actionTaken', 'Alert Sent'))
            })

        # Add to Google Sheets
        result = google_sheets.add_security_incident(enriched_data)
        if result['success']:
            result['aiAnalysis'] = ai_analysis['data'] if ai_analysis['success'] else None

            # Add incident data for self-learning
            self_learning_service.add_incident_data(enriched_data)

        return jsonify(result), 201 if result['success'] else 500
    except Exception as e:
        logger.error(f"Error adding incident: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/incidents/<event_id>/status', methods=['PUT'])
def update_incident_status(event_id):
    """Update incident status"""
    try:
        data = request.get_json()
        if not data or 'status' not in data:
            return jsonify({'success': False, 'error': 'Status required'}), 400

        new_status = data['status']
        action_taken = data.get('actionTaken', 'Updated')

        result = google_sheets.update_incident_status(event_id, new_status, action_taken)
        return jsonify(result), 200 if result['success'] else 500
    except Exception as e:
        logger.error(f"Error updating incident: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/incidents/bulk', methods=['POST'])
def bulk_add_incidents():
    """Bulk add incidents"""
    try:
        data = request.get_json()
        if not data or 'incidents' not in data:
            return jsonify({'success': False, 'error': 'Incidents array required'}), 400

        result = google_sheets.bulk_add_incidents(data['incidents'])
        return jsonify(result), 201 if result['success'] else 500
    except Exception as e:
        logger.error(f"Error bulk adding incidents: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/ai/analyze', methods=['POST'])
@verify_firebase_token
def analyze_event():
    """Analyze security event with AI"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No event data provided'}), 400

        result = groq_service.analyze_security_event(data)
        return jsonify(result), 200 if result['success'] else 500
    except Exception as e:
        logger.error(f"Error analyzing event: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/ai/report', methods=['POST'])
def generate_report():
    """Generate AI incident report"""
    try:
        data = request.get_json()
        if not data or 'incidents' not in data:
            return jsonify({'success': False, 'error': 'Incidents array required'}), 400

        result = groq_service.generate_incident_report(data['incidents'])
        return jsonify(result), 200 if result['success'] else 500
    except Exception as e:
        logger.error(f"Error generating report: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/ai/threat-intelligence', methods=['POST'])
def get_threat_intelligence():
    """Get threat intelligence"""
    try:
        data = request.get_json()
        if not data or 'threatType' not in data:
            return jsonify({'success': False, 'error': 'Threat type required'}), 400

        result = groq_service.get_threat_intelligence(data['threatType'])
        return jsonify(result), 200 if result['success'] else 500
    except Exception as e:
        logger.error(f"Error getting threat intelligence: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/n8n/trigger', methods=['POST'])
def trigger_n8n():
    """Trigger n8n webhook"""
    try:
        data = request.get_json()
        payload = data.get('payload', {})
        headers = data.get('headers', {})

        result = n8n_service.trigger_webhook(payload, headers)
        return jsonify(result), 200 if result['success'] else 500
    except Exception as e:
        logger.error(f"Error triggering n8n: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/n8n/agent', methods=['POST'])
def call_n8n_agent():
    """Call n8n agent"""
    try:
        data = request.get_json()
        input_data = data.get('input', {})
        headers = data.get('headers', {})

        result = n8n_service.call_agent(input_data, headers)
        return jsonify(result), 200 if result['success'] else 500
    except Exception as e:
        logger.error(f"Error calling n8n agent: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/n8n/ping', methods=['GET'])
def ping_n8n():
    """Ping n8n service"""
    try:
        result = n8n_service.ping()
        return jsonify(result), 200
    except Exception as e:
        logger.error(f"Error pinging n8n: {str(e)}")
        return jsonify({'ok': False, 'error': str(e)}), 500

@app.route('/n8n/test-integration', methods=['POST'])
def test_n8n_integration():
    """Test n8n integration"""
    try:
        data = request.get_json()
        integration = data.get('integration', {})
        headers = data.get('headers', {})

        result = n8n_service.test_integration(integration, headers)
        return jsonify(result), 200 if result.get('success', False) else 500
    except Exception as e:
        logger.error(f"Error testing n8n integration: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/n8n/webhook', methods=['POST'])
def proxy_n8n_webhook():
    """Proxy endpoint for n8n webhook calls from frontend"""
    try:
        payload = request.get_json() or {}
        headers = dict(request.headers)
        # Remove hop-by-hop headers
        headers.pop('Host', None)
        headers.pop('Content-Length', None)

        result = n8n_service.trigger_webhook(payload, headers)
        return jsonify(result), 200 if result['success'] else 500
    except Exception as e:
        logger.error(f"Error proxying n8n webhook: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/n8n/agent', methods=['POST'])
def proxy_n8n_agent():
    """Proxy endpoint for n8n agent calls from frontend"""
    try:
        input_data = request.get_json() or {}
        headers = dict(request.headers)
        # Remove hop-by-hop headers
        headers.pop('Host', None)
        headers.pop('Content-Length', None)

        result = n8n_service.call_agent(input_data, headers)
        return jsonify(result), 200 if result['success'] else 500
    except Exception as e:
        logger.error(f"Error proxying n8n agent: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/n8n/ping', methods=['GET'])
def proxy_ping_n8n():
    """Proxy endpoint for n8n ping from frontend"""
    try:
        result = n8n_service.ping()
        return jsonify(result), 200
    except Exception as e:
        logger.error(f"Error proxying n8n ping: {str(e)}")
        return jsonify({'ok': False, 'error': str(e)}), 500

@app.route('/n8n/trigger-workflow', methods=['POST'])
def trigger_n8n_workflow():
    """Trigger a specific n8n workflow"""
    try:
        data = request.get_json()
        workflow_name = data.get('workflow')
        payload = data.get('payload', {})
        headers = data.get('headers', {})

        if not workflow_name:
            return jsonify({'success': False, 'error': 'Workflow name required'}), 400

        result = n8n_service.trigger_workflow(workflow_name, payload, headers)
        return jsonify(result), 200 if result['success'] else 500
    except Exception as e:
        logger.error(f"Error triggering n8n workflow: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/reports/generate', methods=['POST'])
def generate_security_report():
    """Generate and send security report via Telegram"""
    try:
        headers = request.headers
        result = n8n_service.generate_security_report(headers)
        return jsonify(result), 200 if result['success'] else 500
    except Exception as e:
        logger.error(f"Error generating security report: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/chatbot/report', methods=['POST'])
def request_chatbot_report():
    """Request a security report through the chatbot"""
    try:
        data = request.get_json()
        message = data.get('message', 'Generate security report')

        if not message:
            return jsonify({'success': False, 'error': 'Message required'}), 400

        headers = request.headers
        result = n8n_service.request_chatbot_report(message, headers)
        return jsonify(result), 200 if result['success'] else 500
    except Exception as e:
        logger.error(f"Error requesting chatbot report: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/chatbot/generate-report', methods=['POST'])
@verify_firebase_token
def generate_chatbot_security_report():
    """Generate a professional SOC analyst-style PDF report from chatbot conversation and save to reports dashboard"""
    try:
        data = request.get_json()
        if not data or 'conversationData' not in data:
            return jsonify({'success': False, 'error': 'Conversation data required'}), 400

        conversation_data = data['conversationData']
        analysis_data = data.get('analysisData', {})
        report_title = data.get('title', 'Chatbot Security Analysis Report')

        # Generate comprehensive analysis using AI
        messages = [
            {"role": "system", "content": "You are a senior SOC analyst. Analyze this chatbot conversation and provide comprehensive security insights including threats, impact assessment, and recommendations."},
            {"role": "user", "content": f"Analyze this security conversation and provide detailed analysis:\n\n{json.dumps(conversation_data)}"}
        ]

        ai_analysis = groq_service.chat_completion(messages)
        if ai_analysis['success']:
            analysis_data.update({
                'ai_insights': ai_analysis['data']['content'],
                'analysis_timestamp': datetime.now().isoformat()
            })

        # Generate PDF report
        pdf_bytes = pdf_generator.generate_chatbot_report(conversation_data, analysis_data)

        # Generate unique report ID
        report_id = str(uuid.uuid4())

        # Store report in memory
        report_storage[report_id] = {
            'pdf_bytes': pdf_bytes,
            'metadata': {
                'title': report_title,
                'type': 'chatbot_analysis',
                'generated_at': datetime.now().isoformat(),
                'conversation_length': len(conversation_data.get('messages', [])),
                'ai_analysis_included': bool(ai_analysis.get('success')),
                'file_size': len(pdf_bytes),
                'report_id': report_id
            }
        }

        # Clean up old reports (keep only last 10)
        if len(report_storage) > 10:
            oldest_key = min(report_storage.keys(), key=lambda k: report_storage[k]['metadata']['generated_at'])
            del report_storage[oldest_key]

        return jsonify({
            'success': True,
            'message': 'Security report generated successfully',
            'report_metadata': report_storage[report_id]['metadata'],
            'download_url': f'/chatbot/download-report/{report_id}'
        }), 200

    except Exception as e:
        logger.error(f"Error generating chatbot security report: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/chatbot/download-report/<report_id>', methods=['GET'])
@verify_firebase_token
def download_chatbot_report(report_id):
    """Download the generated chatbot PDF report"""
    try:
        # Check if report exists in storage
        if report_id not in report_storage:
            return jsonify({'success': False, 'error': 'Report not found or expired'}), 404

        report_data = report_storage[report_id]
        pdf_bytes = report_data['pdf_bytes']
        metadata = report_data['metadata']

        # Return PDF file with appropriate headers
        response = send_file(
            io.BytesIO(pdf_bytes),
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f"{metadata['title'].replace(' ', '_')}_{metadata['report_id'][:8]}.pdf"
        )

        # Add custom headers for metadata
        response.headers['X-Report-ID'] = report_id
        response.headers['X-Report-Title'] = metadata['title']
        response.headers['X-Generated-At'] = metadata['generated_at']

        return response

    except Exception as e:
        logger.error(f"Error downloading chatbot report {report_id}: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/ai/chat', methods=['POST'])
# @verify_firebase_token
def security_chat():
    """Security chatbot using Groq AI"""
    try:
        data = request.get_json()
        if not data or 'message' not in data:
            return jsonify({'success': False, 'error': 'Message required'}), 400

        message = data['message']
        conversation_history = data.get('conversationHistory', [])
        context = data.get('context', {})

        # Get recent incidents from Google Sheets for context
        incidents_result = google_sheets.get_security_incidents()
        recent_incidents = []
        if incidents_result['success']:
            # Get last 5 incidents for context
            incidents_data = incidents_result['data']
            recent_incidents = incidents_data[-5:] if len(incidents_data) > 5 else incidents_data

        # Build conversation context for AI
        system_prompt = """You are a cybersecurity expert and SOC analyst. Use the recent security incidents provided to inform your responses. Provide clear, concise, and actionable advice on security matters."""

        messages = [
            {"role": "system", "content": system_prompt}
        ]

        # Add recent incidents context if available
        if recent_incidents:
            incidents_context = f"\n\nRecent Security Incidents (last {len(recent_incidents)}):\n"
            for i, incident in enumerate(recent_incidents, 1):
                status = incident.get('status', 'Unknown').strip()
                event_type = incident.get('eventType', incident.get('eventtype', 'Unknown')).strip()
                severity = incident.get('severity', 'Unknown').strip()
                incidents_context += f"{i}. {event_type} - {severity} severity - Status: {status}\n"
            incidents_context += "\nUse this information to provide context-aware responses when discussing security events or incidents."
            messages[0]["content"] += incidents_context

        # Add conversation history (limit to last 10 messages for context)
        for hist_msg in conversation_history[-10:]:
            messages.append({
                "role": hist_msg.get('sender', 'user'),
                "content": hist_msg.get('content', '')
            })

        # Add current message
        messages.append({"role": "user", "content": message})

        # Add context if provided
        if context:
            context_str = f"\n\nAdditional context: {json.dumps(context)}"
            messages[-1]["content"] += context_str

        result = groq_service.chat_completion(messages)

        if result['success']:
            return jsonify({
                'success': True,
                'reply': result['data']['content'],
                'data': result.get('data', {}),
                'actions': result.get('actions', []),
                'incidentsContext': len(recent_incidents)  # Number of recent incidents used for context
            }), 200
        else:
            return jsonify({'success': False, 'error': result.get('error', 'AI chat failed')}), 500
    except Exception as e:
        logger.error(f"Error in security chat: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/ai/action', methods=['POST'])
def execute_action():
    """Execute a security action from the chatbot"""
    try:
        data = request.get_json()
        if not data or 'action' not in data:
            return jsonify({'success': False, 'error': 'Action data required'}), 400

        action = data['action']
        action_type = action.get('type')
        action_data = action.get('data', {})

        if not action_type:
            return jsonify({'success': False, 'error': 'Action type required'}), 400

        logger.info(f"Executing action: {action_type} with data: {action_data}")

        # Handle different action types
        if action_type == 'investigate_ip':
            ip = action_data.get('ip') or action_data.get('data')
            if not ip:
                return jsonify({'success': False, 'error': 'IP address required for investigation'}), 400

            result = n8n_service.trigger_workflow('ip-scanning', {'ip': ip})
            return jsonify({
                'success': result['success'],
                'action': action_type,
                'result': result.get('data', {}),
                'error': result.get('error')
            }), 200 if result['success'] else 500

        elif action_type == 'investigate_url':
            url = action_data.get('url') or action_data.get('data')
            if not url:
                return jsonify({'success': False, 'error': 'URL required for investigation'}), 400

            result = n8n_service.trigger_workflow('phishing-analysis', {'url': url})
            return jsonify({
                'success': result['success'],
                'action': action_type,
                'result': result.get('data', {}),
                'error': result.get('error')
            }), 200 if result['success'] else 500

        elif action_type == 'deep_analysis':
            # Perform deep security analysis using Groq
            analysis_prompt = f"""Perform a deep security analysis on the following data: {json.dumps(action_data)}

Please provide:
1. Detailed threat assessment
2. Potential attack vectors
3. Recommended mitigation strategies
4. Risk level assessment"""

            messages = [
                {"role": "system", "content": "You are a senior cybersecurity analyst performing deep threat analysis."},
                {"role": "user", "content": analysis_prompt}
            ]

            result = groq_service.chat_completion(messages)
            return jsonify({
                'success': result['success'],
                'action': action_type,
                'result': result.get('data', {}),
                'error': result.get('error')
            }), 200 if result['success'] else 500

        elif action_type == 'generate_report':
            # Generate security incident report
            incidents_result = google_sheets.get_security_incidents()
            if not incidents_result['success']:
                return jsonify({'success': False, 'error': 'Failed to fetch incidents for report'}), 500

            incidents = incidents_result['data']
            if not incidents:
                return jsonify({'success': False, 'error': 'No incidents available for report generation'}), 400

            result = groq_service.generate_incident_report(incidents)
            return jsonify({
                'success': result['success'],
                'action': action_type,
                'result': result.get('data', {}),
                'error': result.get('error')
            }), 200 if result['success'] else 500

        elif action_type == 'yara_scan':
            # Placeholder for YARA scan - would integrate with external YARA service
            hash_value = action_data.get('hash') or action_data.get('data')
            if not hash_value:
                return jsonify({'success': False, 'error': 'Hash required for YARA scan'}), 400

            # Simulate YARA scan result (placeholder)
            result = {
                'success': True,
                'data': {
                    'scan_result': 'No YARA rules matched',
                    'hash': hash_value,
                    'rules_checked': 0,
                    'note': 'YARA integration not yet implemented - placeholder response'
                }
            }
            return jsonify({
                'success': True,
                'action': action_type,
                'result': result['data']
            }), 200

        elif action_type == 'av_reputation':
            # Placeholder for antivirus reputation check
            hash_value = action_data.get('hash') or action_data.get('data')
            if not hash_value:
                return jsonify({'success': False, 'error': 'Hash required for AV reputation check'}), 400

            # Simulate AV reputation result (placeholder)
            result = {
                'success': True,
                'data': {
                    'reputation': 'Unknown',
                    'hash': hash_value,
                    'engines_checked': 0,
                    'detections': 0,
                    'note': 'Antivirus reputation check not yet implemented - placeholder response'
                }
            }
            return jsonify({
                'success': True,
                'action': action_type,
                'result': result['data']
            }), 200

        else:
            return jsonify({'success': False, 'error': f'Unknown action type: {action_type}'}), 400

    except Exception as e:
        logger.error(f"Error executing action {action_type}: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500
@app.route("/chat/agent", methods=["POST"])
def chat_agent():
    """
    Input:  { message: string, context?: object }
    Output: { success, reply, data?, actions:[{type,label,data?}] }
    """
    body = request.get_json(silent=True) or {}
    res = agent.propose(
        user_message = body.get("message",""),
        capabilities = CAPABILITIES,
        context      = body.get("context") or {}
    )
    return jsonify(res), 200 if res.get("success") else 500
@app.route("/chat/execute", methods=["POST"])
def chat_execute():
    """
    Input:  { action: string, data?: object, context?: object }
    Output: { success, reply, data?, actions: [] }
    """
    body    = request.get_json(silent=True) or {}
    action  = (body.get("action") or "").strip().lower()
    data    = body.get("data") or {}
    context = body.get("context") or {}

    if action in REGISTRY:
        try:
            return jsonify(REGISTRY[action](data, context)), 200
        except Exception as e:
            return jsonify({"success": False, "reply": f"Handler error: {e}", "data": None, "actions": []}), 500

    # Anything else → ask Groq to execute
    res = agent.execute_unknown(action, data, context)
    return jsonify(res), 200 if res.get("success") else 500

@app.route('/metrics', methods=['GET'])
@verify_firebase_token
def get_metrics():
    """Get dashboard metrics"""
    try:
        incidents_result = google_sheets.get_security_incidents()
        if not incidents_result['success']:
            return jsonify({'success': False, 'error': 'Failed to fetch incidents for metrics'}), 500

        incidents = incidents_result['data']
        total_incidents = len(incidents)
        active_incidents = len([i for i in incidents if i.get('status', '').lower() in ['open', 'investigating']])
        critical_incidents = len([i for i in incidents if i.get('severity', '').lower() == 'critical'])
        high_severity = len([i for i in incidents if i.get('severity', '').lower() == 'high'])

        # Calculate dynamic metrics based on real data
        blocked_threats = sum([int(i.get('blockedConnections', 0)) for i in incidents if i.get('blockedConnections')])
        system_health = 95 if active_incidents < 5 else 85  # Dynamic health based on active incidents

        metrics = {
            'activeIncidents': active_incidents,
            'totalIncidents': total_incidents,
            'criticalIncidents': critical_incidents,
            'highSeverityIncidents': high_severity,
            'blockedThreats': blocked_threats or (total_incidents * 5),  # Use real data or estimate
            'systemHealth': system_health,
            'automationStatus': 'online'  # Since we're not using N8n yet
        }

        return jsonify({'success': True, 'data': metrics}), 200
    except Exception as e:
        logger.error(f"Error getting metrics: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/auth/signup', methods=['POST'])
def signup():
    """Signup user and add to database"""
    try:
        data = request.get_json()
        if not data or 'email' not in data:
            return jsonify({'success': False, 'error': 'Email required'}), 400

        email = data['email']
        role = 'admin' if email == 'admin@admin.com' else 'employee'

        # Add to users sheet
        result = google_sheets.add_user(email, role)
        if result['success']:
            return jsonify({'success': True, 'data': {'email': email, 'role': role}}), 201
        else:
            return jsonify(result), 500
    except Exception as e:
        logger.error(f"Error in signup: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/auth/verify', methods=['POST'])
def verify_token():
    """Verify Firebase token and get user role"""
    try:
        data = request.get_json()
        if not data or 'token' not in data:
            return jsonify({'success': False, 'error': 'Token required'}), 400

        token = data['token']

        # Verify Firebase token
        decoded_token = auth.verify_id_token(token)
        email = decoded_token['email']

        # Get user role from database
        user_result = google_sheets.get_user_by_email(email)
        if user_result['success'] and user_result['data']:
            role = user_result['data']['role']
        else:
            # If not found, assume employee (for existing users)
            role = 'employee'

        return jsonify({
            'success': True,
            'data': {
                'email': email,
                'role': role,
                'uid': decoded_token['uid']
            }
        }), 200
    except Exception as e:
        logger.error(f"Error verifying token: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 401

# Self-Enhancement API Endpoints

@app.route('/ai/self-enhance/analyze', methods=['GET'])
def analyze_codebase():
    """Analyze the codebase for improvements (limited for performance)"""
    try:
        # Check if development mode or has auth token
        auth_header = request.headers.get('Authorization')
        is_development = os.getenv('FLASK_ENV') == 'development' or request.remote_addr in ['127.0.0.1', 'localhost']

        if not auth_header and not is_development:
            return jsonify({'success': False, 'error': 'Authorization token required'}), 401

        if auth_header and not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'Invalid authorization header'}), 401

        # Get max_files parameter (default 10 for performance)
        max_files = request.args.get('max_files', 10, type=int)
        if max_files > 50:  # Safety limit
            max_files = 50

        result = self_enhancement_service.analyze_codebase(max_files=max_files)
        return jsonify(result), 200 if result['success'] else 500
    except Exception as e:
        logger.error(f"Error analyzing codebase: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/ai/self-enhance/generate', methods=['POST'])
@verify_firebase_token
def generate_code():
    """Generate new code based on requirements"""
    try:
        data = request.get_json()
        if not data or 'requirement' not in data:
            return jsonify({'success': False, 'error': 'Requirement required'}), 400

        requirement = data['requirement']
        context = data.get('context', {})

        result = self_enhancement_service.generate_code(requirement, context)
        return jsonify(result), 200 if result['success'] else 500
    except Exception as e:
        logger.error(f"Error generating code: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/ai/self-enhance/modify', methods=['POST'])
@verify_firebase_token
def modify_code():
    """Modify existing code"""
    try:
        data = request.get_json()
        if not data or 'file_path' not in data or 'modification_request' not in data:
            return jsonify({'success': False, 'error': 'File path and modification request required'}), 400

        file_path = data['file_path']
        modification_request = data['modification_request']

        result = self_enhancement_service.modify_code(file_path, modification_request)
        return jsonify(result), 200 if result['success'] else 500
    except Exception as e:
        logger.error(f"Error modifying code: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/ai/self-enhance/feature', methods=['POST'])
@verify_firebase_token
def implement_feature():
    """Implement a new feature end-to-end"""
    try:
        data = request.get_json()
        if not data or 'feature_request' not in data:
            return jsonify({'success': False, 'error': 'Feature request required'}), 400

        feature_request = data['feature_request']
        result = self_enhancement_service.implement_feature(feature_request)
        return jsonify(result), 200 if result['success'] else 500
    except Exception as e:
        logger.error(f"Error implementing feature: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/ai/self-enhance/fix-bug', methods=['POST'])
@verify_firebase_token
def fix_bug():
    """Fix a bug in the codebase"""
    try:
        data = request.get_json()
        if not data or 'bug_description' not in data:
            return jsonify({'success': False, 'error': 'Bug description required'}), 400

        bug_description = data['bug_description']
        file_path = data.get('file_path')

        result = self_enhancement_service.fix_bug(bug_description, file_path)
        return jsonify(result), 200 if result['success'] else 500
    except Exception as e:
        logger.error(f"Error fixing bug: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/ai/self-enhance/optimize', methods=['POST'])
@verify_firebase_token
def optimize_performance():
    """Optimize performance of a component"""
    try:
        data = request.get_json()
        if not data or 'component' not in data:
            return jsonify({'success': False, 'error': 'Component name required'}), 400

        component = data['component']
        result = self_enhancement_service.optimize_performance(component)
        return jsonify(result), 200 if result['success'] else 500
    except Exception as e:
        logger.error(f"Error optimizing performance: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/ai/self-enhance/integrate', methods=['POST'])
@verify_firebase_token
def integrate_tool():
    """Integrate a new external tool"""
    try:
        data = request.get_json()
        if not data or 'tool_name' not in data or 'purpose' not in data:
            return jsonify({'success': False, 'error': 'Tool name and purpose required'}), 400

        tool_name = data['tool_name']
        purpose = data['purpose']

        result = self_enhancement_service.integrate_tool(tool_name, purpose)
        return jsonify(result), 200 if result['success'] else 500
    except Exception as e:
        logger.error(f"Error integrating tool: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/ai/self-enhance/apply', methods=['POST'])
@verify_firebase_token
def apply_changes():
    """Apply code changes to the filesystem"""
    try:
        data = request.get_json()
        if not data or 'changes' not in data:
            return jsonify({'success': False, 'error': 'Changes required'}), 400

        changes = data['changes']
        approval_required = data.get('approval_required', True)

        result = self_enhancement_service.apply_changes(changes, approval_required)
        return jsonify(result), 200 if result['success'] else 500
    except Exception as e:
        logger.error(f"Error applying changes: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/ai/self-enhance/suggestions', methods=['GET'])
@verify_firebase_token
def get_self_improvement_suggestions():
    """Get suggestions for improving the self-enhancement system"""
    try:
        result = self_enhancement_service.get_self_improvement_suggestions()
        return jsonify(result), 200 if result['success'] else 500
    except Exception as e:
        logger.error(f"Error getting self-improvement suggestions: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/ai/enhance-n8n-response', methods=['POST'])
@verify_firebase_token
def enhance_n8n_response():
    """Enhance n8n response using Groq AI"""
    try:
        data = request.get_json()
        if not data or 'n8nResponse' not in data or 'userMessage' not in data:
            return jsonify({'success': False, 'error': 'n8nResponse and userMessage required'}), 400

        n8n_response = data['n8nResponse']
        user_message = data['userMessage']
        conversation_history = data.get('conversationHistory', [])

        result = groq_service.enhance_n8n_response(n8n_response, user_message, conversation_history)
        return jsonify(result), 200 if result['success'] else 500
    except Exception as e:
        logger.error(f"Error enhancing n8n response: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/config/<key>', methods=['GET'])
@verify_firebase_token
def get_config_value(key):
    """Get a configuration value"""
    try:
        # Only allow specific config keys for security
        allowed_keys = ['CHATBOT_ALWAYS_USE_GROQ']
        if key not in allowed_keys:
            return jsonify({'success': False, 'error': 'Configuration key not accessible'}), 403

        value = getattr(Config, key, None)
        return jsonify({'success': True, 'value': value}), 200
    except Exception as e:
        logger.error(f"Error getting config {key}: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/integrations/status', methods=['GET'])
@verify_firebase_token
def get_integrations_status():
    """Get status of all system integrations"""
    try:
        integrations = integration_checker.get_all_integrations()
        return jsonify({'success': True, 'data': integrations}), 200
    except Exception as e:
        logger.error(f"Error getting integrations status: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/ids/start', methods=['POST'])
@verify_firebase_token
def start_ids_monitoring():
    """Start IDS monitoring"""
    try:
        success = ids_monitor.start_monitoring()
        if success:
            return jsonify({'success': True, 'message': 'IDS monitoring started successfully'}), 200
        else:
            return jsonify({'success': False, 'error': 'Failed to start IDS monitoring'}), 500
    except Exception as e:
        logger.error(f"Error starting IDS monitoring: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/ids/stop', methods=['POST'])
@verify_firebase_token
def stop_ids_monitoring():
    """Stop IDS monitoring"""
    try:
        success = ids_monitor.stop_monitoring()
        if success:
            return jsonify({'success': True, 'message': 'IDS monitoring stopped successfully'}), 200
        else:
            return jsonify({'success': False, 'error': 'Failed to stop IDS monitoring'}), 500
    except Exception as e:
        logger.error(f"Error stopping IDS monitoring: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/ids/status', methods=['GET'])
@verify_firebase_token
def get_ids_status():
    """Get IDS monitoring status"""
    try:
        status = ids_monitor.get_status()
        return jsonify({'success': True, 'data': status}), 200
    except Exception as e:
        logger.error(f"Error getting IDS status: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/ids/logs', methods=['GET'])
@verify_firebase_token
def get_ids_logs():
    """Get IDS logs for chatbot"""
    try:
        limit = request.args.get('limit', 50, type=int)
        logs = ids_monitor.get_recent_logs(limit=limit)
        return jsonify({'success': True, 'data': logs}), 200
    except Exception as e:
        logger.error(f"Error getting IDS logs: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/ids/logs/ip/<ip_address>', methods=['GET'])
@verify_firebase_token
def get_ids_logs_by_ip(ip_address):
    """Get IDS logs for specific IP address"""
    try:
        limit = request.args.get('limit', 20, type=int)
        logs = ids_monitor.get_logs_by_ip(ip_address, limit=limit)
        return jsonify({'success': True, 'data': logs}), 200
    except Exception as e:
        logger.error(f"Error getting IDS logs for IP {ip_address}: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/ids/alerts', methods=['GET'])
@verify_firebase_token
def get_ids_alerts():
    """Get IDS alerts summary"""
    try:
        alerts = ids_monitor.get_alerts_summary()
        return jsonify({'success': True, 'data': alerts}), 200
    except Exception as e:
        logger.error(f"Error getting IDS alerts: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/integrations/auto-detect', methods=['GET'])
@verify_firebase_token
def auto_detect_integrations():
    """Auto-detect available integrations"""
    try:
        detected_integrations = integration_checker.auto_detect_integrations()
        return jsonify({'success': True, 'data': detected_integrations}), 200
    except Exception as e:
        logger.error(f"Error auto-detecting integrations: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

# Scheduler API Endpoints

@app.route('/scheduler/tasks', methods=['GET'])
@verify_firebase_token
def get_scheduled_tasks():
    """Get all scheduled tasks"""
    try:
        task_type = request.args.get('type')
        status = request.args.get('status')
        result = scheduler_service.get_tasks(task_type=task_type, status=status)
        return jsonify(result), 200 if result['success'] else 500
    except Exception as e:
        logger.error(f"Error getting scheduled tasks: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/scheduler/tasks', methods=['POST'])
@verify_firebase_token
def create_scheduled_task():
    """Create a new scheduled task"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No task data provided'}), 400

        # Add created_by from authenticated user
        if hasattr(request, 'user') and request.user:
            data['created_by'] = request.user.get('email', 'system')

        result = scheduler_service.create_task(data)
        return jsonify(result), 201 if result['success'] else 500
    except Exception as e:
        logger.error(f"Error creating scheduled task: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/scheduler/tasks/<task_id>', methods=['GET'])
@verify_firebase_token
def get_scheduled_task(task_id):
    """Get a specific scheduled task"""
    try:
        result = scheduler_service.get_task(task_id)
        return jsonify(result), 200 if result['success'] else 404
    except Exception as e:
        logger.error(f"Error getting scheduled task {task_id}: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/scheduler/tasks/<task_id>', methods=['PUT'])
@verify_firebase_token
def update_scheduled_task(task_id):
    """Update a scheduled task"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No update data provided'}), 400

        result = scheduler_service.update_task(task_id, data)
        return jsonify(result), 200 if result['success'] else 500
    except Exception as e:
        logger.error(f"Error updating scheduled task {task_id}: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/scheduler/tasks/<task_id>', methods=['DELETE'])
@verify_firebase_token
def delete_scheduled_task(task_id):
    """Delete a scheduled task"""
    try:
        result = scheduler_service.delete_task(task_id)
        return jsonify(result), 200 if result['success'] else 500
    except Exception as e:
        logger.error(f"Error deleting scheduled task {task_id}: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/scheduler/tasks/<task_id>/pause', methods=['POST'])
@verify_firebase_token
def pause_scheduled_task(task_id):
    """Pause a scheduled task"""
    try:
        result = scheduler_service.pause_task(task_id)
        return jsonify(result), 200 if result['success'] else 500
    except Exception as e:
        logger.error(f"Error pausing scheduled task {task_id}: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/scheduler/tasks/<task_id>/resume', methods=['POST'])
@verify_firebase_token
def resume_scheduled_task(task_id):
    """Resume a paused scheduled task"""
    try:
        result = scheduler_service.resume_task(task_id)
        return jsonify(result), 200 if result['success'] else 500
    except Exception as e:
        logger.error(f"Error resuming scheduled task {task_id}: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/scheduler/status', methods=['GET'])
@verify_firebase_token
def get_scheduler_status():
    """Get scheduler status"""
    try:
        result = scheduler_service.get_scheduler_status()
        return jsonify(result), 200 if result['success'] else 500
    except Exception as e:
        logger.error(f"Error getting scheduler status: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/incidents/json', methods=['GET'])
@verify_firebase_token
def get_incidents_from_json():
    """Get security incidents from JSON file"""
    try:
        json_file_path = os.path.join(os.path.dirname(__file__), 'services', 'incident_data.json')

        if not os.path.exists(json_file_path):
            return jsonify({'success': False, 'error': 'Incident data file not found'}), 404

        with open(json_file_path, 'r') as f:
            incidents = json.load(f)

        return jsonify({'success': True, 'data': incidents}), 200
    except Exception as e:
        logger.error(f"Error reading incidents from JSON: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/incidents/ids', methods=['GET'])
@verify_firebase_token
def get_incidents_from_ids():
    """Get security incidents from IDS logs (only actual incidents, not normal traffic)"""
    try:
        ids_file_path = os.path.join(os.path.dirname(__file__), 'services', 'ids_logs.json')

        if not os.path.exists(ids_file_path):
            return jsonify({'success': False, 'error': 'IDS logs file not found'}), 404

        with open(ids_file_path, 'r') as f:
            ids_logs = [json.loads(line.strip()) for line in f if line.strip()]

        # Filter to only actual incidents (not normal traffic)
        incidents = []
        for log in ids_logs:
            # Only include logs that are actual security incidents
            if (log.get('alert_level') != 'normal' and log.get('ml_prediction') == 1):
                # Transform IDS log to incident format
                incident = {
                    'timestamp': log.get('timestamp'),
                    'eventid': f"IDS-{log.get('timestamp', '').replace(' ', '-').replace(':', '-')}",
                    'severity': 'Critical' if log.get('alert_level') == 'alert' else 'High',
                    'sourceip': log.get('source_ip'),
                    'destinationip': log.get('destination_ip'),
                    'attacktype': log.get('detection', 'Unknown'),
                    'status': 'open' if log.get('status') == 'blocked' else 'investigating',
                    'actiontaken': 'Blocked' if log.get('status') == 'blocked' else 'Alert Sent',
                    'protocol': log.get('protocol'),
                    'packet_size': log.get('packet_size'),
                    'frequency': log.get('frequency'),
                    'http_traffic': log.get('http_traffic', False)
                }
                incidents.append(incident)

        # Sort by timestamp (most recent first)
        incidents.sort(key=lambda x: x.get('timestamp', ''), reverse=True)

        return jsonify({'success': True, 'data': incidents}), 200
    except Exception as e:
        logger.error(f"Error reading incidents from IDS logs: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
