"use client";

import { Client } from "@stomp/stompjs";
import { FormEvent, useEffect, useRef, useState } from "react";
import { apiUrl, createStompClient, sendJson, subscribeJson } from "@/lib/websocket";

type SenderType = "CLIENT" | "AGENT";
type SessionStatus = "WAITING" | "ACTIVE" | "CLOSED";

type Session = {
  id: string;
  clientName: string;
  subject: string;
  status: SessionStatus;
  agentId: string | null;
};

type Message = {
  id?: string;
  sessionId: string;
  senderType: SenderType;
  content: string;
  sentAt?: string;
};

export default function ClientPage() {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const stompRef = useRef<Client | null>(null);

  useEffect(() => {
    return () => {
      stompRef.current?.deactivate();
    };
  }, []);

  async function openSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const response = await fetch(`${apiUrl}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientName: name, subject })
    });

    if (!response.ok) {
      setError("Não foi possível abrir o atendimento.");
      return;
    }

    const created = (await response.json()) as Session;
    setSession(created);

    const historyResponse = await fetch(`${apiUrl}/sessions/${created.id}/messages`);
    if (historyResponse.ok) {
      setMessages((await historyResponse.json()) as Message[]);
    }

    const client = createStompClient(() => {
      subscribeJson<Message | Session>(client, `/topic/session/${created.id}`, (payload) => {
        if ("content" in payload) {
          setMessages((current) => [...current, payload]);
        } else {
          setSession(payload);
        }
      });
    });
    stompRef.current = client;
  }

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || !content.trim() || !stompRef.current?.connected) {
      return;
    }
    sendJson(stompRef.current, "/app/chat.send", {
      sessionId: session.id,
      senderType: "CLIENT",
      content: content.trim()
    });
    setContent("");
  }

  function closeSession() {
    if (session && stompRef.current?.connected) {
      sendJson(stompRef.current, "/app/session.close", session.id);
    }
  }

  return (
    <main className="shell">
      <header className="page-header">
        <div>
          <h1>Cliente</h1>
          <p className="muted">Abra um atendimento e converse com um atendente em tempo real.</p>
        </div>
        {session && <span className={`status ${session.status.toLowerCase()}`}>{session.status}</span>}
      </header>

      <div className="grid">
        <section className="panel">
          <h2>Atendimento</h2>
          {!session ? (
            <form className="form" onSubmit={openSession}>
              <label>
                Nome
                <input value={name} onChange={(event) => setName(event.target.value)} required />
              </label>
              <label>
                Assunto
                <input value={subject} onChange={(event) => setSubject(event.target.value)} required />
              </label>
              {error && <p className="muted">{error}</p>}
              <button type="submit">Abrir sessão</button>
            </form>
          ) : (
            <div className="list">
              <p><strong>{session.clientName}</strong></p>
              <p className="muted">{session.subject}</p>
              <button className="danger" onClick={closeSession} disabled={session.status === "CLOSED"}>
                Encerrar
              </button>
            </div>
          )}
        </section>

        <section className="panel chat">
          <h2>Chat</h2>
          <div className="chat__messages">
            {messages.length === 0 ? (
              <div className="empty">Nenhuma mensagem enviada.</div>
            ) : (
              messages.map((message, index) => (
                <article className={`message ${message.senderType.toLowerCase()}`} key={message.id ?? index}>
                  <span className="message__meta">{message.senderType}</span>
                  <span>{message.content}</span>
                </article>
              ))
            )}
          </div>
          <form className="chat__actions" onSubmit={sendMessage}>
            <input
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Digite sua mensagem"
              disabled={!session || session.status === "CLOSED"}
            />
            <button type="submit" disabled={!session || session.status === "CLOSED"}>Enviar</button>
          </form>
        </section>
      </div>
    </main>
  );
}
