import { getSessionId } from "@/lib/session";

export default async function GameLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	// Middleware ensures the session cookie is set before this runs.
	// Expose the ID via a data attribute for client components.
	const sessionId = await getSessionId();

	return (
		<div data-session-id={sessionId ?? ""}>
			{children}
		</div>
	);
}
