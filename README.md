# Support System

## What it is

Real-time support requires organizing customers, agents, queues, and message history without relying on scattered conversations or manual tracking. When several sessions happen at once, it becomes easy to lose track of who is waiting, which agent is available, and which messages have already been sent.

Support System centralizes this workflow. It lets users open support sessions, queue customers, assign sessions to available agents, persist messages, and update screens in real time via WebSocket.

## Portfolio

This project is part of my portfolio:

https://lucaspwalter.github.io/portfolio/

## How it works

- A customer opens a session with their name and topic
- Sessions enter the queue with waiting status
- An agent accepts the next available session
- Messages are stored in the database and transmitted in real time
- Closing a session makes the agent available again
- Queue, session, and agent changes are reflected in the interface
- The web interface provides separate customer, agent, and history views

## HTTP API

- Creates, retrieves, lists, and closes support sessions
- Lists message history by session
- Registers agents and updates their status
- Displays the pending session queue
- Allows agents to accept the next support session

## WebSocket

- SockJS endpoint at `/ws`
- Application prefix at `/app`
- Event broker at `/topic`
- Real-time message delivery by session
- Queue, session, and agent updates for connected screens

## Technologies

- Java 21
- Spring Boot
- Spring Web
- Spring WebSocket with STOMP and SockJS
- Spring Data JPA
- Flyway
- PostgreSQL
- Next.js
- TypeScript
- React
- Tailwind CSS

## Running locally

With Docker installed:

```bash
git clone https://github.com/lucaspwalter/support-system.git
cd support-system
docker compose up --build
```

Open `http://localhost:3000/client`. The database, backend, and frontend start automatically.

Manual instructions are also available on the project's portfolio page:

https://lucaspwalter.github.io/portfolio/

## Project structure

```text
support-system/
├── backend/
│   ├── src/
│   │   └── main/
│   │       ├── java/
│   │       │   └── com/
│   │       │       └── lucaspwalter/
│   │       │           └── support/
│   │       │               ├── config/
│   │       │               ├── controller/
│   │       │               ├── dto/
│   │       │               ├── model/
│   │       │               ├── repository/
│   │       │               ├── service/
│   │       │               └── SupportApplication.java
│   │       └── resources/
│   │           ├── db/
│   │           │   ├── migration/
│   │           │   └── seed/
│   │           └── application.properties
│   ├── Dockerfile
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── agent/
│   │   │   ├── client/
│   │   │   ├── history/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── styles.css
│   │   └── lib/
│   │       └── websocket.ts
│   ├── next-env.d.ts
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.ts
│   └── tsconfig.json
├── docker-compose.yml
└── README.md
```
