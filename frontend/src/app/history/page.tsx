"use client";

import { ChevronDown, ChevronRight, Clock, MessageSquareText } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiUrl } from "@/lib/websocket";

type Session = {
  id: string;
  clientName: string;
  subject: string;
  status: "WAITING" | "ACTIVE" | "CLOSED";
  agentId: string | null;
  agentName: string | null;
  startedAt: string;
  closedAt: string | null;
};

type Message = {
  id?: string;
  sessionId: string;
  senderType: "CLIENT" | "AGENT";
  content: string;
  sentAt?: string;
};

const badgeColors = [
  "bg-blue-50 text-blue-700 ring-blue-200",
  "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "bg-amber-50 text-amber-700 ring-amber-200",
  "bg-violet-50 text-violet-700 ring-violet-200",
  "bg-rose-50 text-rose-700 ring-rose-200"
];

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatTime(value?: string) {
  if (!value) {
    return "";
  }
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function duration(startedAt: string, closedAt?: string | null) {
  if (!closedAt) {
    return "-";
  }
  const diff = Math.max(0, new Date(closedAt).getTime() - new Date(startedAt).getTime());
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0) {
    return `${hours}h ${remainingMinutes}min`;
  }
  return `${Math.max(1, remainingMinutes)}min`;
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [messagesBySession, setMessagesBySession] = useState<Record<string, Message[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  const agentColor = useMemo(() => {
    const names = Array.from(new Set(sessions.map((session) => session.agentName ?? "Sem atendente")));
    return new Map(names.map((name, index) => [name, badgeColors[index % badgeColors.length]]));
  }, [sessions]);

  useEffect(() => {
    async function loadSessions() {
      setIsLoading(true);
      const response = await fetch(`${apiUrl}/sessions?status=CLOSED`);
      if (response.ok) {
        setSessions((await response.json()) as Session[]);
      }
      setIsLoading(false);
    }

    loadSessions();
  }, []);

  async function toggleSession(sessionId: string) {
    const nextExpandedId = expandedId === sessionId ? null : sessionId;
    setExpandedId(nextExpandedId);

    if (nextExpandedId && !messagesBySession[sessionId]) {
      const response = await fetch(`${apiUrl}/sessions/${sessionId}/messages`);
      if (response.ok) {
        const messages = (await response.json()) as Message[];
        setMessagesBySession((current) => ({ ...current, [sessionId]: messages }));
      }
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 text-ink">
      <section className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Histórico de atendimentos</h1>
            <p className="mt-1 text-sm text-gray-500">Sessões encerradas e mensagens registradas.</p>
          </div>
          <Link className="inline-flex h-10 items-center justify-center rounded-lg border border-line bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50" href="/agent">
            Voltar ao painel
          </Link>
        </header>

        <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
          {isLoading ? (
            <div className="px-5 py-12 text-center text-sm text-gray-500">Carregando histórico...</div>
          ) : sessions.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-gray-500">Nenhuma sessão encerrada.</div>
          ) : (
            <div className="divide-y divide-line">
              {sessions.map((session) => {
                const agentName = session.agentName ?? "Sem atendente";
                const messages = messagesBySession[session.id] ?? [];
                const isExpanded = expandedId === session.id;

                return (
                  <article key={session.id}>
                    <button
                      className="grid w-full gap-4 px-5 py-4 text-left transition hover:bg-gray-50 lg:grid-cols-[1.3fr_1fr_1fr_1fr_auto]"
                      type="button"
                      onClick={() => toggleSession(session.id)}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronDown size={17} aria-hidden /> : <ChevronRight size={17} aria-hidden />}
                          <h2 className="truncate text-sm font-semibold">{session.clientName}</h2>
                        </div>
                        <p className="mt-1 truncate pl-6 text-sm text-gray-500">{session.subject}</p>
                      </div>
                      <div>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${agentColor.get(agentName)}`}>
                          {agentName}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>{formatDate(session.startedAt)}</p>
                        <p className="mt-1 text-xs text-gray-400">Início</p>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>{formatDate(session.closedAt)}</p>
                        <p className="mt-1 text-xs text-gray-400">Encerramento</p>
                      </div>
                      <div className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Clock size={16} aria-hidden />
                        {duration(session.startedAt, session.closedAt)}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-line bg-gray-50 px-5 py-5">
                        {messages.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-line bg-white px-4 py-8 text-center text-sm text-gray-500">
                            Nenhuma mensagem registrada.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {messages.map((message, index) => (
                              <div className="rounded-xl border border-line bg-white p-4" key={message.id ?? index}>
                                <div className="mb-2 flex items-center justify-between gap-3 text-xs text-gray-500">
                                  <span className="inline-flex items-center gap-2 font-semibold">
                                    <MessageSquareText size={14} aria-hidden />
                                    {message.senderType === "CLIENT" ? "Cliente" : "Atendente"}
                                  </span>
                                  <span>{formatTime(message.sentAt)}</span>
                                </div>
                                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-800">{message.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
