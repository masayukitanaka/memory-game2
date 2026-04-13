import { createClient } from "@supabase/supabase-js";

let client: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
	if (!client) {
		const url = process.env.SUPABASE_URL;
		const key = process.env.SUPABASE_ANON_KEY;
		if (!url || !key) {
			throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
		}
		client = createClient(url, key, {
			auth: { persistSession: false },
		});
	}
	return client;
}
