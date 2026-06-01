import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export function createStompClient(onConnect?: () => void) {
  const client = new Client({
    webSocketFactory: () => new SockJS(`${apiUrl}/ws`),
    reconnectDelay: 3000,
    onConnect
  });

  client.activate();
  return client;
}

export function subscribeJson<T>(
  client: Client,
  destination: string,
  callback: (payload: T) => void
): StompSubscription {
  return client.subscribe(destination, (message: IMessage) => {
    callback(JSON.parse(message.body) as T);
  });
}

export function sendJson(client: Client, destination: string, payload: unknown) {
  client.publish({
    destination,
    headers: { "content-type": "application/json" },
    body: typeof payload === "string" ? payload : JSON.stringify(payload)
  });
}

export { apiUrl };
