import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/db";

export async function POST(request: NextRequest) {
	const body = (await request.json()) as { deck_id?: string };
	const deckId = body.deck_id;
	if (!deckId) {
		return NextResponse.json({ error: "deck_id is required" }, { status: 400 });
	}

	// Fetch deck from DB
	const supabase = getSupabase();
	const { data: deck, error: deckError } = await supabase
		// @ts-ignore — memory_game schema is not in generated types
		.schema("memory_game")
		.from("decks")
		.select("deck_id, pairs")
		.eq("deck_id", deckId)
		.single();

	if (deckError || !deck) {
		console.error("Failed to fetch deck:", deckError?.message);
		return NextResponse.json({ error: "Deck not found" }, { status: 404 });
	}

	// Build and shuffle cards
	const pairs = deck.pairs as string[];
	const cards: {
		id: number;
		content: string;
		pairId: number;
		side: "front" | "back";
		position: number;
		isMatched: boolean;
	}[] = [];

	for (let i = 0; i < pairs.length; i += 2) {
		const pairId = i / 2;
		cards.push({ id: cards.length, content: pairs[i], pairId, side: "front", position: 0, isMatched: false });
		cards.push({ id: cards.length, content: pairs[i + 1], pairId, side: "back", position: 0, isMatched: false });
	}

	// Shuffle
	for (let i = cards.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[cards[i], cards[j]] = [cards[j], cards[i]];
	}
	cards.forEach((card, idx) => { card.position = idx; });

	// Insert game
	const gameId = `game-${Date.now()}`;
	const { error: insertError } = await supabase
		// @ts-ignore — memory_game schema is not in generated types
		.schema("memory_game")
		.from("games")
		.insert({
			id: gameId,
			deck_id: deckId,
			cards,
			players: [],
			current_player_index: 0,
			status: "active",
		});

	if (insertError) {
		console.error("Failed to create game:", insertError.message, insertError.code);
		return NextResponse.json({ error: "Failed to create game" }, { status: 500 });
	}

	return NextResponse.json({ game_id: gameId, deck_id: deckId });
}
