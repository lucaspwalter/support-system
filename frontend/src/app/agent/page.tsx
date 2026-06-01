"use client";

import { Client } from "@stomp/stompjs";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { apiUrl, createStompClient, sendJson, subscribeJson } from "@/lib/websocket";

type AgentStatus = "AVAILABLE" | "BUSY" | "AWAY";
type SenderType = "CLIENT" | "AGENT";
type SessionStatus = "WAITING" | "ACTIVE" | "CLOSED";

type Agent = {
  id: string;
  name: string;
  status: AgentStatus;
};

type QueueItem = {
  sessionId: string;
  clientName: string;
  subject: string;
  startedAt: string;
};

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

export default function AgentPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const stompRef = useRef<Client | null>(null);

  const selectedAgent = useMemo(
    () => agents.find((agent) => agent.id === selectedAgentId) ?? null,
    [agents, selectedAgentId]
  );

  useEffect(() => {
    async function loadInitialData() {
      const [agentsResponse, queueResponse] = await Promise.all([
        fetch(`${apiUrl}/agents`),
        fetch(`${apiUrl}/queue`)
      ]);

      if (agentsResponse.ok) {
        const nextAgents = (await agentsResponse.json()) as Agent[];
        setAgents(nextAgents);
        setSelectedAgentId((current) => current || nextAgents[0]?.id || "");
      }
      if (queueResponse.ok) {
        setQueue((await queueResponse.json()) as QueueItem[]);
      }
    }

    loadInitialData();

    const client = createStompClient(() => {
      subscribeJson<QueueItem[]>(client, "/topic/queue", setQueue);
      subscribeJson<Agent[]>(client, "/topic/agents", setAgents);
    });
    stompRef.current = client;

    return () => {
      client.deactivate();
    };
  }, []);

  async function updateStatus(status: AgentStatus) {
    if (!selectedAgentId) {
      return;
    }
    const response = await fetch(`${apiUrl}/agents/${selectedAgentId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    if (response.ok) {
      const updated = (await response.json()) as Agent;
      setAgents((current) => current.map((agent) => (agent.id === updated.id ? updated : agent)));
    }
  }

  async function acceptNext() {
    const nextSession = queue[0];
    if (!nextSession || !selectedAgentId) {
      return;
    }
    const response = await fetch(`${apiUrl}/queue/${nextSession.sessionId}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId: selectedAgentId })
    });
    if (!response.ok) {
      return;
    }
    const accepted = (await response.json()) as Session;
    setActiveSession(accepted);
    setMessages([]);

    const historyResponse = await fetch(`${apiUrl}/sessions/${accepted.id}/messages`);
    if (historyResponse.ok) {
      setMessages((await historyResponse.json()) as Message[]);
    }

    if (stompRef.current?.connected) {
      subscribeJson<Message | Session>(stompRef.current, `/topic/session/${accepted.id}`, (payload) => {
        if ("content" in payload) {
          setMessages((current) => [...current, payload]);
        } else {
          setActiveSession(payload);
        }
      });
    }
  }

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeSession || !content.trim() || !stompRef.current?.connected) {
      return;
    }
    sendJson(stompRef.current, "/app/chat.send", {
      sessionId: activeSession.id,
      senderType: "AGENT",
      content: content.trim()
    });
    setContent("");
  }

  function closeSession() {
    if (activeSession && stompRef.current?.connected) {
      sendJson(stompRef.current, "/app/session.close", activeSession.id);
    }
  }

  return (
    <main className="shell">
      <header className="page-header">
        <div>
          <h1>Atendente</h1>
          <p className="muted">Acompanhe a fila, aceite clientes e responda pelo chat.</p>
        </div>
        {selectedAgent && <span className={`status ${selectedAgent.status.toLowerCase()}`}>{selectedAgent.status}</span>}
      </header>

      <div className="grid">
        <aside className="panel">
          <h2>Equipe</h2>
          <div className="form">
            <label>
              Atendente
              <select value={selectedAgentId} onChange={(event) => setSelectedAgentId(event.target.value)}>
                {agents.map((agent) => (
                  <option value={agent.id} key={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="toolbar">
              <button type="button" onClick={() => updateStatus("AVAILABLE")}>Disponível</button>
              <button type="button" className="secondary" onClick={() => updateStatus("AWAY")}>Ausente</button>
            </div>
          </div>

          <h2>Fila</h2>
          <ul className="list">
            {queue.length === 0 ? (
              <li className="empty">Fila vazia.</li>
            ) : (
              queue.map((item) => (
                <li key={item.sessionId}>
                  <strong>{item.clientName}</strong>
                  <span className="muted">{item.subject}</span>
                </li>
              ))
            )}
          </ul>
          <button type="button" onClick={acceptNext} disabled={!queue.length || !selectedAgentId || selectedAgent?.status !== "AVAILABLE"}>
            Aceitar próximo
          </button>
        </aside>

        <section className="panel chat">
          <h2>{activeSession ? activeSession.clientName : "Chat ativo"}</h2>
          {activeSession && <p className="muted">{activeSession.subject}</p>}
          <div className="chat__messages">
            {messages.length === 0 ? (
              <div className="empty">Nenhum atendimento ativo.</div>
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
              placeholder="Digite sua resposta"
              disabled={!activeSession || activeSession.status === "CLOSED"}
            />
            <button type="submit" disabled={!activeSession || activeSession.status === "CLOSED"}>Enviar</button>
            <button type="button" className="danger" onClick={closeSession} disabled={!activeSession || activeSession.status === "CLOSED"}>
              Encerrar
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
