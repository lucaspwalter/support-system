"use client";

import { Client, StompSubscription } from "@stomp/stompjs";
import { MessageCircle, Send, XCircle } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { apiUrl, createStompClient, sendJson, subscribeJson } from "@/lib/websocket";

type SenderType = "CLIENT" | "AGENT" | "SYSTEM";
type SessionStatus = "WAITING" | "ACTIVE" | "CLOSED";

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
  content: string;
  sentAt?: string;
};

type SessionEvent = {
  eventType: "SESSION_CLOSED";
};

const statusLabel: Record<SessionStatus, string> = {
  WAITING: "Aguardando",
  ACTIVE: "Em atendimento",
  CLOSED: "Encerrado"
};

function StatusBadge({ status }: { status: SessionStatus }) {
  const colors = {
    WAITING: "bg-amber-50 text-amber-700 ring-amber-200",
    ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    CLOSED: "bg-gray-100 text-gray-700 ring-gray-200"
  };

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${colors[status]}`}>
      {statusLabel[status]}
    </span>
  );
}

function isMessage(payload: Message | Session | SessionEvent): payload is Message {
  return "content" in payload;
}

function isSessionClosedEvent(payload: Message | Session | SessionEvent): payload is SessionEvent {
  return "eventType" in payload && payload.eventType === "SESSION_CLOSED";
}

export default function ClientPage() {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [closedNotice, setClosedNotice] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const stompRef = useRef<Client | null>(null);
  const sessionSubRef = useRef<StompSubscription | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeRequestedByClientRef = useRef(false);

  const canSend = useMemo(
    () => Boolean(session && session.status !== "CLOSED" && content.trim() && stompRef.current?.connected),
    [content, isConnected, session]
  );

  useEffect(() => {
    return () => {
      clearCloseTimeout();
      sessionSubRef.current?.unsubscribe();
      stompRef.current?.deactivate();
    };
  }, []);

  function clearCloseTimeout() {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }

  function handleSessionClosed(notice: string) {
    clearCloseTimeout();
    closeRequestedByClientRef.current = false;
    sessionSubRef.current?.unsubscribe();
    sessionSubRef.current = null;
    setSession((current) => (current ? { ...current, status: "CLOSED" } : current));
    setContent("");
    setIsClosing(false);
    setError("");
    setClosedNotice(notice);
  }

  function clearSessionState(notice?: string) {
    clearCloseTimeout();
    sessionSubRef.current?.unsubscribe();
    sessionSubRef.current = null;
    stompRef.current?.deactivate();
    stompRef.current = null;
    setIsConnected(false);
    setSession(null);
    setMessages([]);
    setContent("");
    setIsClosing(false);
    closeRequestedByClientRef.current = false;
    if (notice) {
      setClosedNotice(notice);
    }
  }

  function subscribeToSession(client: Client, sessionId: string) {
    if (!client.connected) {
      return;
    }

    sessionSubRef.current?.unsubscribe();
    sessionSubRef.current = subscribeJson<Message | Session | SessionEvent>(client, `/topic/session/${sessionId}`, (payload) => {
      if (isSessionClosedEvent(payload)) {
        handleSessionClosed(closeRequestedByClientRef.current ? "Atendimento encerrado." : "Atendimento encerrado pelo suporte.");
        return;
      }

      if (isMessage(payload)) {
        setMessages((current) => [...current, payload]);
        return;
      }

      if (payload.status === "CLOSED") {
        handleSessionClosed(closeRequestedByClientRef.current ? "Atendimento encerrado." : "Atendimento encerrado pelo suporte.");
        return;
      }

      setSession(payload);
    });
  }

  async function openSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setClosedNotice("");

    const response = await fetch(`${apiUrl}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientName: name, subject })
    });

    if (!response.ok) {
      setError("Não foi possível iniciar o atendimento.");
      return;
    }

    const created = (await response.json()) as Session;
    setSession(created);
    setMessages([]);

    const historyResponse = await fetch(`${apiUrl}/sessions/${created.id}/messages`);
    if (historyResponse.ok) {
      setMessages((await historyResponse.json()) as Message[]);
    }

    stompRef.current?.deactivate();
    setIsConnected(false);
    const client = createStompClient(() => {
      setIsConnected(true);
      subscribeToSession(client, created.id);
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
    if (!session || isClosing || !stompRef.current?.connected) {
      return;
    }

    setIsClosing(true);
    setClosedNotice("");
    closeRequestedByClientRef.current = true;
    subscribeToSession(stompRef.current, session.id);
    clearCloseTimeout();
    closeTimeoutRef.current = setTimeout(() => {
      closeTimeoutRef.current = null;
      closeRequestedByClientRef.current = false;
      setIsClosing(false);
      setError("Não foi possível confirmar o encerramento do atendimento. Tente novamente.");
    }, 5000);
    sendJson(stompRef.current, "/app/session.close", session.id);
  }

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10 text-ink">
        <section className="w-full max-w-md rounded-2xl border border-line bg-white p-8 shadow-sm">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white">
              <MessageCircle size={22} aria-hidden />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Support System</h1>
              <p className="text-sm text-gray-500">Atendimento ao vivo</p>
            </div>
          </div>

          <form className="space-y-4" onSubmit={openSession}>
            <label className="block text-sm font-medium text-gray-700">
              Nome
              <input
                className="mt-2 h-11 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-blue-100"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Assunto
              <input
                className="mt-2 h-11 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-blue-100"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                required
              />
            </label>
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            {closedNotice && <p className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700">{closedNotice}</p>}
            <button className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition hover:bg-blue-700" type="submit">
              <MessageCircle size={17} aria-hidden />
              Iniciar atendimento
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-gray-50 text-ink">
      <section className="mx-auto flex h-screen w-full max-w-5xl flex-col border-x border-line bg-white">
        <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <h1 className="truncate text-base font-semibold">{session.subject}</h1>
              <StatusBadge status={session.status} />
            </div>
            <p className="text-sm text-gray-500">{session.clientName}</p>
          </div>
          {session.status !== "CLOSED" && (
            <button
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              onClick={closeSession}
              disabled={isClosing || !isConnected}
            >
              <XCircle size={17} aria-hidden />
              {isClosing ? "Encerrando..." : "Encerrar atendimento"}
            </button>
          )}
        </header>
        {closedNotice && (
          <div className="border-b border-blue-100 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700">
            {closedNotice}
          </div>
        )}
        {error && (
          <div className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto bg-gray-50 px-5 py-6">
          <div className="mx-auto flex max-w-3xl flex-col gap-3">
            {messages.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line bg-white px-4 py-8 text-center text-sm text-gray-500">
                Nenhuma mensagem enviada.
              </div>
            ) : (
              messages.map((message, index) => {
                if (message.senderType === "SYSTEM") {
                  return (
                    <article className="flex justify-center" key={message.id ?? index}>
                      <div className="rounded-full bg-gray-200 px-4 py-2 text-xs font-semibold text-gray-700">
                        {message.content}
                      </div>
                    </article>
                  );
                }

                const isClient = message.senderType === "CLIENT";
                return (
                  <article className={`flex ${isClient ? "justify-end" : "justify-start"}`} key={message.id ?? index}>
                    <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm shadow-sm ${isClient ? "bg-primary text-white" : "border border-line bg-white text-ink"}`}>
                      <p className={`mb-1 text-xs font-medium ${isClient ? "text-blue-100" : "text-gray-500"}`}>
                        {isClient ? "Você" : "Atendente"}
                      </p>
                      <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>

        <form className="border-t border-line bg-white px-5 py-4" onSubmit={sendMessage}>
          <div className="mx-auto flex max-w-3xl gap-3">
            <input
              className="h-12 flex-1 rounded-xl border border-line bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-blue-100"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Digite sua mensagem"
              disabled={session.status === "CLOSED"}
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
      </section>
    </main>
  );
}
