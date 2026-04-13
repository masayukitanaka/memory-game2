import { NextRequest, NextResponse } from "next/server";
import { getSessionId } from "@/lib/session";
import { getSupabase } from "@/lib/db";

type Player = {
	sessionId: string;
	playerName: string;
	score: number;
};

/**
 * POST /api/games/[game_id]/players — join a game
 * Body: { playerName: string }
 *
 * Adds the current session as a player if not already joined.
 * Returns the updated players list.
 */
export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ game_id: string }> },
) {
	const { game_id } = await params;
	const sessionId = await getSessionId();
	if (!sessionId) {
		return NextResponse.json({ error: "No session" }, { status: 401 });
	}

	const body = (await request.json()) as { playerName?: string };
	const playerName = body.playerName || "no name";

	const supabase = getSupabase();

	// Fetch current players
	const { data: game, error: fetchError } = await supabase
		// @ts-ignore — memory_game schema is not in generated types
		.schema("memory_game")
		.from("games")
		.select("players")
		.eq("id", game_id)
		.single();

	if (fetchError || !game) {
		console.error("Failed to fetch game:", fetchError?.message);
		return NextResponse.json({ error: "Game not found" }, { status: 404 });
	}

	const players = (game.players as Player[]) || [];

	// Check if already joined
	const existing = players.find((p) => p.sessionId === sessionId);
	if (existing) {
		// Update name if changed
		if (existing.playerName !== playerName) {
			existing.playerName = playerName;
			await supabase
				// @ts-ignore
				.schema("memory_game")
				.from("games")
				.update({ players, updated_at: new Date().toISOString() })
				.eq("id", game_id);
		}
		return NextResponse.json({ players, sessionId });
	}

	// Add new player
	players.push({ sessionId, playerName, score: 0 });

	const { error: updateError } = await supabase
		// @ts-ignore
		.schema("memory_game")
		.from("games")
		.update({ players, updated_at: new Date().toISOString() })
		.eq("id", game_id);

	if (updateError) {
		console.error("Failed to update players:", updateError.message);
		return NextResponse.json({ error: "Failed to join game" }, { status: 500 });
	}

	return NextResponse.json({ players, sessionId });
}
