# ChaosLab

### AI-Powered Microservice Resilience & Chaos Engineering Platform

ChaosLab is an interactive microservice resilience and chaos engineering platform that helps developers understand how failures propagate through distributed systems, evaluate service dependencies, simulate infrastructure failures, monitor resilience mechanisms, and verify recovery.

It combines deterministic graph-based failure propagation, AI-assisted incident analysis, circuit breakers, fault injection, traffic simulation, and recovery verification in a single interactive dashboard.

---

## 1. The Problem

Modern applications rely on multiple interconnected microservices. A failure in one service can trigger a chain reaction that affects other services and potentially brings down the entire application.

For example:

- A database failure can affect authentication, orders, payments, and other dependent services.
- A slow payment service can increase request latency and affect the checkout experience.
- An authentication failure can prevent users from accessing multiple application features.

Understanding these dependencies and predicting the impact of failures is difficult without dedicated monitoring and chaos engineering tools.

Traditional monitoring systems primarily report what has already failed. Developers also need a way to simulate failures, understand their potential impact, evaluate resilience mechanisms, and verify recovery.

**ChaosLab addresses this problem by providing an interactive environment for failure simulation, cascade analysis, resilience testing, and incident recovery.**

---

## 2. Our Approach

ChaosLab represents a microservice architecture as an interactive dependency graph.

Developers can select a service, inject a failure, and observe how the failure propagates through connected services.

The platform combines:

1. **Graph-Based Failure Analysis:** Uses deterministic Breadth-First Search (BFS) to calculate downstream failure propagation.
2. **AI-Assisted Incident Analysis:** Uses specialized agents to analyze incidents, evaluate risks, plan recovery, and review recommendations.
3. **Chaos Engineering Sandbox:** Allows developers to inject controlled failures and observe service behavior.
4. **Resilience Mechanisms:** Integrates circuit breakers to prevent repeated requests to failing services.
5. **Recovery Verification:** Compares predicted recovery outcomes with observed sandbox states.
6. **Benchmarking:** Evaluates deterministic cascade propagation against predefined test scenarios.

The result is a practical environment for understanding and testing microservice resilience.

---

## 3. Key Features

### 3.1 Interactive Microservice Topology

ChaosLab provides an interactive dependency graph containing eight interconnected services:

- Gateway
- Authentication
- Catalog
- Cart
- Payment
- Orders
- Notifications
- Database

Features include:

- Interactive React Flow topology.
- Service dependency visualization.
- Zoom and pan controls.
- Minimap navigation.
- Visual service health indicators.
- Failure propagation visualization.

The graph helps developers understand how individual service failures can affect the overall architecture.

### 3.2 Failure Simulation Panel

Developers can select a target service and simulate different failure conditions.

Supported failure modes include:

- Service unavailable.
- High latency.

ChaosLab provides two simulation modes:

**Run Simulation**

Performs a safe, graph-based simulation to calculate the potential impact without injecting an actual sandbox fault.

**Run for Real**

Executes the simulation against the sandbox environment to observe actual simulated service behavior.

This distinction allows developers to compare predicted failure propagation with sandbox behavior.

### 3.3 Preset Failure Scenarios

ChaosLab provides one-click presets for common infrastructure failures:

| Preset        | Description                              |
| ------------- | ---------------------------------------- |
| Database Down | Simulates database unavailability        |
| Payment Slow  | Simulates increased payment latency      |
| Auth Down     | Simulates authentication service failure |

A reset operation allows the environment to return to its initial state.

### 3.4 BFS-Based Failure Cascade Analysis

ChaosLab uses Breadth-First Search (BFS) to calculate how failures propagate through the service dependency graph.

When a service fails:

1. Identify the target service.
2. Retrieve its dependent services.
3. Traverse the dependency graph using BFS.
4. Identify downstream affected services.
5. Calculate the overall impact.
6. Display the affected services visually.

The deterministic algorithm makes cascade analysis reproducible and helps developers understand dependency-related failure propagation.

### 3.5 AI-Powered Incident Analysis

ChaosLab uses four specialized AI agents to support incident investigation and recovery planning.

**1. Failure Analysis Agent**

- Identifies the failed service.
- Examines the failure type.
- Analyzes downstream service impact.
- Explains possible failure propagation.

**2. Risk Evaluator Agent**

- Evaluates incident severity.
- Identifies critical affected services.
- Explains potential system impact.
- Highlights important risks.

**3. Recovery Planner Agent**

- Suggests recovery actions.
- Prioritizes recommended steps.
- Explains why each action is necessary.
- Provides a structured recovery plan.

**4. Critic Agent**

