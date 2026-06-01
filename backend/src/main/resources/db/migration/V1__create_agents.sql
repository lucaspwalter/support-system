CREATE TYPE agent_status AS ENUM ('AVAILABLE', 'BUSY', 'AWAY');

CREATE TABLE agents (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status agent_status NOT NULL,
    created_at TIMESTAMP NOT NULL
);
