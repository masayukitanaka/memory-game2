import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_MAX_AGE_SEC, generateSessionId } from "./lib/session";

export async function middleware(request: NextRequest) {
	const existingId = request.cookies.get(SESSION_COOKIE)?.value;

	// If we already have a session cookie, pass through
	if (existingId) {
		return NextResponse.next();
	}

	// Set a new session cookie (no DB — just a unique identifier)
	const id = generateSessionId();
	const response = NextResponse.next();
	response.cookies.set(SESSION_COOKIE, id, {
		httpOnly: true,
		secure: request.nextUrl.protocol === "https:",
		sameSite: "lax",
		path: "/",
		maxAge: SESSION_MAX_AGE_SEC,
	});

	return response;
}

export const config = {
	matcher: ["/play/:path*"],
};
