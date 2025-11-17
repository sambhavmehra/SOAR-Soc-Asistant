# SOAR SOC Assistant

A comprehensive Security Operations and Response (SOAR) platform designed for modern SOC teams. This enterprise-grade cybersecurity dashboard provides real-time threat monitoring, incident response automation, AI-powered analysis, and detailed reporting capabilities.

## 🚀 Features

### Core Capabilities
- **Real-time Security Monitoring**: Live traffic analysis and threat detection with IDS integration
- **AI-Powered Incident Analysis**: Groq AI integration for intelligent threat assessment and automated analysis
- **Automated Incident Response**: N8N workflow automation for streamlined SOC operations
- **Professional Report Generation**: PDF-based incident reports with forensic analysis and executive summaries
- **Interactive Security Chatbot**: AI-powered security assistant with conversation history and action execution
- **Google Sheets Integration**: Cloud-based incident logging and data persistence
- **Self-Learning System**: Machine learning models for continuous improvement and threat pattern recognition
- **Self-Enhancement**: AI-powered code analysis and automated feature implementation

### Advanced Features
- **Multi-Dashboard Architecture**: Specialized dashboards for alerts, traffic, reports, chatbot, main, admin, settings, system health, and search
- **Real-time Metrics**: Dynamic security metrics and KPI tracking with live updates
- **Threat Intelligence**: AI-generated threat intelligence and risk assessments
- **Incident Management**: Complete incident lifecycle management from detection to resolution
- **Automated Workflows**: N8N-powered security automation workflows with webhook integration
- **Professional Reporting**: SOC-grade incident documentation with customizable templates
- **IDS Monitoring**: Real-time intrusion detection system with log analysis and alerting
- **Integration Checker**: Automated verification of system integrations and connectivity
- **Firebase Authentication**: Secure user authentication with role-based access control

## 🏗️ Architecture

### Frontend (React + Vite)
- **React 18** with modern hooks and concurrent features
- **Vite** for lightning-fast development and optimized production builds (port 4028)
- **TailwindCSS** for responsive, professional UI design with custom themes
- **Redux Toolkit** for state management with slices for auth and other features
- **React Router** for seamless navigation across dashboards
- **Firebase Authentication** for secure user management
- **D3.js & Recharts** for advanced data visualization and interactive charts
- **Framer Motion** for smooth animations and transitions
- **Lucide React** for consistent iconography
- **React Hook Form** for efficient form handling

### Backend (Flask + Python)
- **Flask** REST API with CORS support and Firebase token verification
- **Google Sheets API** for data persistence and incident management
- **Groq AI** for intelligent security analysis and chatbot responses
- **N8N Integration** for workflow automation and webhook handling
- **Scikit-learn** for machine learning models (self-learning and NIDS)
- **ReportLab** for professional PDF report generation
- **Firebase Admin** for server-side authentication
- **Real-time Processing** for live security monitoring and alerting

### AI & Machine Learning
- **Groq AI Models**: Advanced language models for security analysis and natural language processing
- **Self-Learning Service**: ML models that improve over time with incident data
- **NIDS Model**: Network intrusion detection using balanced machine learning algorithms
- **Intelligent Chatbot**: Context-aware security assistance with action execution capabilities
- **Automated Code Enhancement**: AI-powered codebase analysis and improvement suggestions

## 📋 Prerequisites

### System Requirements
- **Node.js** (v18.x or higher) - for frontend development
- **Python** (v3.8 or higher) - for backend services
- **Google Cloud Account** (for Sheets API and Firebase)
- **Groq API Key** (for AI features)
- **N8N Instance** (optional, for automation workflows)
- **Git** (for version control)

### API Keys Required
- Google Sheets API credentials (service account JSON)
- Google Sheets spreadsheet ID for data storage
- Groq API key for AI capabilities
- Firebase project configuration
- N8N webhook URLs (optional for automation)

## 🛠️ Installation & Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd soar_soc_assistant

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
pip install -r requirements.txt
cd ..
```

### 2. Environment Configuration

Create `.env` file in the root directory:

```env
# Google Sheets API
GOOGLE_SHEETS_CREDENTIALS_PATH=path/to/credentials.json
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id

