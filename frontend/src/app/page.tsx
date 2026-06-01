import Link from "next/link";

export default function Home() {
  return (
    <main className="shell home">
      <section className="home__panel">
        <h1>Support System</h1>
        <div className="home__actions">
          <Link href="/client">Cliente</Link>
          <Link href="/agent">Atendente</Link>
        </div>
      </section>
    </main>
  );
}
