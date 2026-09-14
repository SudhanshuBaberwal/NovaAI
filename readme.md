# 🤖 AI Agent System

> A production-oriented, microservices-based AI Agent System built with
> **LangChain, LangGraph, Gemini, Groq, Redis, RAG, Docker, and AWS
> EC2**.

This project is designed to provide an intelligent conversational AI
system with persistent sessions, Retrieval-Augmented Generation (RAG),
agent workflows, and a scalable microservices architecture.

------------------------------------------------------------------------

## ✨ Features

-   🧠 **AI Agent Architecture** using LangChain and LangGraph
-   🔀 **Graph-based Agent Workflows** with LangGraph
-   ⚡ **Fast LLM Inference** with Groq
-   💎 **Google Gemini Integration** for generative AI and embeddings
-   📚 **RAG (Retrieval-Augmented Generation)** for knowledge-grounded
    responses
-   🔴 **Redis** for session management, caching, and RAG-related data
-   🔐 **Session-based Authentication Middleware**
-   🧩 **Microservices Architecture** for independent service
    development and deployment
-   🐳 **Docker & Docker Compose** for containerized services
-   ☁️ **AWS EC2 Deployment** for cloud hosting
-   🌐 **API Gateway** for routing requests between services
-   📦 Modular backend structure for easier scaling and maintenance

------------------------------------------------------------------------

## 🏗️ Architecture

``` text
                         ┌─────────────────────┐
                         │      Frontend       │
                         │   Web Application   │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │     API Gateway     │
                         │  Auth + Routing     │
                         └──────────┬──────────┘
                                    │
                 ┌──────────────────┼──────────────────┐
                 │                  │                  │
                 ▼                  ▼                  ▼
        ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
        │  Auth / User   │ │  AI Agent      │ │  RAG Service   │
        │    Service     │ │    Service     │ │                │
        └────────────────┘ └───────┬────────┘ └───────┬────────┘
                                   │                  │
                                   ▼                  ▼
                           ┌────────────────┐  ┌────────────────┐
                           │   LangGraph    │  │     Redis      │
                           │ Agent Workflow │  │ Session / Data │
                           └───────┬────────┘  └───────┬────────┘
                                   │                   │
                         ┌─────────┴─────────┐         │
                         │                   │         │
                         ▼                   ▼         ▼
                 ┌──────────────┐    ┌──────────────┐
                 │ Google Gemini │    │     Groq     │
                 │ LLM / Embed  │    │ Fast Inference│
                 └──────────────┘    └──────────────┘

                              Docker
                                │
                                ▼
                         ┌──────────────┐
                         │   AWS EC2    │
                         │ Cloud Server  │
                         └──────────────┘
```

------------------------------------------------------------------------

## 🧠 AI Agent Workflow

The AI layer uses **LangChain** for LLM/tool integration and
**LangGraph** for orchestrating the agent as a stateful workflow.

A typical request flows through:

``` text
User Query
    │
    ▼
API Gateway
    │
    ▼
Authentication
    │
    ▼
Agent Service
    │
    ▼
LangGraph State
    │
    ├──► Retrieve relevant context
    │
    ├──► RAG / Redis retrieval
    │
    ├──► Decide required action
    │
    ├──► Generate response
    │
    ▼
Gemini / Groq
    │
    ▼
Agent Response
    │
    ▼
Client
```

LangGraph makes it possible to represent the agent as a controlled graph
rather than a single LLM call.

------------------------------------------------------------------------

## 📚 RAG Pipeline

The project uses **Retrieval-Augmented Generation (RAG)** to provide the
agent with external knowledge before generating an answer.

### RAG Flow

``` text
Documents / Knowledge
        │
        ▼
Document Processing
        │
        ▼
Chunking
        │
        ▼
Gemini Embeddings
        │
        ▼
Vector Representations
        │
        ▼
Redis
        │
        ▼
User Query
        │
        ▼
Query Embedding
        │
        ▼
Similarity Retrieval
        │
        ▼
Relevant Context
        │
        ▼
LangGraph Agent
        │
        ▼
Gemini / Groq
        │
        ▼
Grounded AI Response
```

RAG reduces the need for the LLM to rely only on its pre-trained
knowledge and allows the system to answer using application-specific
information.

------------------------------------------------------------------------

## 🔴 Redis

Redis is used as a high-performance data layer within the system.