- Reviews the proposed recovery plan.
- Identifies missing steps and potential risks.
- Evaluates whether recommendations are appropriate.
- Provides a final assessment.

The agents use incident information and simulation results to produce context-specific analysis.

### 3.6 Offline AI Fallback

ChaosLab is designed to remain usable even when an external AI API is unavailable or slow.

The offline fallback provides deterministic, incident-specific analysis using the application's existing incident and dependency information.

This helps maintain core analysis functionality without depending entirely on an external AI provider.

AI-generated responses and offline fallback responses should be distinguished clearly in the interface.

### 3.7 Circuit Breaker Integration

ChaosLab integrates circuit breaker patterns to demonstrate how distributed systems can isolate failing services.

Circuit breakers maintain independent states for sandbox services.

The three standard states are:

| State     | Description                                                            |
| --------- | ---------------------------------------------------------------------- |
| CLOSED    | Requests are allowed normally                                          |
| OPEN      | Requests are rejected to prevent repeated calls to a failing service   |
| HALF-OPEN | Limited requests are allowed to test whether the service has recovered |

Features include:

- Independent circuit breakers for services.
- Failure and success tracking.
- Request interception.
- Rejection of requests when a breaker is OPEN.
- Circuit state monitoring.
- Circuit reset during sandbox recovery.

The circuit breaker integration demonstrates an important resilience pattern used in distributed applications.

### 3.8 Chaos Engineering Sandbox

The Sandbox Lab allows developers to inject controlled faults into individual services.

Available controls include:

- Service selection.
- Fault type selection.
- Fault duration configuration.
- Inject Fault.
- Reset Sandbox.

Example fault:

- Target: Database
- Fault: Stop Service (503)
- Duration: Configurable number of seconds

The sandbox exposes service states and circuit breaker behavior so developers can observe how the system responds to failures.

### 3.9 Live Service States

ChaosLab displays the current simulated health state of all eight sandbox services.

Developers can monitor:

- Healthy services.
- Failed services.
- Service recovery.
- Changes resulting from fault injection and reset operations.

This provides a visual representation of the sandbox environment.

### 3.10 Gateway Traffic Metrics

The dashboard includes gateway-level traffic metrics.

Metrics include:

- Request success rate.
- P95 latency.

These metrics help developers observe how simulated failures influence application traffic and performance.

They represent sandbox-generated metrics, not production telemetry.

### 3.11 Simulation and Run History

ChaosLab maintains a history of simulation runs.

Each recorded run can display:

- Target service.
- Failure type.
- Execution time.
- Number of affected services.

History management includes:

- View previous runs.
- Export individual runs as Markdown (`.md`).
- Delete individual runs.
- Clear all history.

This helps developers review and document previous experiments.

### 3.12 Agent Activity and Recovery Recommendations

The dashboard provides dedicated panels for agent activity and recovery recommendations.

These panels present incident analysis, agent progress, and suggested recovery actions.

Recommendations are intended to help developers understand what should be investigated or recovered first.

Generated recommendations should not be confused with automatically executed recovery operations.

### 3.13 Verified Recovery Check

ChaosLab includes a recovery verification workflow.

Developers can review and approve a recovery check before executing it.

The workflow includes:

1. Review the proposed recovery.
2. Approve the recovery check using the checkbox.
3. Execute Verified Recovery.
4. Evaluate the verification result.
5. Compare predicted and observed recovery outcomes.

This helps distinguish between a recovery action being attempted and recovery actually being verified.

### 3.14 Benchmarking System

ChaosLab includes a predefined benchmark suite containing 12 scenarios.

| Scenario Category      | Number of Scenarios |
| ---------------------- | ------------------: |
| Service unavailability |                   8 |
| High latency           |                   4 |
| **Total**              |              **12** |

The eight availability scenarios cover all eight services.

The four latency scenarios cover:

- Database
- Payment
- Catalog
- Authentication

The benchmark evaluates deterministic BFS cascade propagation against the predefined service dependency graph.

It compares expected impact with computed impact and reports scenario-level PASS/FAIL results.

**Reported benchmark result:** 12/12 scenarios passed, with 100% graph traversal consistency in the predefined benchmark suite.

**Important:** This measures deterministic graph traversal consistency against predefined scenarios. It is not a measurement of real-world AI prediction accuracy or validation against production incidents.

---

## 4. How the AI System Works

ChaosLab organizes incident analysis into four specialized stages.

\<pre> Incident / Failure         |         v Failure Analysis Agent         |         v Risk Evaluator Agent         |         v Recovery Planner Agent         |         v Critic Agent         |         v Final Incident Analysis and Recovery Recommendations \</pre>

Each agent has a specific responsibility.

