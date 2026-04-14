"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

type Deck = {
	deck_id: string;
	title: string;
	description: string;
	number_of_cards: number;
	pairs: string[];
};

const ACCENT_COLORS = [
	"from-primary to-primary-container",
	"from-[#4a7a6d] to-[#b8e8d4]",
	"from-[#5b7a6e] to-[#c2e8da]",
	"from-[#3d706a] to-[#b0e0d6]",
	"from-[#2d5c56] to-[#a8d8ce]",
	"from-[#3b6761] to-[#bdece5]",
];

export default function Home() {
	const router = useRouter();
	const [decks, setDecks] = useState<Deck[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);

	useEffect(() => {
		fetch("/api/decks")
			.then((res) => (res.ok ? res.json() : null))
			.then((raw) => {
				const json = raw as { decks?: Deck[] } | null;
				if (json?.decks) setDecks(json.decks);
			})
			.catch(() => {})
			.finally(() => setLoading(false));
	}, []);

	const [creating, setCreating] = useState(false);

	const handleConfirm = useCallback(async () => {
		if (!selectedDeck || creating) return;
		setCreating(true);
		try {
			const res = await fetch("/api/games", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ deck_id: selectedDeck.deck_id }),
			});
			const data = (await res.json()) as { game_id?: string; deck_id?: string };
			if (res.ok && data.game_id) {
				setSelectedDeck(null);
				router.push(`/play/${data.deck_id}/${data.game_id}`);
			}
		} catch {
			// network error — stay on dialog
		} finally {
			setCreating(false);
		}
	}, [selectedDeck, creating, router]);

	return (
		<div className="min-h-screen">
			{/* Navigation - Glassmorphism */}
			<nav className="sticky top-0 z-50 bg-surface/70 backdrop-blur-[24px]">
				<div className="max-w-6xl mx-auto px-6 sm:px-10 py-5 flex items-center gap-3">
					<Image src="/logo.png" alt="Memory Game" width={36} height={36} />
					<span className="font-display text-xl font-bold tracking-tight text-on-surface">
						Memory Game
					</span>
				</div>
			</nav>

			{/* Hero Section */}
			<section className="pt-20 pb-10 sm:pt-28 sm:pb-14 px-6 sm:px-10">
				<div className="max-w-6xl mx-auto">
					<div className="max-w-2xl">
						<h1 className="font-display text-[clamp(2.2rem,5vw,3.5rem)] font-extrabold leading-[1.1] tracking-tight text-on-surface">
							Flip, match,
							<br />
							remember.
						</h1>
						<p className="mt-6 text-lg sm:text-xl leading-relaxed text-on-surface-variant max-w-lg">
							Build your vocabulary through the calm ritual of a memory card game.
							At your own pace, one pair at a time.
						</p>
					</div>
				</div>
			</section>

			{/* Deck Cards Section */}
			<section className="px-6 sm:px-10 pb-24">
				<div className="max-w-6xl mx-auto">
					<h2 className="font-display text-sm font-semibold tracking-widest uppercase text-on-surface-variant mb-10">
						Games
					</h2>

					{loading ? (
						<p className="font-body text-on-surface-variant">Loading...</p>
					) : decks.length === 0 ? (
						<p className="font-body text-on-surface-variant">No decks available.</p>
					) : (
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
							{decks.map((deck, i) => {
								const accent = ACCENT_COLORS[i % ACCENT_COLORS.length];
								const title = deck.title;
								const pairCount = deck.number_of_cards / 2;

								return (
									<button
										key={deck.deck_id}
										onClick={() => setSelectedDeck(deck)}
										className="group block text-left cursor-pointer"
									>
										<article className="relative bg-surface-lowest rounded-[2rem] p-8 pt-10 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:shadow-[0px_20px_40px_rgba(45,52,51,0.06)] hover:scale-[1.02]">
											{/* Accent gradient strip */}
											<div
												className={`h-1.5 w-16 rounded-full bg-gradient-to-r ${accent} mb-7 transition-all duration-300 group-hover:w-24`}
											/>

											<h3 className="font-display text-xl font-bold text-on-surface leading-snug mb-4 capitalize">
												{title}
											</h3>

											<p className="text-sm leading-relaxed text-on-surface-variant mb-8">
												{deck.description}
											</p>

											<div className="flex items-center justify-between">
												<span className="text-xs font-medium text-on-surface-variant tracking-wide">
													{pairCount} pairs
												</span>
												<span className="text-xs font-semibold text-primary opacity-0 translate-x-[-4px] transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0">
													Play →
												</span>
											</div>
										</article>
									</button>
								);
							})}
						</div>
					)}
				</div>
			</section>

			{/* Confirmation dialog */}
			{selectedDeck && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-surface/70 backdrop-blur-[24px]">
					<div className="bg-surface-lowest rounded-[3rem] p-12 sm:p-16 max-w-sm w-full mx-6 shadow-[0px_20px_40px_rgba(45,52,51,0.06)] text-center">
						<h2 className="font-display text-2xl sm:text-3xl font-extrabold text-on-surface capitalize">
							{selectedDeck.title}
						</h2>
						<p className="mt-4 font-body text-sm text-on-surface-variant">
							{selectedDeck.description}
						</p>
						<p className="mt-2 font-body text-xs text-on-surface-variant">
							{selectedDeck.number_of_cards / 2} pairs &middot; {selectedDeck.number_of_cards} cards
						</p>
						<div className="mt-10 flex flex-col gap-3">
							<button
								onClick={handleConfirm}
								disabled={creating}
								className="inline-flex items-center justify-center h-12 px-8 rounded-full bg-gradient-to-br from-primary to-primary-container text-on-primary font-body text-sm font-semibold tracking-wide transition-all duration-200 hover:shadow-[0px_20px_40px_rgba(45,52,51,0.10)] hover:scale-[1.02] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{creating ? "Creating..." : "Start Game"}
							</button>
							<button
								onClick={() => setSelectedDeck(null)}
								className="inline-flex items-center justify-center h-12 px-8 rounded-full bg-transparent text-primary font-body text-sm font-semibold tracking-wide transition-colors hover:bg-surface-high cursor-pointer"
								style={{
									boxShadow: "inset 0 0 0 1.5px rgba(172, 179, 178, 0.15)",
								}}
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
