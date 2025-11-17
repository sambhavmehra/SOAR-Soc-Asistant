import json
import os
import uuid
from datetime import datetime
from services.groq import GroqService

# Initialize Groq service for topic assignment
groq_service = GroqService()

CHAT_HISTORY_FILE = os.path.join(os.path.dirname(__file__), 'data', 'chat_history.json')

# --- Config ---
ALLOWED_TOPICS = [
    'Malware Analysis', 'Network Security', 'Incident Response',
    'Vulnerability Assessment', 'Threat Intelligence', 'Phishing Analysis',
    'Data Breach', 'Access Control', 'Compliance', 'General Security'
]
# How many most-recent messages to send to the classifier (kept compact)
TOPIC_CLASSIFIER_WINDOW = 16
# Per-message max chars sent to the classifier to keep prompts small
TOPIC_CLASSIFIER_MSG_CHAR_LIMIT = 600


def ensure_chat_history_dir():
    """Ensure chat history directory exists"""
    os.makedirs(os.path.dirname(CHAT_HISTORY_FILE), exist_ok=True)
    if not os.path.exists(CHAT_HISTORY_FILE):
        with open(CHAT_HISTORY_FILE, 'w') as f:
            json.dump({}, f)


def load_chat_history():
    """Load chat history from file"""
    try:
        ensure_chat_history_dir()
        with open(CHAT_HISTORY_FILE, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def save_chat_history(history):
    """Save chat history to file"""
    try:
        ensure_chat_history_dir()
        with open(CHAT_HISTORY_FILE, 'w') as f:
            json.dump(history, f, indent=2, default=str)
    except Exception as e:
        print(f"Error saving chat history: {e}")
        raise


def _compact_messages_for_topic(messages):
    """
    Prepare a compact, recent slice of the conversation for topic classification.
    Keeps only the last TOPIC_CLASSIFIER_WINDOW messages and truncates each.
    """
    recent = messages[-TOPIC_CLASSIFIER_WINDOW:]
    compact = []
    for m in recent:
        content = m.get('content', '')
        if len(content) > TOPIC_CLASSIFIER_MSG_CHAR_LIMIT:
            content = content[:TOPIC_CLASSIFIER_MSG_CHAR_LIMIT] + '…'
        role = m.get('sender', 'user')
        compact.append(f"{role}: {content}")
    return "\n".join(compact)


def assign_conversation_topic_from_history(messages):
    """
    Use Groq to assign a topic based on the full conversation (recent window),
    not just the first message.
    """
    try:
        convo_snippet = _compact_messages_for_topic(messages)
        allowed = ", ".join(ALLOWED_TOPICS)

        system_msg = (
            "You are a cybersecurity expert that categorizes security conversations. "
            "Given the conversation transcript, choose the SINGLE most relevant category "
            f"from this list ONLY: {allowed}. Return ONLY the category text exactly as listed."
        )

        user_prompt = (
            "Analyze the conversation below and pick the ONE best-fitting category.\n\n"
            "Conversation:\n"
            f"{convo_snippet}\n\n"
            "Return only the category name and nothing else."
        )

        chat = [
            {"role": "system", "content": system_msg},
            {"role": "user", "content": user_prompt}
        ]

        result = groq_service.chat_completion(chat)
        if result.get('success'):
            topic = (result['data']['content'] or '').strip()
            if topic in ALLOWED_TOPICS:
                return topic
            # Heuristic: try to map close-but-not-exact responses
            normalized = topic.lower()
            for t in ALLOWED_TOPICS:
                if t.lower() == normalized:
                    return t
        return 'General Security'
    except Exception as e:
        print(f"Error assigning topic: {e}")
        return 'General Security'


def create_conversation(user_id, first_message, title=None):
    """Create a new conversation"""
    conversation_id = str(uuid.uuid4())

    # Auto-generate title if not provided
    if not title:
        title = first_message[:50] + "..." if len(first_message) > 50 else first_message

    initial_message = {
        'id': str(uuid.uuid4()),
        'sender': 'user',
        'content': first_message,
        'timestamp': datetime.now().isoformat()
    }

    # Build conversation object early so we can classify on full structure
    conversation = {
        'id': conversation_id,
        'user_id': user_id,
        'title': title,
        'topic': 'General Security',  # temporary, will set properly below
        'created_at': datetime.now().isoformat(),
        'last_activity': datetime.now().isoformat(),
        'messages': [initial_message],
        'message_count': 1,
        'status': 'active'
    }

    # Assign topic using the (current) conversation context
    conversation['topic'] = assign_conversation_topic_from_history(conversation['messages'])

    # Save to history
    history = load_chat_history()
    if user_id not in history:
        history[user_id] = []

    history[user_id].append(conversation)
    save_chat_history(history)

    return conversation


def add_message_to_conversation(user_id, conversation_id, sender, content):
    """Add a message to an existing conversation (and re-assign topic from context)"""
    history = load_chat_history()

    if user_id not in history:
        raise ValueError("User not found")

    conversation = None
    for conv in history[user_id]:
        if conv['id'] == conversation_id:
            conversation = conv
            break

    if not conversation:
        raise ValueError("Conversation not found")

    # Add message
    message = {
        'id': str(uuid.uuid4()),
        'sender': sender,
        'content': content,
        'timestamp': datetime.now().isoformat()
    }

    conversation['messages'].append(message)
    conversation['last_activity'] = datetime.now().isoformat()
    conversation['message_count'] = len(conversation['messages'])

    # Recompute the topic based on the latest conversation window
    conversation['topic'] = assign_conversation_topic_from_history(conversation['messages'])

    save_chat_history(history)
    return conversation


def get_user_conversations(user_id):
    """Get all conversations for a user"""
    history = load_chat_history()
    return history.get(user_id, [])


def get_conversation(user_id, conversation_id):
    """Get a specific conversation"""
    conversations = get_user_conversations(user_id)
    for conv in conversations:
        if conv['id'] == conversation_id:
            return conv
    return None


def delete_conversation(user_id, conversation_id):
    """Delete a conversation"""
    history = load_chat_history()

    if user_id not in history:
        return False

    original_length = len(history[user_id])
    history[user_id] = [conv for conv in history[user_id] if conv['id'] != conversation_id]

    if len(history[user_id]) < original_length:
        save_chat_history(history)
        return True

    return False


def update_conversation_title(user_id, conversation_id, new_title):
    """Update conversation title"""
    history = load_chat_history()

    if user_id not in history:
        return False

    for conv in history[user_id]:
        if conv['id'] == conversation_id:
            conv['title'] = new_title
            conv['last_activity'] = datetime.now().isoformat()
            save_chat_history(history)
            return True

    return False
