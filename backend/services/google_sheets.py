import requests
import logging
from datetime import datetime
from config import Config

logger = logging.getLogger(__name__)

class GoogleSheetsService:
    def __init__(self):
        self.api_key = Config.GOOGLE_SHEETS_API_KEY
        self.spreadsheet_id = Config.GOOGLE_SHEETS_ID
        self.sheet_name = Config.GOOGLE_SHEETS_TAB
        self.users_sheet_name = 'Users'
        self.base_url = 'https://sheets.googleapis.com/v4/spreadsheets'

    def initialize_sheet(self):
        """Initialize the spreadsheet with headers"""
        headers = [
            'Timestamp',
            'Event ID',
            'Severity',
            'Source IP',
            'Destination IP',
            'Attack Type',
            'Status',
            'Action Taken'
        ]

        url = f"{self.base_url}/{self.spreadsheet_id}/values/{self.sheet_name}!A1:H1"
        params = {'key': self.api_key, 'valueInputOption': 'RAW'}
        data = {'values': [headers]}

        response = requests.put(url, json=data, params=params)
        if response.status_code == 200:
            return {'success': True, 'data': response.json()}
        else:
            logger.error(f"Failed to initialize sheet: {response.text}")
            return {'success': False, 'error': response.json().get('error', {}).get('message', 'Failed to initialize sheet')}

    def add_security_incident(self, incident):
        """Add a new security incident"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        event_id = incident.get('eventId') or f"INC-{datetime.now().strftime('%Y%m%d')}-{str(hash(str(incident)) % 1000).zfill(3)}"

        row_data = [
            timestamp,
            event_id,
            incident.get('severity', 'Medium'),
            incident.get('sourceip', 'Unknown'),
            incident.get('destinationip', 'Unknown'),
            incident.get('attacktype', 'Unknown'),
            incident.get('status', 'Investigating'),
            incident.get('actiontaken', 'Alert Sent')
        ]

        # Get current row count
        range_url = f"{self.base_url}/{self.spreadsheet_id}/values/{self.sheet_name}"
        response = requests.get(range_url, params={'key': self.api_key})
        if response.status_code != 200:
            return {'success': False, 'error': 'Failed to get sheet data'}

        current_rows = len(response.json().get('values', []))
        next_row = current_rows + 1

        url = f"{self.base_url}/{self.spreadsheet_id}/values/{self.sheet_name}!A{next_row}:H{next_row}"
        params = {'key': self.api_key, 'valueInputOption': 'RAW'}
        data = {'values': [row_data]}

        response = requests.put(url, json=data, params=params)
        if response.status_code == 200:
            return {
                'success': True,
                'data': {
                    'incident': {
                        'timestamp': timestamp,
                        'eventId': event_id,
                        'severity': incident.get('severity'),
                        'sourceIp': incident.get('sourceIp'),
                        'destinationIp': incident.get('destinationIp'),
                        'attackType': incident.get('attackType'),
                        'status': incident.get('status'),
                        'actionTaken': incident.get('actionTaken')
                    }
                }
            }
        else:
            logger.error(f"Failed to add incident: {response.text}")
            return {'success': False, 'error': response.json().get('error', {}).get('message', 'Failed to add incident')}

    def get_security_incidents(self):
        """Get all security incidents"""
        csv_url = f"https://docs.google.com/spreadsheets/d/{self.spreadsheet_id}/export?format=csv"
        response = requests.get(csv_url)
        if response.status_code != 200:
            return {'success': False, 'error': 'Failed to fetch CSV data'}

        lines = response.text.strip().split('\n')
        if len(lines) <= 1:
            return {'success': True, 'data': []}

        header_row = lines[0].split(',')
        incidents = []
        for line in lines[1:]:
            values = line.split(',')
            incident = {}
            for i, header in enumerate(header_row):
                incident[header.lower().replace(' ', '')] = values[i] if i < len(values) else ''
            incidents.append(incident)

        return {'success': True, 'data': incidents}

    def update_incident_status(self, event_id, new_status, action_taken):
        """Update incident status"""
        incidents = self.get_security_incidents()
        if not incidents['success']:
            return incidents

        incident_index = None
        for i, inc in enumerate(incidents['data']):
            if inc.get('eventid') == event_id:
                incident_index = i
                break

        if incident_index is None:
            return {'success': False, 'error': 'Incident not found'}

        row_number = incident_index + 2  # +1 for header, +1 for 1-based

        url = f"{self.base_url}/{self.spreadsheet_id}/values/{self.sheet_name}!G{row_number}:H{row_number}"
        params = {'key': self.api_key, 'valueInputOption': 'RAW'}
        data = {'values': [[new_status, action_taken]]}

        response = requests.put(url, json=data, params=params)
        if response.status_code == 200:
            return {'success': True, 'data': response.json()}
        else:
            logger.error(f"Failed to update incident: {response.text}")
            return {'success': False, 'error': response.json().get('error', {}).get('message', 'Failed to update incident')}

    def bulk_add_incidents(self, incidents_list):
        """Bulk add multiple incidents"""
        rows = []
        for incident in incidents_list:
            timestamp = incident.get('timestamp') or datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            event_id = incident.get('eventId') or f"INC-{datetime.now().strftime('%Y%m%d')}-{str(hash(str(incident)) % 1000).zfill(3)}"

            rows.append([
                timestamp,
                event_id,
                incident.get('severity', 'Medium'),
                incident.get('sourceIp', 'Unknown'),
                incident.get('destinationIp', 'Unknown'),
                incident.get('attackType', 'Unknown'),
                incident.get('status', 'Investigating'),
                incident.get('actionTaken', 'Alert Sent')
            ])

        # Get current row count
        range_url = f"{self.base_url}/{self.spreadsheet_id}/values/{self.sheet_name}"
        response = requests.get(range_url, params={'key': self.api_key})
        if response.status_code != 200:
            return {'success': False, 'error': 'Failed to get sheet data'}

        current_rows = len(response.json().get('values', []))
        start_row = current_rows + 1
        end_row = start_row + len(rows) - 1

        url = f"{self.base_url}/{self.spreadsheet_id}/values/{self.sheet_name}!A{start_row}:H{end_row}"
        params = {'key': self.api_key, 'valueInputOption': 'RAW'}
        data = {'values': rows}

        response = requests.put(url, json=data, params=params)
        if response.status_code == 200:
            return {'success': True, 'data': {'addedCount': len(rows)}}
        else:
            logger.error(f"Failed to bulk add incidents: {response.text}")
            return {'success': False, 'error': response.json().get('error', {}).get('message', 'Failed to bulk add incidents')}

    def initialize_users_sheet(self):
        """Initialize the users sheet with headers"""
        headers = ['Email', 'Role', 'Created At']

        url = f"{self.base_url}/{self.spreadsheet_id}/values/{self.users_sheet_name}!A1:C1"
        params = {'key': self.api_key, 'valueInputOption': 'RAW'}
        data = {'values': [headers]}

        response = requests.put(url, json=data, params=params)
        if response.status_code == 200:
            return {'success': True, 'data': response.json()}
        else:
            logger.error(f"Failed to initialize users sheet: {response.text}")
            return {'success': False, 'error': response.json().get('error', {}).get('message', 'Failed to initialize users sheet')}

    def add_user(self, email, role):
        """Add a new user"""
        created_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        row_data = [email, role, created_at]

        # Get current row count
        range_url = f"{self.base_url}/{self.spreadsheet_id}/values/{self.users_sheet_name}"
        response = requests.get(range_url, params={'key': self.api_key})
        if response.status_code != 200:
            # Try to initialize the sheet
            init_result = self.initialize_users_sheet()
            if not init_result['success']:
                return {'success': False, 'error': 'Failed to initialize users sheet'}
            # Retry get
            response = requests.get(range_url, params={'key': self.api_key})
            if response.status_code != 200:
                return {'success': False, 'error': 'Failed to get users sheet data after initialization'}

        current_rows = len(response.json().get('values', []))
        next_row = current_rows + 1

        url = f"{self.base_url}/{self.spreadsheet_id}/values/{self.users_sheet_name}!A{next_row}:C{next_row}"
        params = {'key': self.api_key, 'valueInputOption': 'RAW'}
        data = {'values': [row_data]}

        response = requests.put(url, json=data, params=params)
        if response.status_code == 200:
            return {'success': True, 'data': {'email': email, 'role': role, 'createdAt': created_at}}
        else:
            logger.error(f"Failed to add user: {response.text}")
            return {'success': False, 'error': response.json().get('error', {}).get('message', 'Failed to add user')}

    def get_user_by_email(self, email):
        """Get user by email"""
        csv_url = f"https://docs.google.com/spreadsheets/d/{self.spreadsheet_id}/export?format=csv&sheet={self.users_sheet_name}"
        response = requests.get(csv_url)
        if response.status_code != 200:
            return {'success': False, 'error': 'Failed to fetch users CSV data'}

        lines = response.text.strip().split('\n')
        if len(lines) <= 1:
            return {'success': True, 'data': None}

        header_row = lines[0].split(',')
        for line in lines[1:]:
            values = line.split(',')
            if len(values) >= 2 and values[0] == email:
                user = {}
                for i, header in enumerate(header_row):
                    user[header.lower().replace(' ', '')] = values[i] if i < len(values) else ''
                return {'success': True, 'data': user}

        return {'success': True, 'data': None}
