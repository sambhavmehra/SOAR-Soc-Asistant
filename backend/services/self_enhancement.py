import os
import re
import json
import logging
import ast
import subprocess
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from services.groq import GroqService

logger = logging.getLogger(__name__)

class SelfEnhancementService:
    def __init__(self):
        self.groq_service = GroqService()
        self.project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        self.safety_checks_enabled = True
        self.allowed_extensions = ['.py', '.js', '.jsx', '.json', '.md']
        self.forbidden_paths = ['node_modules', '.git', '__pycache__', 'dist', 'build']

    def analyze_codebase(self, max_files: int = 10) -> Dict:
        """Analyze the codebase for potential improvements (limited for performance)"""
        try:
            analysis = {
                'files_analyzed': 0,
                'total_lines': 0,
                'languages': {},
                'potential_improvements': [],
                'security_issues': [],
                'performance_issues': [],
                'code_quality_issues': [],
                'analysis_limited': True,
                'max_files_limit': max_files
            }

            analyzed_count = 0
            for root, dirs, files in os.walk(self.project_root):
                # Skip forbidden directories
                dirs[:] = [d for d in dirs if d not in self.forbidden_paths]

                for file in files:
                    if analyzed_count >= max_files:
                        break

                    if any(file.endswith(ext) for ext in self.allowed_extensions):
                        file_path = os.path.join(root, file)
                        rel_path = os.path.relpath(file_path, self.project_root)

                        try:
                            with open(file_path, 'r', encoding='utf-8') as f:
                                content = f.read()

                            analysis['files_analyzed'] += 1
                            analysis['total_lines'] += len(content.split('\n'))
                            analyzed_count += 1

                            # Analyze file (skip AI analysis for speed in limited mode)
                            # Just do basic analysis
                            file_analysis = self._basic_analyze_file(rel_path, content)
                            analysis['potential_improvements'].extend(file_analysis.get('improvements', []))
                            analysis['security_issues'].extend(file_analysis.get('security', []))
                            analysis['performance_issues'].extend(file_analysis.get('performance', []))
                            analysis['code_quality_issues'].extend(file_analysis.get('quality', []))

                            # Track languages
                            ext = os.path.splitext(file)[1]
                            analysis['languages'][ext] = analysis['languages'].get(ext, 0) + 1

                        except Exception as e:
                            logger.error(f"Error analyzing {rel_path}: {str(e)}")

                if analyzed_count >= max_files:
                    break

            return {'success': True, 'data': analysis}

        except Exception as e:
            logger.error(f"Error in codebase analysis: {str(e)}")
            return {'success': False, 'error': str(e)}

    def _analyze_file(self, file_path: str, content: str) -> Dict:
        """Analyze a single file for improvements"""
        issues = {
            'improvements': [],
            'security': [],
            'performance': [],
            'quality': []
        }

        try:
            # Basic code analysis using AI
            prompt = f"""
            Analyze this code file ({file_path}) and identify:
            1. Potential improvements or new features that could be added
            2. Security vulnerabilities or issues
            3. Performance optimization opportunities
            4. Code quality issues (bugs, best practices, etc.)

            Code:
            ```{os.path.splitext(file_path)[1][1:]}
            {content[:2000]}  # Limit content for analysis
            ```

            Return as JSON with keys: improvements, security, performance, quality
            Each should be an array of objects with 'description', 'severity', 'line_number' (if applicable)
            """

            response = self.groq_service.json_completion([{
                'role': 'system',
                'content': 'You are a senior software engineer analyzing code for improvements. Always respond with valid JSON.'
            }, {
                'role': 'user',
                'content': prompt
            }])

            if response['success']:
                issues.update(response['data'])
            else:
                logger.warning(f"Failed to analyze {file_path}: {response.get('error', 'Unknown error')}")

        except Exception as e:
            logger.error(f"Error analyzing file {file_path}: {str(e)}")

        return issues

    def _basic_analyze_file(self, file_path: str, content: str) -> Dict:
        """Basic file analysis without AI calls for performance"""
        issues = {
            'improvements': [],
            'security': [],
            'performance': [],
            'quality': []
        }

        try:
            lines = content.split('\n')
            ext = os.path.splitext(file_path)[1]

            # Basic Python analysis
            if ext == '.py':
                # Check for common issues
                if 'import os' in content and 'os.system' in content:
                    issues['security'].append({
                        'description': 'Potential command injection via os.system',
                        'severity': 'High',
                        'line_number': None
                    })

                if 'eval(' in content or 'exec(' in content:
                    issues['security'].append({
                        'description': 'Use of eval/exec - potential code injection',
                        'severity': 'High',
                        'line_number': None
                    })

                if len(lines) > 500:
                    issues['quality'].append({
                        'description': 'File is very long, consider splitting into modules',
                        'severity': 'Medium',
                        'line_number': None
                    })

            # Basic JavaScript/React analysis
            elif ext in ['.js', '.jsx']:
                if 'console.log' in content and 'production' not in file_path.lower():
                    issues['quality'].append({
                        'description': 'Console.log statements should be removed in production',
                        'severity': 'Low',
                        'line_number': None
                    })

                if 'innerHTML' in content:
                    issues['security'].append({
                        'description': 'Use of innerHTML - potential XSS vulnerability',
                        'severity': 'Medium',
                        'line_number': None
                    })

            # General improvements
            if len(content.strip()) < 50:
                issues['improvements'].append({
                    'description': 'File seems very small, consider if it serves a purpose',
                    'severity': 'Low',
                    'line_number': None
                })

        except Exception as e:
            logger.error(f"Error in basic analysis of {file_path}: {str(e)}")

        return issues

    def generate_code(self, requirement: str, context: Dict = None) -> Dict:
        """Generate new code based on requirements"""
        try:
            context_info = ""
            if context:
                context_info = f"\nContext: {json.dumps(context, indent=2)}"

            prompt = f"""
            Generate code to implement the following requirement:
            {requirement}

            {context_info}

            Consider:
            - Best practices and coding standards
            - Error handling and validation
            - Security considerations
            - Performance optimization
            - Integration with existing codebase

            Return a JSON object with:
            - 'files': array of objects with 'path', 'content', 'description'
            - 'dependencies': array of new dependencies needed
            - 'tests': suggested test cases
            - 'integration_steps': steps to integrate the new code
            """

            response = self.groq_service.json_completion([{
                'role': 'system',
                'content': 'You are an expert software engineer. Generate high-quality, production-ready code. Always respond with valid JSON.'
            }, {
                'role': 'user',
                'content': prompt
            }])

            if response['success']:
                return {'success': True, 'data': response['data']}
            else:
                return {'success': False, 'error': response.get('error', 'Unknown error')}

        except Exception as e:
            logger.error(f"Error generating code: {str(e)}")
            return {'success': False, 'error': str(e)}

    def modify_code(self, file_path: str, modification_request: str) -> Dict:
        """Modify existing code based on requirements"""
        try:
            if not self._is_safe_path(file_path):
                return {'success': False, 'error': 'Unsafe file path'}

            full_path = os.path.join(self.project_root, file_path)
            if not os.path.exists(full_path):
                return {'success': False, 'error': 'File does not exist'}

            with open(full_path, 'r', encoding='utf-8') as f:
                current_content = f.read()

            prompt = f"""
            Modify the following code file based on this request:
            {modification_request}

            Current file: {file_path}
            Current content:
            ```{os.path.splitext(file_path)[1][1:]}
            {current_content}
            ```

            Return a JSON object with:
            - 'modified_content': the complete modified file content
            - 'changes_summary': description of changes made
            - 'potential_issues': any potential issues with the changes
            """

            response = self.groq_service.json_completion([{
                'role': 'system',
                'content': 'You are an expert code modifier. Make precise, safe changes to existing code. Always respond with valid JSON.'
            }, {
                'role': 'user',
                'content': prompt
            }])

            if response['success']:
                try:
                    modification = json.loads(response['data']['content'])
                    return {'success': True, 'data': modification}
                except Exception as e:
                    return {'success': False, 'error': f'Failed to parse AI response: {str(e)}'}

            return response

        except Exception as e:
            logger.error(f"Error modifying code: {str(e)}")
            return {'success': False, 'error': str(e)}

    def implement_feature(self, feature_request: str) -> Dict:
        """Implement a new feature end-to-end"""
        try:
            # First analyze what needs to be done
            analysis = self.analyze_codebase()
            if not analysis['success']:
                return analysis

            # Generate implementation plan
            prompt = f"""
            Create a comprehensive implementation plan for this feature request:
            {feature_request}

            Current codebase analysis: {json.dumps(analysis['data'], indent=2)}

            Return a JSON object with:
            - 'plan': step-by-step implementation plan
            - 'files_to_create': array of new files needed
            - 'files_to_modify': array of existing files to modify
            - 'dependencies': new dependencies required
            - 'tests': test cases to add
            - 'risk_assessment': potential risks and mitigations
            """

            response = self.groq_service.json_completion([{
                'role': 'system',
                'content': 'You are a senior architect planning feature implementations. Always respond with valid JSON.'
            }, {
                'role': 'user',
                'content': prompt
            }])

            if response['success']:
                try:
                    plan = json.loads(response['data']['content'])
                    return {'success': True, 'data': plan}
                except Exception as e:
                    return {'success': False, 'error': f'Failed to parse AI response: {str(e)}'}

            return response

        except Exception as e:
            logger.error(f"Error implementing feature: {str(e)}")
            return {'success': False, 'error': str(e)}

    def fix_bug(self, bug_description: str, file_path: str = None) -> Dict:
        """Fix a bug in the codebase"""
        try:
            context = ""
            if file_path:
                if not self._is_safe_path(file_path):
                    return {'success': False, 'error': 'Unsafe file path'}

                full_path = os.path.join(self.project_root, file_path)
                if os.path.exists(full_path):
                    with open(full_path, 'r', encoding='utf-8') as f:
                        context = f.read()

            prompt = f"""
            Fix this bug: {bug_description}

            {'File content:' if file_path else 'General codebase context:'}
            {context[:3000] if context else 'No specific file provided'}

            Return a JSON object with:
            - 'fix_description': what the bug was and how it's fixed
            - 'modified_files': array of files that need changes
            - 'code_changes': the specific code changes needed
            - 'test_case': test case to verify the fix
            """

            response = self.groq_service.json_completion([{
                'role': 'system',
                'content': 'You are a debugging expert. Identify and fix bugs accurately. Always respond with valid JSON.'
            }, {
                'role': 'user',
                'content': prompt
            }])

            if response['success']:
                try:
                    fix = json.loads(response['data']['content'])
                    return {'success': True, 'data': fix}
                except Exception as e:
                    return {'success': False, 'error': f'Failed to parse AI response: {str(e)}'}

            return response

        except Exception as e:
            logger.error(f"Error fixing bug: {str(e)}")
            return {'success': False, 'error': str(e)}

    def optimize_performance(self, component: str) -> Dict:
        """Optimize performance of a specific component"""
        try:
            # Find the component file
            component_path = self._find_component(component)
            if not component_path:
                return {'success': False, 'error': f'Component {component} not found'}

            with open(component_path, 'r', encoding='utf-8') as f:
                content = f.read()

            prompt = f"""
            Optimize the performance of this component: {component}

            Code:
            ```{os.path.splitext(component_path)[1][1:]}
            {content}
            ```

            Focus on:
            - Algorithm efficiency
            - Memory usage
            - Rendering performance (if frontend)
            - Database query optimization (if backend)
            - Caching opportunities

            Return a JSON object with:
            - 'optimizations': array of specific optimizations made
            - 'performance_gain': estimated performance improvement
            - 'modified_code': the optimized code
            - 'benchmarks': suggested performance tests
            """

            response = self.groq_service.json_completion([{
                'role': 'system',
                'content': 'You are a performance optimization expert. Improve code efficiency and speed. Always respond with valid JSON.'
            }, {
                'role': 'user',
                'content': prompt
            }])

            if response['success']:
                try:
                    optimization = json.loads(response['data']['content'])
                    return {'success': True, 'data': optimization}
                except Exception as e:
                    return {'success': False, 'error': f'Failed to parse AI response: {str(e)}'}

            return response

        except Exception as e:
            logger.error(f"Error optimizing performance: {str(e)}")
            return {'success': False, 'error': str(e)}

    def integrate_tool(self, tool_name: str, purpose: str) -> Dict:
        """Integrate a new external tool or service"""
        try:
            prompt = f"""
            Create integration code for: {tool_name}
            Purpose: {purpose}

            Consider the existing codebase architecture and create appropriate integration.

            Return a JSON object with:
            - 'integration_type': 'api', 'sdk', 'webhook', etc.
            - 'files_to_create': new files needed for integration
            - 'files_to_modify': existing files to update
            - 'configuration': configuration settings needed
            - 'usage_example': how to use the integrated tool
            - 'error_handling': error handling for the integration
            """

            response = self.groq_service.json_completion([{
                'role': 'system',
                'content': 'You are an integration specialist. Create robust integrations with external tools. Always respond with valid JSON.'
            }, {
                'role': 'user',
                'content': prompt
            }])

            if response['success']:
                try:
                    integration = json.loads(response['data']['content'])
                    return {'success': True, 'data': integration}
                except Exception as e:
                    return {'success': False, 'error': f'Failed to parse AI response: {str(e)}'}

            return response

        except Exception as e:
            logger.error(f"Error integrating tool: {str(e)}")
            return {'success': False, 'error': str(e)}

    def apply_changes(self, changes: Dict, approval_required: bool = True) -> Dict:
        """Apply code changes to the filesystem"""
        try:
            if approval_required:
                # For development/testing, allow changes but log the action
                logger.warning("Applying changes without explicit approval - DEVELOPMENT MODE")
                # In production, this should require proper user approval flow

            applied_changes = []

            # Apply file creations
            if 'files_to_create' in changes:
                for file_info in changes['files_to_create']:
                    file_path = file_info['path']
                    if not self._is_safe_path(file_path):
                        continue

                    full_path = os.path.join(self.project_root, file_path)
                    os.makedirs(os.path.dirname(full_path), exist_ok=True)

                    with open(full_path, 'w', encoding='utf-8') as f:
                        f.write(file_info['content'])

                    applied_changes.append(f"Created: {file_path}")

            # Apply file modifications
            if 'files_to_modify' in changes:
                for file_info in changes['files_to_modify']:
                    file_path = file_info['path']
                    if not self._is_safe_path(file_path):
                        continue

                    full_path = os.path.join(self.project_root, file_path)
                    if os.path.exists(full_path):
                        with open(full_path, 'w', encoding='utf-8') as f:
                            f.write(file_info['content'])

                        applied_changes.append(f"Modified: {file_path}")

            return {'success': True, 'data': {'applied_changes': applied_changes}}

        except Exception as e:
            logger.error(f"Error applying changes: {str(e)}")
            return {'success': False, 'error': str(e)}

    def _is_safe_path(self, file_path: str) -> bool:
        """Check if a file path is safe to modify"""
        if not self.safety_checks_enabled:
            return True

        # Check for dangerous patterns
        dangerous_patterns = [
            '..',  # Directory traversal
            os.path.sep + os.path.sep,  # Absolute paths
            'node_modules',
            '.git',
            '__pycache__',
            'dist',
            'build'
        ]

        for pattern in dangerous_patterns:
            if pattern in file_path:
                return False

        # Check file extension
        if not any(file_path.endswith(ext) for ext in self.allowed_extensions):
            return False

        return True

    def _find_component(self, component_name: str) -> Optional[str]:
        """Find a component file by name"""
        for root, dirs, files in os.walk(self.project_root):
            dirs[:] = [d for d in dirs if d not in self.forbidden_paths]

            for file in files:
                if component_name.lower() in file.lower():
                    return os.path.join(root, file)

        return None

    def get_self_improvement_suggestions(self) -> Dict:
        """Get suggestions for improving the self-enhancement system itself"""
        try:
            prompt = """
            Analyze this self-enhancement service and suggest improvements:

            Current capabilities:
            - Code analysis and improvement suggestions
            - Code generation and modification
            - Feature implementation
            - Bug fixing
            - Performance optimization
            - Tool integration

            Suggest ways to make this system better, safer, and more capable.

            Return as JSON with keys: improvements, safety_enhancements, new_capabilities
            """

            response = self.groq_service.json_completion([{
                'role': 'system',
                'content': 'You are a meta-improvement expert. Suggest ways to enhance AI systems. Always respond with valid JSON.'
            }, {
                'role': 'user',
                'content': prompt
            }])

            if response['success']:
                return {'success': True, 'data': response['data']}
            else:
                return {'success': False, 'error': response.get('error', 'Unknown error')}


        except Exception as e:
            logger.error(f"Error getting self-improvement suggestions: {str(e)}")
            return {'success': False, 'error': str(e)}
