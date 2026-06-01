"use client";

import { Client, StompSubscription } from "@stomp/stompjs";
import { Archive, CheckCircle2, Clock3, MessageCircle, Send, Users, XCircle } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { apiUrl, createStompClient, sendJson, subscribeJson } from "@/lib/websocket";

type AgentStatus = "AVAILABLE" | "BUSY" | "AWAY";
type SenderType = "CLIENT" | "AGENT" | "SYSTEM";
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
  agentName?: string | null;
};

type Message = {
  id?: string;
  sessionId: string;
  senderType: SenderType;
  eventType?: "SESSION_CLOSED";
  content: string;
  sentAt?: string;
};

const agentStatusLabel: Record<AgentStatus, string> = {
  AVAILABLE: "Disponível",
  BUSY: "Ocupado",
  AWAY: "Ausente"
};

function AgentStatusBadge({ status }: { status: AgentStatus }) {
  const colors = {
    AVAILABLE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    BUSY: "bg-red-50 text-red-700 ring-red-200",
    AWAY: "bg-gray-100 text-gray-600 ring-gray-200"
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${colors[status]}`}>
      {agentStatusLabel[status]}
    </span>
  );
}

function isMessage(payload: Message | Session): payload is Message {
  return "content" in payload;
}

function waitTime(startedAt: string) {
  const diff = Math.max(0, Date.now() - new Date(startedAt).getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) {
    return "agora";
  }
  if (minutes === 1) {
    return "1 min";
  }
  return `${minutes} min`;
}

export default function AgentPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [closeError, setCloseError] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const stompRef = useRef<Client | null>(null);
  const activeSessionSubRef = useRef<StompSubscription | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedAgent = useMemo(
    () => agents.find((agent) => agent.id === selectedAgentId) ?? null,
    [agents, selectedAgentId]
  );

  const canSend = Boolean(activeSession && activeSession.status !== "CLOSED" && content.trim() && isConnected && stompRef.current?.connected);

  useEffect(() => {
    async function loadInitialData() {
      const [agentsResponse, queueResponse] = await Promise.all([
        fetch(`${apiUrl}/agents`),
        fetch(`${apiUrl}/queue`)
      ]);

      if (agentsResponse.ok) {
        const nextAgents = (await agentsResponse.json()) as Agent[];
        setAgents(nextAgents);
        setSelectedAgentId((current) => current || nextAgents.find((agent) => agent.status === "AVAILABLE")?.id || nextAgents[0]?.id || "");
      }
      if (queueResponse.ok) {
        setQueue((await queueResponse.json()) as QueueItem[]);
      }
    }

    loadInitialData();

    const client = createStompClient(() => {
      setIsConnected(true);
      subscribeJson<QueueItem[]>(client, "/topic/queue", setQueue);
      subscribeJson<Agent[]>(client, "/topic/agents", setAgents);
    });
    stompRef.current = client;

    return () => {
      clearCloseTimeout();
      activeSessionSubRef.current?.unsubscribe();
      setIsConnected(false);
      client.deactivate();
    };
  }, []);

  function clearCloseTimeout() {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }

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

  function subscribeToSession(sessionId: string) {
    if (!stompRef.current?.connected) {
      return;
    }

    activeSessionSubRef.current?.unsubscribe();
    activeSessionSubRef.current = subscribeJson<Message | Session>(stompRef.current, `/topic/session/${sessionId}`, (payload) => {
      if (isMessage(payload)) {
        if (payload.senderType === "SYSTEM" && payload.eventType === "SESSION_CLOSED") {
          clearActiveSession(activeSession?.agentId ?? selectedAgentId);
          return;
        }
        setMessages((current) => [...current, payload]);
        return;
      }

      if (payload.status === "CLOSED") {
        clearActiveSession(payload.agentId ?? selectedAgentId);
        return;
      }

      setActiveSession(payload);
    });
  }

  function markAgentAvailable(agentId: string) {
    setAgents((current) =>
      current.map((agent) => (agent.id === agentId ? { ...agent, status: "AVAILABLE" } : agent))
    );
  }

  function clearActiveSession(agentId?: string | null) {
    clearCloseTimeout();
    activeSessionSubRef.current?.unsubscribe();
    activeSessionSubRef.current = null;
    if (agentId) {
      markAgentAvailable(agentId);
      setSelectedAgentId(agentId);
    }
    setActiveSession(null);
    setMessages([]);
    setContent("");
    setIsClosing(false);
    setCloseError("");
  }

  async function acceptSession(sessionId: string) {
    if (!selectedAgentId) {
      return;
    }

    const response = await fetch(`${apiUrl}/queue/${sessionId}/accept`, {
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
    setContent("");
    setCloseError("");
    subscribeToSession(accepted.id);

    const historyResponse = await fetch(`${apiUrl}/sessions/${accepted.id}/messages`);
    if (historyResponse.ok) {
      setMessages((await historyResponse.json()) as Message[]);
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
    if (!activeSession || isClosing || !stompRef.current?.connected) {
      return;
    }

    setIsClosing(true);
    setCloseError("");
    clearCloseTimeout();
    closeTimeoutRef.current = setTimeout(() => {
      closeTimeoutRef.current = null;
      setIsClosing(false);
      setCloseError("Não foi possível confirmar o encerramento da sessão. Tente novamente.");
    }, 5000);
    sendJson(stompRef.current, "/app/session.close", activeSession.id);
  }

  return (
    <main className="min-h-screen bg-gray-50 text-ink">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[360px_1fr]">
        <aside className="border-r border-line bg-white">
          <div className="border-b border-line px-5 py-5">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
                <Users size={20} aria-hidden />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight">Painel do atendente</h1>
                <p className="text-sm text-gray-500">Fila e equipe em tempo real</p>
              </div>
            </div>

            <label className="block text-sm font-medium text-gray-700">
              Atendente ativo
              <select
                className="mt-2 h-11 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-blue-100"
                value={selectedAgentId}
                onChange={(event) => setSelectedAgentId(event.target.value)}
              >
                {agents.map((agent) => (
                  <option value={agent.id} key={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-3 flex gap-2">
              <button
                className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-xs font-semibold text-white transition hover:bg-blue-700"
                type="button"
                onClick={() => updateStatus("AVAILABLE")}
              >
                <CheckCircle2 size={15} aria-hidden />
                Disponível
              </button>
              <button
                className="inline-flex h-9 flex-1 items-center justify-center rounded-lg border border-line bg-white px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                type="button"
                onClick={() => updateStatus("AWAY")}
              >
                Ausente
              </button>
            </div>
            <Link
              className="mt-3 flex h-9 items-center justify-center gap-2 rounded-lg border border-line bg-white px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
              href="/history"
            >
              <Archive size={15} aria-hidden />
              Histórico
            </Link>
          </div>

          <div className="space-y-6 px-5 py-5">
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Fila</h2>
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">{queue.length}</span>
              </div>

              <div className="space-y-3">
                {queue.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-line bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                    Nenhuma sessão em espera.
                  </div>
                ) : (
                  queue.map((item) => (
                    <article className="rounded-xl border border-line bg-white p-4 shadow-sm" key={item.sessionId}>
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold">{item.clientName}</h3>
                          <p className="mt-1 line-clamp-2 text-sm text-gray-500">{item.subject}</p>
                        </div>
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                          <Clock3 size={13} aria-hidden />
                          {waitTime(item.startedAt)}
                        </span>
                      </div>
                      <button
                        className="mt-2 inline-flex h-9 w-full items-center justify-center rounded-lg bg-primary px-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        type="button"
                        onClick={() => acceptSession(item.sessionId)}
                        disabled={!selectedAgentId || selectedAgent?.status !== "AVAILABLE"}
                      >
                        Aceitar
                      </button>
                    </article>
                  ))
                )}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Atendentes</h2>
              <div className="space-y-2">
                {agents.map((agent) => (
                  <article className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3" key={agent.id}>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{agent.name}</p>
                      <p className="text-xs text-gray-500">{agent.id === selectedAgentId ? "Selecionado" : "Equipe"}</p>
                    </div>
                    <AgentStatusBadge status={agent.status} />
                  </article>
                ))}
              </div>
            </section>
          </div>
        </aside>

        <section className="flex min-h-screen flex-col bg-white">
          {activeSession ? (
            <>
              <header className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold">{activeSession.clientName}</h2>
                  <p className="truncate text-sm text-gray-500">{activeSession.subject}</p>
                </div>
                <button
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                  type="button"
                  onClick={closeSession}
                  disabled={activeSession.status === "CLOSED" || isClosing || !isConnected}
                >
                  <XCircle size={17} aria-hidden />
                  {isClosing ? "Encerrando..." : "Encerrar sessão"}
                </button>
              </header>
              {closeError && (
                <div className="border-b border-red-100 bg-red-50 px-6 py-3 text-sm font-medium text-red-700">
                  {closeError}
                </div>
              )}

              <div className="flex-1 overflow-y-auto bg-gray-50 px-6 py-6">
                <div className="mx-auto flex max-w-4xl flex-col gap-3">
                  {messages.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-line bg-white px-4 py-8 text-center text-sm text-gray-500">
                      Nenhuma mensagem enviada.
                    </div>
                  ) : (
                    messages.map((message, index) => {
                      const isAgent = message.senderType === "AGENT";
                      return (
                        <article className={`flex ${isAgent ? "justify-end" : "justify-start"}`} key={message.id ?? index}>
                          <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm shadow-sm ${isAgent ? "bg-primary text-white" : "border border-line bg-white text-ink"}`}>
                            <p className={`mb-1 text-xs font-medium ${isAgent ? "text-blue-100" : "text-gray-500"}`}>
                              {isAgent ? "Você" : "Cliente"}
                            </p>
                            <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </div>

              <form className="border-t border-line bg-white px-6 py-4" onSubmit={sendMessage}>
                <div className="mx-auto flex max-w-4xl gap-3">
                  <input
                    className="h-12 flex-1 rounded-xl border border-line bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-blue-100"
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    placeholder="Digite sua resposta"
                  />
                  <button
                    className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    type="submit"
                    disabled={!canSend}
                  >
                    <Send size={17} aria-hidden />
                    Enviar
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center bg-gray-50 px-6">
              <div className="max-w-sm rounded-2xl border border-line bg-white p-8 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-primary">
                  <MessageCircle size={24} aria-hidden />
                </div>
                <h2 className="text-lg font-semibold">Nenhuma sessão ativa</h2>
                <p className="mt-2 text-sm text-gray-500">Aceite uma sessão da fila para iniciar o atendimento.</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
