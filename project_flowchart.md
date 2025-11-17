# SOAR SOC Assistant - Project Flowchart

```mermaid
graph TD
    A[User Login] --> B[Firebase Authentication]
    B --> C{Main Dashboard}

    C --> D[Alerts Dashboard]
    C --> E[Traffic Dashboard]
    C --> F[Reports Dashboard]
    C --> G[Security Chatbot]
    C --> H[Admin Dashboard]
    C --> I[Settings Dashboard]
    C --> J[System Health Dashboard]
    C --> K[Search Dashboard]

    D --> L[Real-time Alerts]
    L --> M[AI Analysis - Groq]
    M --> N[Incident Enrichment]
    N --> O{Automated Response?}
    O -->|Yes| P[N8N Workflow Trigger]
    O -->|No| Q[Manual Response]

    P --> R[Incident Logging - Google Sheets]
    Q --> R

    F --> S[Report Builder]
    S --> T[AI Report Generation]
    T --> U[PDF Report Creation]
    U --> V[Scheduled Reports]

    G --> W[Chat Input]
    W --> X[AI Processing - Groq]
    X --> Y[Action Execution]
    Y --> Z[Response Generation]
    Z --> AA[Conversation History]

    subgraph Backend Services
        BB[Flask API Server]
        BB --> CC[Incident Management]
        BB --> DD[AI Services]
        BB --> EE[N8N Integration]
        BB --> FF[Google Sheets API]
        BB --> GG[Firebase Admin]
        BB --> HH[IDS Monitoring]
        BB --> II[Self-Learning ML]
    end

    subgraph Data Flow
        JJ[Real-time Monitoring] --> KK[IDS Logs]
        KK --> LL[Threat Detection]
        LL --> MM[Alert Generation]
        MM --> NN[Incident Data]
        NN --> OO[Report Generation]
        OO --> PP[Google Sheets Storage]
    end

    subgraph AI & ML
        QQ[Groq AI Models] --> RR[Security Analysis]
        QQ --> SS[Chatbot Responses]
        QQ --> TT[Threat Intelligence]
        UU[Self-Learning Model] --> VV[Continuous Improvement]
        WW[NIDS Model] --> XX[Intrusion Detection]
    end

    subgraph Integrations
        YY[N8N Workflows] --> ZZ[Automation]
        AAA[Google Sheets] --> BBB[Data Persistence]
        CCC[Firebase] --> DDD[Authentication]
    end

    subgraph Frontend Architecture
        EEE[React + Vite]
        EEE --> FFF[Redux State Management]
        EEE --> GGG[TailwindCSS UI]
        EEE --> HHH[React Router]
        EEE --> III[D3.js Charts]
    end

    BB --> Frontend
    Frontend --> BB
    Integrations --> BB
    AI & ML --> BB
    Data Flow --> BB

    style A fill:#e1f5fe
    style C fill:#f3e5f5
    style BB fill:#e8f5e8
    style QQ fill:#fff3e0
    style YY fill:#fce4ec
    style EEE fill:#f1f8e9
```

## Flowchart Explanation

### Main Components:
- **Frontend**: React-based UI with multiple dashboards
- **Backend**: Flask API server handling all business logic
- **AI/ML Services**: Groq AI for analysis, self-learning models
- **Integrations**: N8N for automation, Google Sheets for data, Firebase for auth
- **Data Flow**: Real-time monitoring to incident management

### Key Workflows:
1. **Incident Response**: Detection → Analysis → Response → Logging
2. **Report Generation**: Builder → AI Analysis → PDF Creation
3. **Chatbot Interaction**: Input → AI Processing → Action Execution

### Data Flow:
- Real-time monitoring feeds IDS logs
- Threat detection generates alerts
- AI analysis enriches incidents
- Automated/N8N responses trigger workflows
- Reports are generated and stored

This flowchart represents the high-level architecture and main data flows of the SOAR SOC Assistant project.
