import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? "";

function sockJsUrl() {
  const baseUrl = (wsUrl || apiUrl)
    .replace(/^wss:\/\//, "https://")
    .replace(/^ws:\/\//, "http://");
  return `${baseUrl}/ws`;
}

export function createStompClient(onConnect?: () => void) {
  const client = new Client({
    webSocketFactory: () => new SockJS(sockJsUrl()),
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
  const isRawText = typeof payload === "string";
  client.publish({
    destination,
    headers: { "content-type": isRawText ? "text/plain" : "application/json" },
    body: isRawText ? payload : JSON.stringify(payload)
  });
}

export { apiUrl, wsUrl };