# Groq AI
GROQ_API_KEY=your_groq_api_key

# N8N (Optional)
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/
N8N_API_KEY=your_n8n_api_key

# Firebase
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id

# Backend
FLASK_ENV=development
FLASK_DEBUG=True
```

### 3. Google Sheets Setup

1. Create a new Google Sheet for incident logging
2. Enable Google Sheets API in Google Cloud Console
3. Create a service account and download credentials JSON
4. Share the spreadsheet with the service account email
5. Update spreadsheet ID in environment variables

### 4. Firebase Setup

1. Create a Firebase project
2. Enable Authentication with Email/Password provider
3. Configure Firestore Database (optional)
4. Add Firebase config to frontend (`src/firebase.js`)
5. Update Firebase credentials in environment variables

### 5. Start the Application

```bash
# Terminal 1: Start Backend (port 5000)
cd backend
python server.py

# Terminal 2: Start Frontend (port 4028)
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:4028
- **Backend API**: http://localhost:5000

## 🎯 Dashboard Overview

### 1. **Main Dashboard**
- System health overview and key metrics
- Real-time security status indicators
- Quick action panels for common tasks
- Recent alerts and incident stream
- Integration status monitoring

### 2. **Alerts Dashboard**
- Real-time security alerts and notifications
- AI-powered incident analysis and prioritization
- Automated response triggers and workflows
- Alert filtering, sorting, and bulk actions
- Alert escalation and assignment features

### 3. **Traffic Dashboard**
- Network traffic monitoring and visualization
- Connection logs with advanced filtering
- Threat detection and blocking metrics
- Real-time traffic flow charts and graphs
- Geographic traffic analysis

### 4. **Reports Dashboard**
- Professional incident report generation
- AI-powered executive summaries and analysis
- Custom report builder with date filtering
- Scheduled reports and automated delivery
- Report templates and customization options

### 5. **Security Chatbot**
- AI-powered security assistance and guidance
- Context-aware conversations with incident data
- Action execution capabilities (investigate IP, generate reports)
- Conversation history and session management
- Integration with live security data

### 6. **Admin Dashboard**
- User management and role assignment
- System configuration and settings
- Integration management and testing
- Audit logs and system monitoring
- Administrative controls and permissions

### 7. **Settings Dashboard**
- Automation rules configuration
- Security integrations setup
- System preferences and customization
- User profile management
- Notification preferences

### 8. **System Health Dashboard**
- Real-time system performance metrics
- Service availability monitoring
- Resource utilization tracking
- Error logging and diagnostics
- Health check automation

### 9. **Search Dashboard**
- Advanced incident and log searching
- Full-text search across all data sources
- Filter and query builder
- Search result export capabilities
- Saved search queries

## 🔧 Key Workflows

### Incident Response Process
1. **Detection**: Real-time monitoring captures security events via IDS or integrations
2. **Analysis**: AI automatically analyzes incidents using Groq models and historical data
3. **Enrichment**: System enriches incidents with threat intelligence and context
4. **Response**: Automated workflows trigger appropriate responses via N8N
5. **Escalation**: Critical incidents are escalated based on severity and rules
6. **Reporting**: Professional reports are generated with AI-powered summaries
7. **Resolution**: Incident status is tracked and updated through resolution
8. **Learning**: Self-learning models incorporate incident data for future improvements

### Report Generation Workflow
1. Select incidents or create custom report parameters
2. AI analyzes selected data and generates comprehensive insights
3. Professional PDF reports are created with:
   - Executive summaries and key findings
   - Detailed incident timelines and analysis
   - Forensic evidence and technical details
   - Risk assessments and impact analysis
   - Recommendations and mitigation strategies

### Chatbot Interaction Workflow
1. User initiates conversation with security query
2. Chatbot analyzes recent incidents and system context
3. AI provides contextual responses and suggestions
4. User can execute actions like IP investigation or report generation
5. Conversation history is maintained for continuity
6. Actions trigger appropriate workflows and responses