The Failure Analysis Agent investigates the incident, the Risk Evaluator assesses its impact, the Recovery Planner suggests corrective actions, and the Critic reviews the proposed plan.

When the external AI service is unavailable, the offline fallback provides deterministic analysis based on available incident data.

The BFS algorithm remains responsible for deterministic graph-based cascade calculations; AI-generated explanations do not replace that calculation.

---

## 5. Architecture

ChaosLab follows a frontend-backend architecture.

\<pre>               CHAOSLAB PLATFORM                      |           +----------+----------+           |                     |           v                     v     React Frontend        Express Backend           |                     |           |              +------+------+           |              |             |           v              v             v    Interactive Graph  BFS Analysis  AI Agents           |              |             |           |              v             v           |         Impact Analysis  Incident           |                          Analysis           |           v       Sandbox Lab           |     +-----+----------+     |                |     v                v Fault Injection   Circuit Breakers     |                |     +-------+--------+             |             v        Service States             |             v      Recovery Verification             |             v        Benchmark Results \</pre>

### Main Backend Modules

| File                     | Responsibility                                                                     |
| ------------------------ | ---------------------------------------------------------------------------------- |
| `server/logic.ts`        | BFS-based failure cascade and impact analysis                                      |
| `server/sandbox.ts`      | Fault injection, sandbox simulation, traffic metrics and circuit breaker instances |
| `server/resilience.ts`   | Circuit breaker and bulkhead implementations                                       |
| `server/agents.ts`       | AI incident analysis agents                                                        |
| `server/verification.ts` | Recovery verification                                                              |

### Frontend

The frontend provides the interactive dashboard, service topology, simulation controls, sandbox controls, benchmark results, agent activity, and recovery recommendations.

---

## 6. Technology Stack

| Category            | Technologies                                           |
| ------------------- | ------------------------------------------------------ |
| Frontend            | React, TypeScript                                      |
| Build Tool          | Vite                                                   |
| Graph Visualization | React Flow (`@xyflow/react`)                           |
| Backend             | Node.js, Express                                       |
| Backend Language    | TypeScript                                             |
| Failure Analysis    | Breadth-First Search (BFS)                             |
| Resilience          | Circuit Breaker, Bulkhead                              |
| AI                  | Specialized incident analysis agents, offline fallback |
| Testing             | Jest                                                   |
| Deployment          | Vercel (optional)                                      |
| Version Control     | Git, GitHub                                            |

---

## 7. Screenshots

Add screenshots of the actual application in this section.

Recommended screenshots:

<img width="1530" height="713" alt="image" src="https://github.com/user-attachments/assets/dc6ecdb3-5d17-43c4-8a8d-fa30be90a2b6" />

<img width="1527" height="712" alt="image" src="https://github.com/user-attachments/assets/daf97eb1-1240-4d3e-bf0f-8fd37d91aea2" />
<img width="1533" height="730" alt="image" src="https://github.com/user-attachments/assets/ae5be695-70a3-4e2c-b761-de2d80fe742e" />
<img width="1517" height="731" alt="image" src="https://github.com/user-attachments/assets/b436cf50-3581-4786-a334-21d360eaf8c0" />
<img width="1517" height="710" alt="image" src="https://github.com/user-attachments/assets/a8969cdc-0651-4095-b4ee-3f539260c5e1" />

```markdown
![ChaosLab Dashboard](docs/screenshots/dashboard.png)

![Service Topology](docs/screenshots/topology.png)

![Failure Simulation](docs/screenshots/simulation.png)

![AI Agent Analysis](docs/screenshots/agents.png)

![Sandbox Lab](docs/screenshots/sandbox.png)

![Benchmark Results](docs/screenshots/benchmark.png)
```

---

## 8. Getting Started

Follow these steps to run ChaosLab locally.

### Prerequisites

- Node.js
- npm
- Git

### Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

```bash
cd ChaosLab
```

### Install dependencies

```bash
npm install
```

### Start the application

```bash
npm run dev
```

The development scripts start the backend and frontend using the project's configured development commands.

Open the frontend at the local address printed by Vite in your terminal.

The backend runs using the configured Express server command.

### Build for production

```bash
npm run build
```

### Run tests

```bash
npm test
```

---

## 9. Example Demo Walkthrough

Try the following workflow to explore ChaosLab.

### Scenario: Database Failure

**Step 1: Explore the architecture**

Open the dashboard and inspect the eight-service topology.

**Step 2: Select the database**

Choose the Database service from the Failure Simulation Panel.

**Step 3: Simulate a failure**

Select Service Unavailable and run the safe simulation.

Observe the predicted cascade and affected services.

**Step 4: Run the sandbox scenario**

Use the Database Down preset or inject a database fault in the Sandbox Lab.

