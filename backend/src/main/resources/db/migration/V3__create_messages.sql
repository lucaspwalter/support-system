CREATE TYPE sender_type AS ENUM ('CLIENT', 'AGENT');

CREATE TABLE messages (
    id UUID PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES sessions(id),
    sender_type sender_type NOT NULL,
    content TEXT NOT NULL,
    sent_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_messages_session_id_sent_at ON messages(session_id, sent_at);