Possible responsibilities include:

-   Session storage
-   Authentication/session lookup
-   Conversation state
-   Caching
-   RAG/vector retrieval
-   Fast temporary data access

### Session Flow

``` text
Client
  │
  ▼
Session Cookie
  │
  ▼
API Gateway
  │
  ▼
Redis
  │
  ├── Session exists → Continue
  │
  └── Session missing → Unauthorized
```

The gateway authentication middleware retrieves the session from Redis
and attaches the parsed session information to the request before
forwarding it to downstream services.

------------------------------------------------------------------------

## 🧩 Microservices

The backend is organized around independently deployable services.

Example structure:

``` text
backend/
│
├── gateway/
│   ├── controller/
│   ├── middleware/
│   ├── utils/
│   └── index.js
│
├── services/
│   ├── auth-service/
│   ├── user-service/
│   ├── agent-service/
│   └── rag-service/
│
├── shared/
│   └── redis/
│
├── docker-compose.yml
└── package.json
```

### Why Microservices?

The architecture makes it easier to:

-   Scale AI services independently
-   Deploy services separately
-   Isolate failures
-   Maintain individual codebases
-   Add new AI capabilities
-   Run different workloads independently
-   Improve long-term maintainability

------------------------------------------------------------------------

## 🛠️ Technology Stack

  Category              Technology
  --------------------- --------------------------------
  Frontend              React / Next.js
  Backend               Node.js
  API Gateway           Express.js
  AI Framework          LangChain
  Agent Orchestration   LangGraph
  LLM                   Google Gemini
  Fast LLM Inference    Groq
  Embeddings            Gemini
  RAG                   Retrieval-Augmented Generation
  Data / Cache          Redis
  Authentication        Session-based authentication
  Containers            Docker
  Orchestration         Docker Compose
  Cloud                 AWS EC2
  Version Control       Git + GitHub

------------------------------------------------------------------------

## 📁 Project Structure

``` text
AI-AGENT-SYSTEM/
│
├── backend/
│   │
│   ├── gateway/
│   │   ├── controller/
│   │   ├── middleware/
│   │   │   └── auth.middleware.js
│   │   ├── utils/
│   │   ├── .env
│   │   ├── index.js
│   │   └── package.json
│   │
│   ├── services/
│   │   ├── auth-service/
│   │   ├── user-service/
│   │   ├── agent-service/
│   │   └── rag-service/
│   │
│   ├── shared/
│   │   └── redis/
│   │       └── redis.js
│   │
│   ├── docker-compose.yml
│   └── package.json
│
├── frontend/
│
├── .gitignore
└── README.md
```

> Service names can be adjusted according to the implementation in each
> deployment.

------------------------------------------------------------------------

## 🚀 Getting Started

### 1. Clone the Repository

``` bash
git clone https://github.com/<your-username>/<your-repository>.git
cd AI-AGENT-SYSTEM
```

### 2. Install Dependencies

Install dependencies for the gateway and each service.

``` bash
cd backend
npm install
```

For individual services:

``` bash
cd services/<service-name>
npm install
```

------------------------------------------------------------------------

## 🔐 Environment Variables

Create `.env` files for the services that require them.

Example:

``` env
# Server
PORT=8000
NODE_ENV=development

# Redis
REDIS_URL=redis://localhost:6379

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key

# Groq
GROQ_API_KEY=your_groq_api_key

# Authentication
SESSION_SECRET=your_session_secret

# Service URLs
AUTH_SERVICE_URL=http://localhost:8001
AGENT_SERVICE_URL=http://localhost:8002
RAG_SERVICE_URL=http://localhost:8003
```

Never commit real API keys or secrets to GitHub.

Add environment files to `.gitignore`:

``` gitignore
.env
.env.*
!.env.example
```

------------------------------------------------------------------------

## 🐳 Running with Docker

Build the containers:

``` bash
docker compose build
```

Start the complete stack:

``` bash
docker compose up -d
```

Check running containers:

``` bash
docker compose ps
```

View logs:

``` bash
docker compose logs -f
```

Stop the system:

``` bash
docker compose down
```

Rebuild after code changes:

``` bash
docker compose up -d --build
```

------------------------------------------------------------------------

## ☁️ AWS EC2 Deployment

The application can be deployed to an **AWS EC2** instance using Docker.

### Deployment Architecture

