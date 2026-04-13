import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/db";

export async function GET() {
	const supabase = getSupabase();
	const { data, error } = await supabase
		// @ts-ignore — memory_game schema is not in generated types
		.schema("memory_game")
		.from("decks")
		.select("deck_id, description, number_of_cards, pairs")
		.order("deck_id");

	if (error) {
		console.error("Failed to fetch decks:", error.message, error.code);
		return NextResponse.json({ error: "Failed to fetch decks" }, { status: 500 });
	}

	return NextResponse.json({ decks: data });
}