## 📊 API Endpoints

### Core Endpoints
- `GET /health` - Service health check
- `GET/POST /incidents` - Incident CRUD operations
- `PUT /incidents/<event_id>/status` - Update incident status
- `POST /incidents/bulk` - Bulk incident operations

### AI Services
- `POST /ai/analyze` - AI-powered security event analysis
- `POST /ai/report` - Generate incident reports
- `POST /ai/threat-intelligence` - Threat intelligence queries
- `POST /ai/chat` - Security chatbot interactions
- `POST /ai/action` - Execute security actions

### N8N Integration
- `POST /n8n/trigger` - Trigger automation workflows
- `POST /n8n/agent` - Call N8N agents
- `GET /n8n/ping` - Check N8N connectivity
- `POST /n8n/test-integration` - Test integration setup

### Authentication & Users
- `POST /auth/signup` - User registration
- `POST /auth/verify` - Token verification
- `GET /metrics` - Dashboard metrics (authenticated)

### Advanced Features
- `POST /chatbot/generate-report` - Generate chatbot-based reports
- `GET /chatbot/download-report/<id>` - Download PDF reports
- `GET/POST /ids/*` - IDS monitoring and log management
- `GET /integrations/status` - Integration health checks
- `POST /ai/self-enhance/*` - AI-powered code enhancement

### Chat & History
- `POST /chat/agent` - Agent-based chat interactions
- `POST /chat/execute` - Execute chat actions
- `GET/POST /chat/*` - Chat history management

## 🚀 Deployment

### Development
```bash
# Frontend
npm run dev

# Backend
cd backend && python server.py
```

### Production Build
```bash
# Build frontend
npm run build

# Backend deployment (using Gunicorn)
cd backend
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 server:app
```

### Docker Deployment (Recommended)
```dockerfile
# Dockerfile example
FROM node:18-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM python:3.9-slim AS backend
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt
COPY backend/ ./

EXPOSE 5000 4028
# Add proper CMD for both services
```

## 🔒 Security Features

- **Real-time Threat Detection**: Continuous monitoring with IDS integration
- **AI-Powered Analysis**: Intelligent threat assessment and automated classification
- **Automated Response**: Workflow-driven incident response and mitigation
- **Professional Reporting**: SOC-grade incident documentation and compliance
- **Access Control**: Firebase-based authentication with role-based permissions
- **Data Encryption**: Secure API communication and data transmission
- **Audit Logging**: Comprehensive logging of all security events and actions
- **Integration Security**: Secure webhook handling and API authentication

## 📈 Performance & Scalability

- **Real-time Processing**: Sub-second response times for alerts and analysis
- **Scalable Architecture**: Modular design supporting high-volume security monitoring
- **Optimized Queries**: Efficient data retrieval from Google Sheets and integrations
- **AI Caching**: Intelligent response caching for improved performance
- **Background Processing**: Asynchronous task handling for heavy operations
- **Resource Monitoring**: Built-in performance tracking and optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following the existing code style
4. Add tests if applicable
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines
- Follow React and Python best practices
- Use TypeScript for new frontend components
- Add proper error handling and logging
- Update documentation for new features
- Test integrations thoroughly

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Groq AI** for advanced language model capabilities
- **N8N** for powerful workflow automation platform
- **Google Cloud** for reliable data persistence and APIs
- **Firebase** for authentication and real-time features
- **React & Vite** communities for excellent development tools
- **TailwindCSS** for beautiful and responsive design system

## 📞 Support & Documentation

For support and questions:
- Create an issue in the repository
- Check the backend README for API documentation
- Review troubleshooting guides
- Join our community discussions

### Additional Resources
- [API Documentation](./backend/README.md)
- [Frontend Component Library](./src/components/)
- [Workflow Examples](./workflow/)
- [Configuration Guide](./docs/)

---

**Built for modern SOC teams with enterprise-grade security operations in mind.**
**Empowering security professionals with AI-driven insights and automated response capabilities.**
