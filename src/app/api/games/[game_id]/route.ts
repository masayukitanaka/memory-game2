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
