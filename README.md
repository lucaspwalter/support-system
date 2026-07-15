# Support System

## O que é

Atendimentos de suporte em tempo real precisam organizar clientes, atendentes, fila e histórico de mensagens sem depender de conversas soltas ou controles manuais. Quando várias sessões acontecem ao mesmo tempo, fica fácil perder quem está aguardando, qual atendente está disponível e quais mensagens já foram enviadas.

Support System centraliza esse fluxo. O projeto permite abrir sessões de atendimento, manter clientes em fila, distribuir atendimentos para agentes disponíveis, persistir mensagens e atualizar telas em tempo real via WebSocket.

## Portfólio

Este projeto faz parte do meu portfólio:

https://lucaspwalter.github.io/portfolio/

## Como funciona

- Cliente abre uma sessão informando nome e assunto
- Sessões entram na fila com status de espera
- Atendente aceita a próxima sessão disponível
- Mensagens são salvas no banco de dados e transmitidas em tempo real
- Encerramento da sessão libera o atendente
- Alterações de fila, sessões e atendentes são refletidas na interface
- Interface web separa acesso de cliente, atendente e histórico

## API HTTP

- Cria, consulta, lista e encerra sessões de atendimento
- Lista histórico de mensagens por sessão
- Cadastra atendentes e atualiza status
- Exibe fila de sessões pendentes
- Permite aceitar a próxima sessão de atendimento

## WebSocket

- Endpoint SockJS em `/ws`
- Prefixo de aplicação em `/app`
- Broker de eventos em `/topic`
- Envio de mensagens por sessão em tempo real
- Atualização de fila, sessões e atendentes para as telas conectadas

## Tecnologias

- Java 21
- Spring Boot
- Spring Web
- Spring WebSocket com STOMP e SockJS
- Spring Data JPA
- Flyway
- PostgreSQL
- Next.js
- TypeScript
- React
- Tailwind CSS

## Como rodar localmente

Com Docker instalado:

```bash
git clone https://github.com/lucaspwalter/support-system.git
cd support-system
docker compose up --build
```

Acesse `http://localhost:3000/client`. O banco, backend e frontend são iniciados automaticamente.

Instruções manuais também estão disponíveis na página do projeto no portfólio:

https://lucaspwalter.github.io/portfolio/

## Estrutura do projeto

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
