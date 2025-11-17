import json
import logging
from groq import Groq
from config import Config

logger = logging.getLogger(__name__)

class GroqService:
    def __init__(self):
        self.client = Groq(api_key=Config.GROQ_API_KEY)

    def analyze_security_event(self, event_data):
        """Analyze security events using Groq AI"""
        try:
            prompt = f"""
            Analyze this security event and provide insights:

            Source IP: {event_data.get('sourceIp')}
            Destination IP: {event_data.get('destinationIp')}
            Event Type: {event_data.get('eventType')}
            Timestamp: {event_data.get('timestamp')}
            Additional Info: {json.dumps(event_data.get('additionalInfo', {}))}

            Please provide:
            1. Threat severity assessment (High, Medium, Low)
            2. Attack type classification
            3. Recommended actions
            4. Brief explanation of the threat

            Format your response as a JSON object with keys: severity, attackType, actions, explanation
            """

            response = self.client.chat.completions.create(
                messages=[
                    {
                        'role': 'system',
                        'content': 'You are a cybersecurity expert analyzing security events. Always respond with valid JSON.'
                    },
                    {
                        'role': 'user',
                        'content': prompt
                    }
                ],
                model='meta-llama/llama-guard-4-12b',
                temperature=0.1,
                max_tokens=1000
            )

            content = response.choices[0].message.content
            # Clean up response - more robust cleaning
            cleaned_content = content.replace('```json', '').replace('```', '').strip()
            # Remove any leading/trailing non-JSON text
            start_idx = cleaned_content.find('{')
            end_idx = cleaned_content.rfind('}') + 1
            if start_idx != -1 and end_idx > start_idx:
                json_content = cleaned_content[start_idx:end_idx]
                try:
                    ai_analysis = json.loads(json_content)
                except json.JSONDecodeError:
                    ai_analysis = {'severity': 'Medium', 'attackType': 'Unknown', 'actions': 'Investigate', 'explanation': content}
            else:
                ai_analysis = {'severity': 'Medium', 'attackType': 'Unknown', 'actions': 'Investigate', 'explanation': content}

            return {'success': True, 'data': ai_analysis}
        except Exception as e:
            logger.error(f"Groq analysis error: {str(e)}")
            return {'success': False, 'error': str(e)}

    def generate_incident_report(self, incidents):
        """Generate security incident report"""
        try:
            # If single incident, generate detailed incident report
            if len(incidents) == 1:
                return self.generate_detailed_incident_report(incidents[0])

            incident_summary = [
                {
                    'eventId': inc.get('eventId'),
                    'severity': inc.get('severity'),
                    'attackType': inc.get('attackType'),
                    'status': inc.get('status'),
                    'timestamp': inc.get('timestamp')
                } for inc in incidents
            ]

            prompt = f"""
            Generate a comprehensive security incident report based on these incidents:

            {json.dumps(incident_summary, indent=2)}

            Please provide:
            1. Executive summary
            2. Incident statistics
            3. Top threats identified
            4. Recommended actions
            5. Risk assessment

            Format as JSON with keys: executiveSummary, statistics, topThreats, recommendations, riskAssessment
            """

            response = self.client.chat.completions.create(
                messages=[
                    {
                        'role': 'system',
                        'content': 'You are a cybersecurity analyst creating incident reports. Always respond with valid JSON.'
                    },
                    {
                        'role': 'user',
                        'content': prompt
                    }
                ],
                model='llama-3.1-8b-instant',
                temperature=0.2,
                max_tokens=2000
            )

            content = response.choices[0].message.content
            cleaned_content = content.replace('```json', '').replace('```', '').strip()
            # Remove any leading/trailing non-JSON text
            start_idx = cleaned_content.find('{')
            end_idx = cleaned_content.rfind('}') + 1
            if start_idx != -1 and end_idx > start_idx:
                json_content = cleaned_content[start_idx:end_idx]
                try:
                    report = json.loads(json_content)
                except json.JSONDecodeError:
                    report = {'error': 'Failed to parse AI response', 'raw_content': content}
            else:
                report = {'error': 'No JSON found in response', 'raw_content': content}

            return {'success': True, 'data': report}
        except Exception as e:
            logger.error(f"Groq report generation error: {str(e)}")
            return {'success': False, 'error': str(e)}

    def generate_detailed_incident_report(self, incident):
        """Generate detailed report for a single incident"""
        try:
            prompt = f"""
            Generate a detailed cybersecurity incident report for this specific incident:

            Incident Details:
            {json.dumps(incident, indent=2)}

            As a senior SOC analyst, provide a comprehensive incident report that includes:

            1. Incident Overview - What happened, when, and how it was detected
            2. Timeline of Events - Chronological sequence with timestamps for each step
            3. Attack Analysis - How the attack occurred, techniques used, indicators of compromise
            4. Impact Assessment - What was affected, potential damage, business impact
            5. Response Actions - Step-by-step actions taken by the security team
            6. Containment & Eradication - How the threat was contained and removed
            7. Recovery Steps - How systems were restored to normal operation
            8. Lessons Learned - What was learned and recommendations for prevention
            9. Evidence & Artifacts - Key logs, alerts, and forensic evidence collected

            Format as JSON with keys: incidentOverview, timeline, attackAnalysis, impactAssessment, responseActions, containment, recovery, lessonsLearned, evidence
            """

            response = self.client.chat.completions.create(
                messages=[
                    {
                        'role': 'system',
                        'content': 'You are a senior cybersecurity incident response analyst. Provide detailed, technical incident reports with specific timelines, actions taken, and forensic details. Always respond with valid JSON.'
                    },
                    {
                        'role': 'user',
                        'content': prompt
                    }
                ],
                model='llama-3.1-8b-instant',
                temperature=0.1,
                max_tokens=3000
            )

            content = response.choices[0].message.content
            cleaned_content = content.replace('```json', '').replace('```', '').strip()
            # Remove any leading/trailing non-JSON text
            start_idx = cleaned_content.find('{')
            end_idx = cleaned_content.rfind('}') + 1
            if start_idx != -1 and end_idx > start_idx:
                json_content = cleaned_content[start_idx:end_idx]
                try:
                    detailed_report = json.loads(json_content)
                except json.JSONDecodeError:
                    detailed_report = {'error': 'Failed to parse AI response', 'raw_content': content}
            else:
                detailed_report = {'error': 'No JSON found in response', 'raw_content': content}

            return {'success': True, 'data': detailed_report}
        except Exception as e:
            logger.error(f"Groq detailed incident report error: {str(e)}")
            return {'success': False, 'error': str(e)}

    def get_threat_intelligence(self, threat_type):
        """Get threat intelligence"""
        try:
            prompt = f"""
            Provide threat intelligence information about: {threat_type}

            Include:
            1. Common attack patterns
            2. Indicators of compromise (IOCs)
            3. Prevention strategies
            4. Current threat landscape
            5. Risk level assessment

            Format as JSON with keys: attackPatterns, iocs, prevention, threatLandscape, riskLevel
            """

            response = self.client.chat.completions.create(
                messages=[
                    {
                        'role': 'system',
                        'content': 'You are a threat intelligence expert. Provide accurate and actionable security information. Always respond with valid JSON.'
                    },
                    {
                        'role': 'user',
                        'content': prompt
                    }
                ],
                model='llama-3.1-8b-instant',
                temperature=0.1,
                max_tokens=1500
            )

            content = response.choices[0].message.content
            cleaned_content = content.replace('```json', '').replace('```', '').strip()
            # Remove any leading/trailing non-JSON text
            start_idx = cleaned_content.find('{')
            end_idx = cleaned_content.rfind('}') + 1
            if start_idx != -1 and end_idx > start_idx:
                json_content = cleaned_content[start_idx:end_idx]
                try:
                    intelligence = json.loads(json_content)
                except json.JSONDecodeError:
                    intelligence = {'error': 'Failed to parse AI response', 'raw_content': content}
            else:
                intelligence = {'error': 'No JSON found in response', 'raw_content': content}

            return {'success': True, 'data': intelligence}
        except Exception as e:
            logger.error(f"Groq threat intelligence error: {str(e)}")
            return {'success': False, 'error': str(e)}

    def chat_completion(self, messages):
        """Generate chat completion using Groq AI"""
        try:
            response = self.client.chat.completions.create(
                messages=messages,
                model='llama-3.1-8b-instant',
                temperature=0.7,
                max_tokens=1000
            )

            content = response.choices[0].message.content

            # Analyze conversation context and generate appropriate action buttons
            actions = self._generate_contextual_actions(messages, content)

            return {'success': True, 'data': {'content': content}, 'actions': actions}
        except Exception as e:
            logger.error(f"Groq chat completion error: {str(e)}")
            return {'success': False, 'error': str(e)}

    def _generate_contextual_actions(self, messages, content):
        """Generate contextual action buttons based on conversation and response content"""
        try:
            # Extract the last user message for context
            user_messages = [msg for msg in messages if msg.get('role') == 'user']
            last_user_message = user_messages[-1]['content'] if user_messages else ''

            # Analyze content and user query to determine appropriate actions
            actions = []
            content_lower = content.lower()
            user_lower = last_user_message.lower()

            # Determine query intent and context
            is_security_query = any(keyword in user_lower for keyword in [
                'security', 'threat', 'attack', 'breach', 'incident', 'malware', 'virus',
                'hack', 'intrusion', 'compromise', 'vulnerability', 'exploit', 'cve',
                'firewall', 'intrusion', 'detection', 'alert', 'log', 'monitor'
            ])

            is_ip_related = any(keyword in user_lower for keyword in ['ip', 'address', '192.', '10.', '172.', '127.'])
            is_network_related = any(keyword in user_lower for keyword in ['network', 'traffic', 'connection', 'port', 'scan'])
            is_analysis_request = any(keyword in user_lower for keyword in ['analyze', 'investigate', 'check', 'examine', 'review'])
            is_action_request = any(keyword in user_lower for keyword in ['block', 'isolate', 'patch', 'fix', 'resolve'])
            is_general_question = any(keyword in user_lower for keyword in [
                'what', 'how', 'why', 'when', 'where', 'who', 'explain', 'tell me about'
            ])

            # Enhanced detection for self-enhancement opportunities
            is_improvement_request = any(keyword in user_lower for keyword in [
                'improve', 'enhance', 'upgrade', 'optimize', 'better', 'add feature',
                'new functionality', 'modify', 'change', 'update', 'fix', 'bug',
                'code', 'development', 'programming', 'implement'
            ])

            is_system_related = any(keyword in user_lower for keyword in [
                'system', 'application', 'software', 'codebase', 'dashboard', 'interface',
                'ui', 'ux', 'frontend', 'backend', 'database', 'api', 'service',
                'traffic', 'analysis', 'monitoring', 'alert', 'report', 'log',
                'security', 'authentication', 'authorization', 'encryption'
            ])

            is_self_reference = any(keyword in user_lower for keyword in [
                'yourself', 'you', 'your', 'chatbot', 'assistant', 'ai', 'bot'
            ])

            # Intelligent self-enhancement detection
            should_offer_self_enhancement = (
                (is_improvement_request and is_system_related) or  # "improve the dashboard"
                (is_self_reference and is_improvement_request) or  # "improve yourself"
                (is_security_query and is_improvement_request) or  # "improve security monitoring"
                (len(user_lower.split()) > 5 and is_system_related and is_improvement_request) or  # Detailed improvement requests
                (any(keyword in user_lower for keyword in ['add', 'new', 'feature', 'functionality']) and is_system_related) or  # "add new feature"
                (any(keyword in user_lower for keyword in ['fix', 'bug', 'error', 'issue']) and is_system_related)  # "fix bugs"
            )

            # Always include Deep Analysis for security-related queries
            if is_security_query or is_analysis_request or is_ip_related or is_network_related:
                actions.append({
                    'type': 'deep_analysis',
                    'label': 'Deep Analysis',
                    'icon': 'Search',
                    'data': {'query': last_user_message}
                })

            # IP-specific actions - only for IP-related queries
            if is_ip_related and (is_security_query or is_analysis_request):
                extracted_ip = self._extract_ip(last_user_message)
                if extracted_ip:
                    actions.append({
                        'type': 'block_ip',
                        'label': 'Block IP',
                        'icon': 'Shield',
                        'data': {'ip': extracted_ip}
                    })

            # Threat intelligence - only for threat-related content
            if any(keyword in content_lower for keyword in ['threat', 'malware', 'attack', 'vulnerability', 'breach']) and is_security_query:
                actions.append({
                    'type': 'threat_intel',
                    'label': 'Get Threat Intel',
                    'icon': 'AlertTriangle',
                    'data': {'query': last_user_message}
                })

            # Vulnerability actions - only for vulnerability-related content
            if any(keyword in content_lower for keyword in ['cve', 'vulnerability', 'patch', 'exploit']) and is_security_query:
                actions.append({
                    'type': 'patch_vulnerability',
                    'label': 'Apply Patches',
                    'icon': 'Shield',
                    'data': {'query': last_user_message}
                })

            # Incident response actions - only for incident-related content and action requests
            if any(keyword in content_lower for keyword in ['incident', 'breach', 'compromise', 'attack']) and (is_security_query or is_action_request):
                if is_action_request:
                    actions.append({
                        'type': 'isolate_systems',
                        'label': 'Isolate Systems',
                        'icon': 'Lock',
                        'data': {'query': last_user_message}
                    })
                    actions.append({
                        'type': 'create_ticket',
                        'label': 'Create Ticket',
                        'icon': 'Plus',
                        'data': {'query': last_user_message}
                    })

            # Self-enhancement actions - only when intelligently detected
            if should_offer_self_enhancement:
                # Analyze codebase for improvements
                actions.append({
                    'type': 'analyze_codebase',
                    'label': 'Analyze Codebase',
                    'icon': 'Code',
                    'data': {'query': last_user_message}
                })

                # Suggest specific improvements based on context
                if is_security_query and is_improvement_request:
                    actions.append({
                        'type': 'suggest_security_improvement',
                        'label': 'Security Enhancements',
                        'icon': 'Shield',
                        'data': {'query': last_user_message}
                    })
                elif is_system_related and is_improvement_request:
                    actions.append({
                        'type': 'suggest_feature',
                        'label': 'Add Feature',
                        'icon': 'Plus',
                        'data': {'query': last_user_message}
                    })
                elif any(keyword in user_lower for keyword in ['bug', 'fix', 'error']):
                    actions.append({
                        'type': 'fix_bug',
                        'label': 'Fix Bug',
                        'icon': 'Wrench',
                        'data': {'query': last_user_message}
                    })

                # Code modification - only for very specific requests
                if len(last_user_message.split()) > 8 and is_improvement_request:
                    actions.append({
                        'type': 'modify_code',
                        'label': 'Modify Code',
                        'icon': 'Edit',
                        'data': {'query': last_user_message, 'requires_confirmation': True}
                    })

            # Report generation - only for analysis requests or security queries with substantial content
            should_generate_report = (
                (is_analysis_request and len(last_user_message.split()) > 3) or  # Detailed analysis requests
                (is_security_query and len(content.split()) > 50) or  # Substantial security content
                any(keyword in content_lower for keyword in ['report', 'summary', 'findings', 'assessment'])  # Explicit report requests
            )

            if should_generate_report:
                # Determine report type based on content
                report_type = 'general'
                if is_ip_related:
                    report_type = 'ip_analysis'
                elif any(keyword in content_lower for keyword in ['threat', 'malware', 'attack']):
                    report_type = 'threat_analysis'
                elif any(keyword in content_lower for keyword in ['vulnerability', 'cve']):
                    report_type = 'vulnerability_report'
                elif any(keyword in content_lower for keyword in ['incident', 'breach']):
                    report_type = 'incident_report'
                elif is_network_related:
                    report_type = 'traffic_analysis'

                actions.append({
                    'type': 'generate_report',
                    'label': 'Generate Report',
                    'icon': 'FileText',
                    'data': {'type': report_type, 'query': last_user_message}
                })

            # For general questions or non-security queries, provide minimal or no actions
            if not is_security_query and not is_analysis_request and not is_ip_related and not is_network_related and not should_offer_self_enhancement:
                # Only show basic help for truly general queries
                if len(actions) == 0 and len(last_user_message.split()) > 2:
                    actions.append({
                        'type': 'deep_analysis',
                        'label': 'Deep Analysis',
                        'icon': 'Search',
                        'data': {'query': last_user_message}
                    })

            # Remove duplicates based on type
            seen_types = set()
            unique_actions = []
            for action in actions:
                if action['type'] not in seen_types:
                    seen_types.add(action['type'])
                    unique_actions.append(action)

            # Limit to maximum 4 actions to avoid clutter
            return unique_actions[:4]

        except Exception as e:
            logger.error(f"Error generating contextual actions: {str(e)}")
            return []

    def json_completion(self, messages, max_tokens=2000):
        """Generate JSON completion using Groq AI"""
        try:
            response = self.client.chat.completions.create(
                messages=messages,
                model='llama-3.1-8b-instant',
                temperature=0.1,
                max_tokens=max_tokens
            )

            content = response.choices[0].message.content
            cleaned_content = content.replace('```json', '').replace('```', '').strip()
            # Remove any leading/trailing non-JSON text
            start_idx = cleaned_content.find('{')
            end_idx = cleaned_content.rfind('}') + 1
            if start_idx != -1 and end_idx > start_idx:
                json_content = cleaned_content[start_idx:end_idx]
                try:
                    json_data = json.loads(json_content)
                    return {'success': True, 'data': json_data}
                except json.JSONDecodeError as e:
                    return {'success': False, 'error': f'Failed to parse AI response: {str(e)}', 'raw_content': content}
            else:
                return {'success': False, 'error': 'No JSON found in response', 'raw_content': content}

        except Exception as e:
            logger.error(f"Groq JSON completion error: {str(e)}")
            return {'success': False, 'error': str(e)}

    def enhance_n8n_response(self, n8n_response, user_message, conversation_history):
        """Enhance n8n response using Groq AI for better formatting and additional insights"""
        try:
            # Extract the n8n response content
            n8n_content = n8n_response.get('data', {}).get('reply', '') or n8n_response.get('reply', '') or str(n8n_response)

            # Build enhancement prompt
            enhancement_prompt = f"""
            You are a cybersecurity expert enhancing a response from an automation workflow (n8n).

            Original n8n response: {n8n_content}

            User query: {user_message}

            Please enhance this response by:
            1. Improving clarity and readability
            2. Adding relevant cybersecurity context or explanations
            3. Ensuring the response is comprehensive and actionable
            4. Maintaining any embedded options or actions from the original response
            5. Adding professional tone and structure

            If the original response contains options like [Option 1], [Option 2], preserve them exactly as they are.
            Focus on enhancing the explanatory content while keeping functional elements intact.

            Enhanced response:
            """

            # Build conversation context
            messages = [
                {
                    'role': 'system',
                    'content': 'You are a cybersecurity expert enhancing automation responses. Improve clarity, add context, and maintain all functional elements like options in brackets.'
                },
                {
                    'role': 'user',
                    'content': enhancement_prompt
                }
            ]

            # Add recent conversation history for context (last 3 messages)
            for hist_msg in conversation_history[-6:]:  # Last 3 exchanges (6 messages)
                role = 'assistant' if hist_msg.get('sender') == 'assistant' else 'user'
                messages.insert(-1, {
                    'role': role,
                    'content': hist_msg.get('content', '')
                })

            response = self.client.chat.completions.create(
                messages=messages,
                model='llama-3.1-8b-instant',
                temperature=0.3,
                max_tokens=1500
            )

            enhanced_content = response.choices[0].message.content

            # Generate contextual actions using Groq based on the enhanced response
            # Build messages for action generation
            action_messages = [
                {
                    'role': 'system',
                    'content': 'You are a cybersecurity expert analyzing responses to generate appropriate action buttons.'
                },
                {
                    'role': 'user',
                    'content': f'User query: {user_message}\n\nEnhanced response: {enhanced_content}'
                }
            ]

            # Generate actions based on the enhanced content
            groq_actions = self._generate_contextual_actions(action_messages, enhanced_content)

            # Preserve original actions if they exist and merge with Groq-generated actions
            original_actions = n8n_response.get('data', {}).get('actions', []) or n8n_response.get('actions', [])

            # Combine actions, prioritizing Groq-generated ones but keeping unique original ones
            combined_actions = groq_actions.copy()
            for orig_action in original_actions:
                # Check if similar action already exists
                if not any(ga.get('type') == orig_action.get('type') for ga in groq_actions):
                    combined_actions.append(orig_action)

            # Limit to maximum 4 actions
            final_actions = combined_actions[:4]

            # Return enhanced response with combined actions
            enhanced_response = {
                'success': True,
                'data': {
                    'reply': enhanced_content,
                    'actions': final_actions,
                    'enhanced': True,
                    'original_n8n_response': n8n_content
                }
            }

            return enhanced_response

        except Exception as e:
            logger.error(f"Groq n8n response enhancement error: {str(e)}")
            # If enhancement fails, still try to generate actions from original response
            try:
                n8n_content = n8n_response.get('data', {}).get('reply', '') or n8n_response.get('reply', '') or str(n8n_response)
                action_messages = [
                    {
                        'role': 'system',
                        'content': 'You are a cybersecurity expert analyzing n8n automation responses to generate appropriate action buttons.'
                    },
                    {
                        'role': 'user',
                        'content': f'User query: {user_message}\n\nN8n response: {n8n_content}'
                    }
                ]
                groq_actions = self._generate_contextual_actions(action_messages, n8n_content)

                return {
                    'success': True,
                    'data': {
                        'reply': n8n_content,
                        'actions': groq_actions,
                        'enhanced': False,
                        'original_n8n_response': n8n_content
                    }
                }
            except Exception as action_error:
                logger.error(f"Failed to generate actions after enhancement error: {action_error}")
                # Return original response if everything fails
                return n8n_response

    def _extract_ip(self, text):
        """Extract IP address from text"""
        import re
        ip_pattern = r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b'
        matches = re.findall(ip_pattern, text)
        return matches[0] if matches else None
