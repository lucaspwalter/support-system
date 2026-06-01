# support-system

Sistema de suporte ao vivo com fila de atendimento, atendentes, sessões de chat e mensagens em tempo real via WebSocket STOMP.

## Stack

- Java 21
- Spring Boot 3
- Spring WebSocket com STOMP e SockJS
- Spring Data JPA
- Flyway
- PostgreSQL
- Next.js 14
- TypeScript

## Funcionalidades

- Cliente abre uma sessão informando nome e assunto.
- Sessões aguardam na fila com status `WAITING`.
- Atendente aceita a próxima sessão e fica com status `BUSY`.
- Mensagens são persistidas e transmitidas em tempo real por sessão.
- Encerramento muda a sessão para `CLOSED` e libera o atendente.
- Alterações de fila e status de atendentes são transmitidas por WebSocket.

## Como rodar com Docker Compose

```bash
docker compose up --build
```

Backend:

```text
http://localhost:8080
```

Para rodar o frontend em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:3000/client
http://localhost:3000/agent
```

## Como rodar localmente sem Docker

Suba um PostgreSQL local com:

```text
database: support
user: support
password: support
port: 5435
```

Configure as variáveis:

```bash
export DATABASE_URL=jdbc:postgresql://localhost:5435/support
export DATABASE_USER=support
export DATABASE_PASSWORD=support
```

Rode o backend:

```bash
cd backend
mvn spring-boot:run
```

Rode o frontend:

```bash
cd frontend
npm install
npm run dev
```

## Endpoints

```text
POST   /sessions
GET    /sessions/{id}
GET    /sessions/{id}/messages

POST   /agents
PATCH  /agents/{id}/status
GET    /agents

GET    /queue
POST   /queue/{sessionId}/accept
```

## WebSocket

```text
Endpoint SockJS: /ws
Application prefix: /app
Broker prefix: /topic

/app/chat.send
/app/session.close

/topic/queue
/topic/session/{id}
/topic/agents
```
