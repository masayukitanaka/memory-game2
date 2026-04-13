import { cookies } from "next/headers";

export const SESSION_COOKIE = "session_id";
export const SESSION_DATA_COOKIE = "session_data";
export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 days

export type SessionData = Record<string, unknown>;

export function generateSessionId(): string {
	const bytes = new Uint8Array(12);
	crypto.getRandomValues(bytes);
	const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
	return `sess_${Date.now()}_${hex}`;
}

/**
 * Read the session ID from the cookie.
 */
export async function getSessionId(): Promise<string | null> {
	const cookieStore = await cookies();
	return cookieStore.get(SESSION_COOKIE)?.value ?? null;
}

/**
 * Read session data from the cookie.
 */
export async function getSessionData(): Promise<SessionData> {
	const cookieStore = await cookies();
	const raw = cookieStore.get(SESSION_DATA_COOKIE)?.value;
	if (!raw) return {};
	try {
		return JSON.parse(raw) as SessionData;
	} catch {
		return {};
	}
}
