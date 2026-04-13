export { GameRoom } from "./game-room";

interface Env {
	GAME_ROOM: DurableObjectNamespace;
	[key: string]: unknown;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		// Route WebSocket upgrades to the Durable Object
		if (url.pathname.startsWith("/api/ws/") && request.headers.get("Upgrade") === "websocket") {
			const gameId = url.pathname.slice("/api/ws/".length);
			if (!gameId) {
				return new Response("Missing game ID", { status: 400 });
			}
			const id = env.GAME_ROOM.idFromName(gameId);
			const room = env.GAME_ROOM.get(id);
			return room.fetch(request);
		}

		// Delegate everything else to the OpenNext handler
		const { default: nextHandler } = await import("../.open-next/worker.js");
		return nextHandler.fetch(request, env, ctx);
	},
} satisfies ExportedHandler<Env>;
