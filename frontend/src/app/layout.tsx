import "./styles.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support System",
  description: "Real-time support system with WebSocket STOMP"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
