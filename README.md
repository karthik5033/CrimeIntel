<div align="center">
  <img src="public/images/crimeintel_analytics_white_1784721719340.png" alt="CrimeIntel Logo" width="120" />
  <h1>CrimeIntel</h1>
  <p><strong>Next-Generation Police Intelligence & Case Management Platform</strong></p>
  <p><em>Built exclusively for Law Enforcement Agencies (LEAs) & Karnataka State Police (KSP)</em></p>
</div>

<br />

<div align="center">
  <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-15.0-black?logo=next.js" alt="Next.js"></a>
  <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind-CSS-06B6D4?logo=tailwindcss" alt="Tailwind CSS"></a>
  <a href="https://ui.shadcn.com"><img src="https://img.shields.io/badge/shadcn%2Fui-000000?logo=shadcnui&logoColor=white" alt="shadcn/ui"></a>
  <a href="https://www.zoho.com/catalyst/"><img src="https://img.shields.io/badge/Zoho-Catalyst-blue?logo=zoho" alt="Zoho Catalyst"></a>
  <img src="https://img.shields.io/badge/License-Proprietary-red.svg" alt="License">
</div>

---

## 📖 Overview

**CrimeIntel** is a highly secure, enterprise-grade intelligence dashboard and case management software designed to centralize state policing infrastructure. It acts as an integration layer over existing systems like CCTNS, providing actionable intelligence, suspect tracking, entity-relationship graphing, and predictive real-time heatmaps for superintendents and field officers.

Built with performance and operational security in mind, the system uses modern frontend technologies coupled with a secure backend architecture via Zoho Catalyst.

---

## ✨ Core Features

- **Central Intelligence Dashboard**: Real-time monitoring for officers. Track active investigations, high-risk alerts, and jurisdiction statistics on a single pane of glass.
- **Criminal Network Graphing**: Identify hidden links between suspects, vehicles, properties, and known criminal syndicates using advanced entity-relationship modeling.
- **Real-Time Crime Heatmaps**: Geospatial mapping of recent FIRs and incident reports to predict and prevent future crime spikes.
- **Facial Recognition & Profiling**: Automated suspect matching against state databases, complete with confidence scores and criminal history dossiers.
- **Live Unit Dispatch (CAD)**: Track active response units, active calls, and resource allocation in real-time.

---

## 📸 Screenshots

| Intelligence Graph | Case File UI |
| :---: | :---: |
| <img src="public/images/intelligence_graph_ui_1784723448238.png" width="400" /> | <img src="public/images/crime_case_file_ui_1784723422475.png" width="400" /> |
| **Real-time Heatmap** | **Live CAD Dispatch** |
| <img src="public/images/crime_heatmap_ui_1784728718764.png" width="400" /> | <img src="public/images/police_cad_dashboard_ui_1784723433845.png" width="400" /> |

---

## 🏗️ System Architecture

CrimeIntel employs a decoupled, modular architecture designed for high availability and strict CJIS/enterprise compliance. 

```mermaid
graph TD
    %% Frontend Layer
    subgraph Frontend [Presentation Layer - Next.js]
        A[Web Dashboard]
        B[Mobile Field App]
    end

    %% API Gateway Layer
    subgraph Gateway [API Gateway - Zoho Catalyst]
        C[Auth & RBAC]
        D[Rate Limiting & Audit]
    end

    %% Microservices Layer
    subgraph Microservices [Backend Services]
        E[Intelligence Engine]
        F[Geospatial Service]
        G[Entity Graph Builder]
    end

    %% Databases & External Systems
    subgraph DataLayer [Data & Integration Layer]
        H[(CrimeIntel DB)]
        I[(Zoho Data Store)]
        J[[State CCTNS System]]
        K[[External Forensics API]]
    end

    %% Connections
    A --> C
    B --> C
    C --> D
    D --> E
    D --> F
    D --> G
    
    E --> H
    E --> I
    F --> H
    G --> I
    
    E -.-> J
    G -.-> K
```

### Technology Stack

#### 🖥️ Frontend
- **Framework**: Next.js 15 (App Router, Server Components)
- **Styling**: Tailwind CSS, Framer Motion
- **UI Components**: Shadcn UI (Radix UI primitives)
- **Data Visualization**: Recharts (for dashboards), specialized graph libraries.
- **State Management**: Zustand (for localized global state), React Server Components.

#### ⚙️ Backend & Infrastructure
- **Serverless Compute**: Zoho Catalyst Functions (Node.js/Java)
- **Database**: Zoho Catalyst Relational Data Store / PostgreSQL
- **Caching**: Zoho Catalyst Cache (Redis-backed)
- **Authentication**: Zoho Catalyst Auth (with strict RBAC for Officer / Admin roles)

---

## 🔐 Security & Compliance

Given the highly sensitive nature of law enforcement data, CrimeIntel implements zero-trust architecture principles:

1. **AES-256 Encryption**: All data is encrypted at rest and in transit (TLS 1.3).
2. **Strict Audit Logging**: Every query, export, and search is immutably logged to an audit trail.
3. **Role-Based Access Control (RBAC)**: Fine-grained permissions restrict data access based on rank and jurisdiction.
4. **CJIS Compatibility**: Infrastructure designed to be deployed on government-approved sovereign cloud instances or strictly on-premise.

---

## 🚀 Development Setup

Follow these steps to run the CrimeIntel frontend locally:

### Prerequisites
- Node.js 18.x or higher
- npm or pnpm
- Zoho Catalyst CLI (for backend deployment)

### 1. Clone the repository
```bash
git clone https://github.com/karthik5033/CrimeIntel.git
cd CrimeIntel/crimeintel
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup environment variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_ZOHO_PROJECT_ID=your_project_id
ZOHO_CATALYST_API_KEY=your_api_key
```

### 4. Start the development server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

---

## 📜 Roadmap

- [x] High-fidelity Dashboard & Command Center UI
- [x] Landing Page with specialized police domain copy
- [ ] Connect Authentication to Zoho Catalyst
- [ ] Implement live WebSocket feed for CAD dispatch
- [ ] Build interactive entity-relationship Graph UI
- [ ] Implement CCTNS mock data ingestion pipelines

---

<div align="center">
  <p>Designed and engineered for the <strong>KSP Hackathon 2026</strong>.</p>
</div>
