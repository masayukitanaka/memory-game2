import { NextRequest, NextResponse } from "next/server";
import {
	getSessionId,
	getSessionData,
	SESSION_DATA_COOKIE,
	SESSION_MAX_AGE_SEC,
} from "@/lib/session";
import { getSupabase } from "@/lib/db";

export async function GET() {
	const sessionId = await getSessionId();
	if (!sessionId) {
		return NextResponse.json({ error: "No session" }, { status: 401 });
	}

	// Try loading from DB first, fall back to cookie
	const supabase = getSupabase();
	const { data: row } = await supabase
		// @ts-ignore — memory_game schema is not in generated types
		.schema("memory_game")
		.from("sessions")
		.select("data")
		.eq("id", sessionId)
		.single();

	const data = (row?.data as Record<string, unknown>) ?? (await getSessionData());
	return NextResponse.json({ sessionId, data });
}

export async function PATCH(request: NextRequest) {
	const sessionId = await getSessionId();
	if (!sessionId) {
		return NextResponse.json({ error: "No session" }, { status: 401 });
	}

	const body = (await request.json()) as Record<string, unknown>;
	const current = await getSessionData();
	const merged = { ...current, ...body };

	// Save to cookie
	const response = NextResponse.json({ data: merged });
	response.cookies.set(SESSION_DATA_COOKIE, JSON.stringify(merged), {
		httpOnly: true,
		secure: request.nextUrl.protocol === "https:",
		sameSite: "lax",
		path: "/",
		maxAge: SESSION_MAX_AGE_SEC,
	});

	// Save to DB (upsert)
	const supabase = getSupabase();
	const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SEC * 1000).toISOString();
	const { error: dbError } = await supabase
		// @ts-ignore — memory_game schema is not in generated types
		.schema("memory_game")
		.from("sessions")
		.upsert({
			id: sessionId,
			data: merged,
			expires_at: expiresAt,
			updated_at: new Date().toISOString(),
		});
	if (dbError) {
		console.error("Session DB upsert failed:", dbError.message, dbError.code);
	}

	return response;
}
