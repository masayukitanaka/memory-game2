import { DurableObject } from "cloudflare:workers";

export class GameRoom extends DurableObject {
	async fetch(request: Request): Promise<Response> {
		if (request.headers.get("Upgrade") !== "websocket") {
			return new Response("Expected WebSocket upgrade", { status: 426 });
		}

		const pair = new WebSocketPair();
		const [client, server] = Object.values(pair);
		this.ctx.acceptWebSocket(server);

		return new Response(null, { status: 101, webSocket: client });
	}

	async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
		const raw = typeof message === "string" ? message : new TextDecoder().decode(message);
		let data: { type: string };
		try {
			data = JSON.parse(raw);
		} catch {
			return;
		}

		if (data.type === "test-win") {
			const broadcast = JSON.stringify({ type: "show-dialog" });
			for (const socket of this.ctx.getWebSockets()) {
				socket.send(broadcast);
			}
		}
	}

	async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {
		ws.close(code, reason);
	}

	async webSocketError(ws: WebSocket): Promise<void> {
		ws.close(1011, "Unexpected error");
	}
}
