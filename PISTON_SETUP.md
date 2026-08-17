# Self-Hosted Piston Code Compiler Setup Guide

This guide explains how to start and test the self-hosted Piston code compiler engine integrated into MentorHub.

---

## 1. Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
- Java 21+ and Maven.
- Node.js 18+ & Angular CLI.

---

## 2. Start Piston Service

Run the following command in the project root directory (`d:\ST PROJECT`):

```bash
docker-compose up -d
```

Verify Piston is running by checking runtimes:

```bash
curl http://localhost:2000/api/v2/runtimes
```

---

## 3. Spring Boot Configuration

Piston service connection properties in `backend/src/main/resources/application.yml`:

```yaml
piston:
  base-url: ${PISTON_BASE_URL:http://localhost:2000}
  execute-path: /api/v2/execute
  runtimes-path: /api/v2/runtimes
  connect-timeout: 5000
  read-timeout: 10000
  max-code-size: 65536
  max-input-size: 10240
  rate-limit-per-min: 20
```

---

## 4. Endpoints Provided by Spring Boot

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/compiler/runtimes` | Retrieves available language runtimes |
| `POST` | `/api/v1/compiler/execute` | Executes code in Piston sandbox with STDIN support |
| `GET` | `/api/v1/compiler/health` | Health check for Piston service connection |

---

## 5. Sample API Execution

```bash
curl -X POST http://localhost:8080/api/v1/compiler/execute \
  -H "Content-Type: application/json" \
  -d '{
    "language": "python",
    "version": "3.10.0",
    "code": "name = input()\nprint(\"Hello\", name)",
    "stdin": "Akshat"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "status": "SUCCESS",
  "language": "python",
  "version": "3.10.0",
  "stdout": "Hello Akshat\n",
  "stderr": "",
  "compileOutput": "",
  "exitCode": 0,
  "executionTime": 42
}
```
