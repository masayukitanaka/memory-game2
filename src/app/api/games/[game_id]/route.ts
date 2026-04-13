import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/db";

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ game_id: string }> },
) {
	const { game_id } = await params;
	const supabase = getSupabase();

	const { data: game, error } = await supabase
		// @ts-ignore — memory_game schema is not in generated types
		.schema("memory_game")
		.from("games")
		.select("id, deck_id, cards, players, current_player_index, status")
		.eq("id", game_id)
		.single();

	if (error || !game) {
		return NextResponse.json({ error: "Game not found" }, { status: 404 });
	}

	return NextResponse.json(game);
}

type PatchBody = {
	matchedCardIds?: number[];
	scorerSessionId?: string;
	currentPlayerIndex?: number;
};

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ game_id: string }> },
) {
	const { game_id } = await params;
	const body = (await request.json()) as PatchBody;
	const supabase = getSupabase();

	// Fetch current game
	const { data: game, error: fetchError } = await supabase
		// @ts-ignore
		.schema("memory_game")
		.from("games")
		.select("cards, players, current_player_index")
		.eq("id", game_id)
		.single();

	if (fetchError || !game) {
		return NextResponse.json({ error: "Game not found" }, { status: 404 });
	}

	type DbCard = { id: number; isMatched: boolean; [key: string]: unknown };
	type DbPlayer = { sessionId: string; score: number; [key: string]: unknown };

	const cards = game.cards as DbCard[];
	const players = game.players as DbPlayer[];
	let currentPlayerIndex = game.current_player_index as number;

	// Mark matched cards
	if (body.matchedCardIds) {
		for (const card of cards) {
			if (body.matchedCardIds.includes(card.id)) {
				card.isMatched = true;
			}
		}
	}

	// Update scorer's score
	if (body.scorerSessionId) {
		const scorer = players.find((p) => p.sessionId === body.scorerSessionId);
		if (scorer) {
			scorer.score += 1;
		}
	}

	// Update current player index
	if (body.currentPlayerIndex !== undefined) {
		currentPlayerIndex = body.currentPlayerIndex;
	}

	// Check if game is complete
	const allMatched = cards.every((c) => c.isMatched);
	const status = allMatched ? "completed" : "active";

	const { error: updateError } = await supabase
		// @ts-ignore
		.schema("memory_game")
		.from("games")
		.update({
			cards,
			players,
			current_player_index: currentPlayerIndex,
			status,
			updated_at: new Date().toISOString(),
		})
		.eq("id", game_id);

	if (updateError) {
		console.error("Failed to update game:", updateError.message);
		return NextResponse.json({ error: "Failed to update game" }, { status: 500 });
	}

	return NextResponse.json({ ok: true });
}
