import { Headset, MessageCircle } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 text-ink">
      <section className="w-full max-w-md rounded-2xl border border-line bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight">Support System</h1>
        <p className="mt-2 text-sm text-gray-500">Escolha a área para acessar o atendimento em tempo real.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link className="flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition hover:bg-blue-700" href="/client">
            <MessageCircle size={17} aria-hidden />
            Cliente
          </Link>
          <Link className="flex h-11 items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50" href="/agent">
            <Headset size={17} aria-hidden />
            Atendente
          </Link>
        </div>
      </section>
    </main>
  );
}
