"""
Chat History API Endpoints
Add these endpoints to your Flask app for chat history management.
"""

from flask import request, jsonify
from chat_history import (
    create_conversation, add_message_to_conversation,
    get_user_conversations, get_conversation, delete_conversation,
    update_conversation_title
)
import logging

logger = logging.getLogger(__name__)

def add_chat_endpoints(app, verify_firebase_token):
    """Add chat history endpoints to the Flask app"""

    @app.route('/chat/conversations', methods=['GET'])
    @verify_firebase_token
    def get_conversations():
        """Get all conversations for the authenticated user"""
        try:
            user_id = request.user['uid']
            conversations = get_user_conversations(user_id)
            return jsonify({'success': True, 'data': conversations}), 200
        except Exception as e:
            logger.error(f'Error getting conversations: {str(e)}')
            return jsonify({'success': False, 'error': str(e)}), 500

    @app.route('/chat/conversations', methods=['POST'])
    @verify_firebase_token
    def create_new_conversation():
        """Create a new conversation"""
        try:
            data = request.get_json()
            if not data or 'message' not in data:
                return jsonify({'success': False, 'error': 'Message required'}), 400

            user_id = request.user['uid']
            message = data['message']
            title = data.get('title')

            conversation = create_conversation(user_id, message, title)
            return jsonify({'success': True, 'data': conversation}), 201
        except Exception as e:
            logger.error(f'Error creating conversation: {str(e)}')
            return jsonify({'success': False, 'error': str(e)}), 500

    @app.route('/chat/conversations/<conversation_id>', methods=['GET'])
    @verify_firebase_token
    def get_single_conversation(conversation_id):
        """Get a specific conversation"""
        try:
            user_id = request.user['uid']
            conversation = get_conversation(user_id, conversation_id)

            if not conversation:
                return jsonify({'success': False, 'error': 'Conversation not found'}), 404

            return jsonify({'success': True, 'data': conversation}), 200
        except Exception as e:
            logger.error(f'Error getting conversation: {str(e)}')
            return jsonify({'success': False, 'error': str(e)}), 500

    @app.route('/chat/conversations/<conversation_id>/messages', methods=['POST'])
    @verify_firebase_token
    def add_message(conversation_id):
        """Add a message to a conversation"""
        try:
            data = request.get_json()
            if not data or 'sender' not in data or 'content' not in data:
                return jsonify({'success': False, 'error': 'Sender and content required'}), 400

            user_id = request.user['uid']
            sender = data['sender']
            content = data['content']

            conversation = add_message_to_conversation(user_id, conversation_id, sender, content)
            return jsonify({'success': True, 'data': conversation}), 200
        except ValueError as e:
            return jsonify({'success': False, 'error': str(e)}), 404
        except Exception as e:
            logger.error(f'Error adding message: {str(e)}')
            return jsonify({'success': False, 'error': str(e)}), 500

    @app.route('/chat/conversations/<conversation_id>', methods=['DELETE'])
    @verify_firebase_token
    def delete_conv(conversation_id):
        """Delete a conversation"""
        try:
            user_id = request.user['uid']
            success = delete_conversation(user_id, conversation_id)

            if not success:
                return jsonify({'success': False, 'error': 'Conversation not found'}), 404

            return jsonify({'success': True}), 200
        except Exception as e:
            logger.error(f'Error deleting conversation: {str(e)}')
            return jsonify({'success': False, 'error': str(e)}), 500

    @app.route('/chat/conversations/<conversation_id>/title', methods=['PUT'])
    @verify_firebase_token
    def update_title(conversation_id):
        """Update conversation title"""
        try:
            data = request.get_json()
            if not data or 'title' not in data:
                return jsonify({'success': False, 'error': 'Title required'}), 400

            user_id = request.user['uid']
            new_title = data['title']

            success = update_conversation_title(user_id, conversation_id, new_title)

            if not success:
                return jsonify({'success': False, 'error': 'Conversation not found'}), 404

            return jsonify({'success': True}), 200
        except Exception as e:
            logger.error(f'Error updating title: {str(e)}')
            return jsonify({'success': False, 'error': str(e)}), 500

    return app