``` text
                    Internet
                       │
                       ▼
                ┌──────────────┐
                │    EC2       │
                │   Instance   │
                └──────┬───────┘
                       │
                  Docker Engine
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
     Gateway        AI Agent       RAG/Redis
     Container      Container      Containers
        │              │              │
        └──────────────┼──────────────┘
                       ▼
                  AI Providers
               Gemini / Groq APIs
```

### Basic EC2 Setup

``` bash
sudo apt update
sudo apt install docker.io docker-compose-plugin -y
```

Start Docker:

``` bash
sudo systemctl enable docker
sudo systemctl start docker
```

Clone the project:

``` bash
git clone https://github.com/<your-username>/<your-repository>.git
cd AI-AGENT-SYSTEM/backend
```

Build and run:

``` bash
docker compose up -d --build
```

Check:

``` bash
docker ps
```

------------------------------------------------------------------------

## 🔒 Security Considerations

For production deployment:

-   Store secrets in environment variables or a secrets manager.
-   Never expose Redis directly to the public internet.
-   Restrict EC2 Security Group ports.
-   Use HTTPS through a reverse proxy/load balancer.
-   Validate and sanitize incoming requests.
-   Protect internal service endpoints.
-   Use secure, HTTP-only cookies for sessions.
-   Rotate API keys and credentials regularly.
-   Apply rate limiting to public APIs.

------------------------------------------------------------------------

## 📈 Scalability

The architecture is designed so individual services can be scaled
independently.

For example:

``` text
                API Gateway
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
       Agent #1   Agent #2   Agent #3
          │          │          │
          └──────────┼──────────┘
                     ▼
                   Redis
```

This allows additional AI-agent instances to handle increased traffic
without duplicating every backend component.

For larger deployments, the architecture can be extended with:

-   AWS Application Load Balancer
-   EC2 Auto Scaling
-   ElastiCache for Redis
-   ECS / EKS
-   CloudWatch
-   CI/CD pipelines
-   Centralized logging
-   Distributed tracing

------------------------------------------------------------------------

## 🔄 Request Lifecycle

A complete request can follow this lifecycle:

``` text
1. User sends a message
          ↓
2. Request reaches API Gateway
          ↓
3. Authentication middleware checks session
          ↓
4. Session is retrieved from Redis
          ↓
5. Request is routed to Agent Service
          ↓
6. LangGraph initializes agent state
          ↓
7. RAG retrieves relevant knowledge
          ↓
8. Agent decides how to process the request
          ↓
9. Gemini / Groq generates the response
          ↓
10. Response is returned through Gateway
          ↓
11. Client receives AI response
```

------------------------------------------------------------------------

## 🧪 Local Development

Run Redis locally:

``` bash
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:latest
```

Then start the required services:

``` bash
npm run dev
```

Use tools such as Postman, Thunder Client, or curl to test APIs.

Example:

``` bash
curl http://localhost:8000/health
```

------------------------------------------------------------------------

## 🎯 Future Improvements

-   [ ] Streaming AI responses
-   [ ] Tool-calling agents
-   [ ] Long-term conversation memory
-   [ ] Better vector search and reranking
-   [ ] Agent observability and tracing
-   [ ] Rate limiting
-   [ ] API versioning
-   [ ] Automated testing
-   [ ] CI/CD with GitHub Actions
-   [ ] AWS CloudWatch monitoring
-   [ ] HTTPS + custom domain
-   [ ] Load balancing
-   [ ] Auto scaling
-   [ ] Evaluation pipeline for RAG quality
-   [ ] Multi-agent collaboration

------------------------------------------------------------------------

## 📊 High-Level Design Goals

This project focuses on combining modern AI engineering with backend
system design:

``` text
        AI Engineering
             +
        Agent Systems
             +
          RAG
             +
      Microservices
             +
       Distributed Cache
             +
          Docker
             +
          AWS EC2
             ↓
     Scalable AI Platform
```

The goal is not simply to build a chatbot, but to create a backend
architecture capable of supporting **stateful AI agents, retrieval,
independent services, containerized deployment, and cloud
infrastructure**.

------------------------------------------------------------------------

## 👨‍💻 Author

**Sudhanshu Baberwal**

B.Tech --- Computer Science & Engineering

IIIT Dharwad

------------------------------------------------------------------------

## ⭐ Support

If you find this project useful, consider giving the repository a ⭐ on
GitHub.