**Step 5: Observe resilience behavior**

Inspect the service states and circuit breaker transitions.

**Step 6: Analyze the incident**

Review the Failure Analysis, Risk Evaluator, Recovery Planner, and Critic outputs.

**Step 7: Review recovery recommendations**

Inspect the recommended recovery actions and their priorities.

**Step 8: Verify recovery**

Approve and execute the Verified Recovery Check.

**Step 9: Evaluate the benchmark**

Run the benchmark suite and inspect the 12 scenario results.

This workflow demonstrates how ChaosLab connects failure simulation, cascade analysis, resilience mechanisms, and recovery verification.

---

## 10. Privacy, Safety and Limitations

### Controlled Simulation

ChaosLab is designed as a controlled sandbox for demonstrating microservice failure scenarios.

The Run Simulation option performs graph-based analysis, while Run for Real and Sandbox Lab operate against the application's simulated environment.

It is not intended to inject faults into real production infrastructure.

### AI API Dependency

AI-assisted analysis may depend on an external AI provider when configured.

Offline fallback is available for situations where the AI service is unavailable or slow.

### In-Memory State

The sandbox currently maintains important state in application memory, including:

- Service states.
- Active faults.
- Circuit breaker instances.
- Traffic metrics.

This is suitable for local demonstrations and single-process execution.

In a multi-instance serverless deployment, application memory is not shared between independent instances. State may therefore become inconsistent or reset between requests.

### Background Traffic Simulation

The sandbox uses background timers to generate simulated traffic.

Serverless platforms may freeze or terminate functions when idle. Continuous background traffic generation is therefore not guaranteed in a serverless deployment.

### Benchmark Limitations

The benchmark suite evaluates deterministic BFS cascade calculations against predefined scenarios.

It does not establish real-world production prediction accuracy or performance under actual infrastructure failures.

### Production Readiness

ChaosLab is an engineering demonstration and testing environment, not a production monitoring or orchestration platform.

---

## 11. Future Improvements

Potential future enhancements include:

- Persistent shared storage for sandbox state.
- Redis-based distributed circuit breaker state.
- Real-time service telemetry integration.
- Prometheus and Grafana monitoring.
- OpenTelemetry distributed tracing.
- More configurable failure scenarios.
- Additional benchmark scenarios.
- Historical incident analytics.
- Advanced recovery automation.
- Multi-instance simulation support.

These improvements would help extend ChaosLab toward a more production-oriented resilience engineering platform.

---

## 12. Repository Structure

The following is an illustrative structure. Update it to match the actual repository before submission.

```text
ChaosLab/
│
├── api/
│   └── index.ts
│
├── server/
│   ├── agents.ts
│   ├── app.ts
│   ├── logic.ts
│   ├── presets.json
│   ├── resilience.ts
│   ├── sandbox.ts
│   ├── topology.json
│   └── verification.ts
│
├── src/
│   └── client/
│       ├── App.tsx
│       ├── CustomEdge.tsx
│       ├── CustomNode.tsx
│       ├── RunHistoryPanel.tsx
│       ├── SandboxLab.tsx
│       ├── index.css
│       └── main.tsx
│
├── tests/
│   ├── agents.test.ts
│   ├── history.test.ts
│   ├── logic.test.ts
│   ├── topology.test.ts
│   └── verification.test.ts
│
├── .gitignore
├── index.html
├── jest.config.cjs
├── package.json
├── package-lock.json
├── README.md
├── tsconfig.json
├── vercel.json
└── vite.config.ts

---

## 13. AI Tools and Development Assistance

AI-assisted development tools may be used during implementation, debugging, code review, and documentation.

The project's core engineering components include:

- Deterministic BFS failure propagation.
- Circuit breaker resilience mechanisms.
- Sandbox fault injection.
- Incident analysis agents.
- Recovery verification.
- Automated benchmark tests.

AI assistance does not replace the deterministic algorithms or automated tests used to validate the platform.

Update this section to accurately disclose the tools actually used during development.

---

## 14. Project Goals

ChaosLab aims to make distributed-system failure behavior easier to understand and experiment with.

Its main goals are:

- Visualize microservice dependencies.
- Understand cascading failures.
- Simulate controlled service failures.
- Demonstrate resilience patterns.
- Assist incident analysis.
- Recommend recovery actions.
- Verify recovery outcomes.
- Evaluate deterministic failure propagation.

**ChaosLab brings chaos engineering, graph-based failure analysis, AI-assisted incident investigation, and resilience testing into one interactive platform.**

---

## Links

- **GitHub Repository:** https://github.com/LokeshBalaji-11/-ChaosLab
- **Live Demo:** YOUR_VERCEL_URL (optional)

