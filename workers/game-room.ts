import { DurableObject } from "cloudflare:workers";

const GAME_MESSAGE_TYPES = [
	"player-joined",
	"card-flipped",
	"cards-matched",
	"cards-unmatched",
	"game-reset",
	"player-removed",
];

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

		// Broadcast game events to ALL connected clients (including sender)
		if (GAME_MESSAGE_TYPES.includes(data.type)) {
			for (const socket of this.ctx.getWebSockets()) {
				socket.send(raw);
			}
		}
	}

	async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {
		// Broadcast disconnect to remaining clients
		const msg = JSON.stringify({ type: "player-disconnected" });
		for (const socket of this.ctx.getWebSockets()) {
			if (socket !== ws) {
				socket.send(msg);
			}
		}
		ws.close(code, reason);
	}

	async webSocketError(ws: WebSocket): Promise<void> {
		ws.close(1011, "Unexpected error");
	}
}
