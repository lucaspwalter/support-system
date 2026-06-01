CREATE TYPE session_status AS ENUM ('WAITING', 'ACTIVE', 'CLOSED');

CREATE TABLE sessions (
    id UUID PRIMARY KEY,
    client_name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    status session_status NOT NULL,
    agent_id UUID NULL REFERENCES agents(id),
    started_at TIMESTAMP NOT NULL,
    closed_at TIMESTAMP NULL
);

CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_agent_id ON sessions(agent_id);
