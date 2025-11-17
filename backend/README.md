# SOAR SOC Assistant Backend

A Flask-based backend service for the SOAR SOC Assistant application, providing REST APIs for security incident management, AI analysis, and automation integration.

## Features

- **Security Incident Management**: CRUD operations for security incidents stored in Google Sheets
- **AI-Powered Analysis**: Integration with Groq AI for threat analysis and report generation
- **Automation Integration**: Webhook and agent calls to n8n for workflow automation
- **Dynamic Data**: All data comes from real integrations, no dummy data
- **Industry-Ready**: Proper error handling, logging, CORS support, and configuration management

## Setup

1. **Clone and navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your actual API keys and URLs
   ```

5. **Run the application**:
   ```bash
   python app.py
   ```

The server will start on `http://localhost:5000`

## API Endpoints

### Health Check
- `GET /health` - Check service health

### Incidents
- `GET /incidents` - Get all security incidents
- `POST /incidents` - Add new incident (with AI analysis)
- `PUT /incidents/<event_id>/status` - Update incident status
- `POST /incidents/bulk` - Bulk add incidents

### AI Services
- `POST /ai/analyze` - Analyze security event
- `POST /ai/report` - Generate incident report
- `POST /ai/threat-intelligence` - Get threat intelligence

### n8n Integration
- `POST /n8n/trigger` - Trigger n8n webhook
- `POST /n8n/agent` - Call n8n agent
- `GET /n8n/ping` - Ping n8n service
- `POST /n8n/test-integration` - Test n8n integration

### Metrics
- `GET /metrics` - Get dashboard metrics

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_SHEETS_API_KEY` | Google Sheets API key | Yes |
| `GOOGLE_SHEETS_ID` | Google Spreadsheet ID | No (has default) |
| `GOOGLE_SHEETS_TAB` | Sheet name/tab | No (has default) |
| `GROQ_API_KEY` | Groq AI API key | Yes |
| `N8N_WEBHOOK_URL` | n8n webhook URL | No |
| `N8N_AGENT_URL` | n8n agent URL | No |
| `N8N_TEST_URL` | n8n test integration URL | No |

## Integration with Frontend

The backend provides APIs that can be consumed by the React frontend. Update the frontend service files to call these endpoints instead of direct integrations.

Example:
```javascript
// Instead of calling GoogleSheetsService directly
const response = await fetch('http://localhost:5000/incidents');
const data = await response.json();
```

## Security Considerations

- Store API keys securely (use environment variables)
- Implement authentication/authorization if deploying to production
- Use HTTPS in production
- Validate and sanitize all inputs
- Implement rate limiting for API endpoints

## Development

- The application runs in debug mode by default
- Logs are output to console
- CORS is enabled for frontend development

## Production Deployment

For production deployment:
1. Set `debug=False` in app.py
2. Use a WSGI server like Gunicorn
3. Configure proper logging
4. Set up environment variables securely
5. Consider adding authentication middleware
