"use client";

import Link from "next/link";
import { useState, useCallback, useEffect, use } from "react";
import decksData from "../../../../../data/decks.json";

type Pair = { id: string; front: string; back: string };

type Card = {
	id: string;
	pairId: string;
	text: string;
	side: "front" | "back";
};

type CardState = "facedown" | "flipped" | "matched";

function parsePairs(flatPairs: string[]): Pair[] {
	const pairs: Pair[] = [];
	for (let i = 0; i < flatPairs.length; i += 2) {
		pairs.push({ id: String(i / 2), front: flatPairs[i], back: flatPairs[i + 1] });
	}
	return pairs;
}

function seededRandom(seed: string): number {
	let h = 0;
	for (let i = 0; i < seed.length; i++) {
		h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
	}
	return ((h >>> 0) % 1000) / 1000;
}

function getCardTransform(cardId: string): { rotate: number; x: number; y: number } {
	const r1 = seededRandom(cardId + "r");
	const r2 = seededRandom(cardId + "x");
	const r3 = seededRandom(cardId + "y");
	return {
		rotate: (r1 - 0.5) * 6,  // -3 to +3 degrees
		x: (r2 - 0.5) * 6,       // -3 to +3 px
		y: (r3 - 0.5) * 6,       // -3 to +3 px
	};
}

function shuffle<T>(arr: T[]): T[] {
	const a = [...arr];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

function buildCards(pairs: Pair[]): Card[] {
	const cards: Card[] = [];
	for (const pair of pairs) {
		cards.push({ id: `${pair.id}-f`, pairId: pair.id, text: pair.front, side: "front" });
		cards.push({ id: `${pair.id}-b`, pairId: pair.id, text: pair.back, side: "back" });
	}
	return shuffle(cards);
}

// --- Mock players ---
const MOCK_PLAYERS = [
	{ id: "p1", name: "You" },
	{ id: "p2", name: "Hana" },
	{ id: "p3", name: "Kai" },
];

export default function GamePage({
	params,
}: {
	params: Promise<{ deck_id: string; game_id: string }>;
}) {
	const { deck_id } = use(params);

	const deck = decksData.decks.find((d) => d.deck_id === deck_id);
	const pairs = deck ? parsePairs(deck.pairs) : [];

	const [cards, setCards] = useState<Card[]>([]);
	const [cardStates, setCardStates] = useState<Record<string, CardState>>({});
	const [selected, setSelected] = useState<string[]>([]);
	const [scores, setScores] = useState<Record<string, number>>(() =>
		Object.fromEntries(MOCK_PLAYERS.map((p) => [p.id, 0]))
	);
	const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
	const [isLocked, setIsLocked] = useState(false);

	// Build and shuffle cards on mount (client only) to avoid hydration mismatch
	useEffect(() => {
		if (pairs.length === 0) return;
		const built = buildCards(pairs);
		setCards(built);
		setCardStates(Object.fromEntries(built.map((c) => [c.id, "facedown" as CardState])));
	}, [deck_id]); // eslint-disable-line react-hooks/exhaustive-deps

	const totalPairs = pairs.length;
	const matchedCount = Object.values(scores).reduce((a, b) => a + b, 0);
	const isComplete = matchedCount === totalPairs;
	const currentPlayer = MOCK_PLAYERS[currentPlayerIndex];

	const advanceTurn = useCallback(() => {
		setCurrentPlayerIndex((i) => (i + 1) % MOCK_PLAYERS.length);
	}, []);

	const handleCardClick = useCallback(
		(cardId: string) => {
			if (isLocked) return;
			if (cardStates[cardId] !== "facedown") return;
			if (selected.length >= 2) return;

			const newSelected = [...selected, cardId];
			setCardStates((prev) => ({ ...prev, [cardId]: "flipped" }));
			setSelected(newSelected);

			if (newSelected.length === 2) {
				const [firstId, secondId] = newSelected;
				const firstCard = cards.find((c) => c.id === firstId)!;
				const secondCard = cards.find((c) => c.id === secondId)!;

				if (firstCard.pairId === secondCard.pairId) {
					// Match — current player scores, keeps turn
					setTimeout(() => {
						setCardStates((prev) => ({
							...prev,
							[firstId]: "matched",
							[secondId]: "matched",
						}));
						setScores((prev) => ({
							...prev,
							[currentPlayer.id]: prev[currentPlayer.id] + 1,
						}));
						setSelected([]);
					}, 500);
				} else {
					// No match — flip back, next player's turn
					setIsLocked(true);
					setTimeout(() => {
						setCardStates((prev) => ({
							...prev,
							[firstId]: "facedown",
							[secondId]: "facedown",
						}));
						setSelected([]);
						setIsLocked(false);
						advanceTurn();
					}, 1000);
				}
			}
		},
		[cards, cardStates, selected, isLocked, currentPlayer, advanceTurn]
	);

	if (!deck) {
		return (
			<div className="min-h-screen flex flex-col items-center justify-center gap-4">
				<span className="font-body text-on-surface-variant">Deck not found</span>
				<Link href="/" className="font-body text-sm text-primary hover:text-primary/80">
					&larr; Back to Games
				</Link>
			</div>
		);
	}

	if (cards.length === 0) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<span className="font-body text-on-surface-variant">Loading...</span>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex flex-col">
			{/* Top bar — Glassmorphism */}
			<nav className="sticky top-0 z-50 bg-surface/70 backdrop-blur-[24px]">
				<div className="max-w-4xl mx-auto px-6 sm:px-10 py-4 flex items-center justify-between">
					<Link
						href="/"
						className="font-body text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
					>
						&larr; Back
					</Link>
					<span className="font-display text-base font-bold tracking-tight text-on-surface capitalize">
						{deck_id.replace(/-/g, " ")}
					</span>
					<div className="w-16" />
				</div>
			</nav>

			{/* Players bar */}
			<div className="max-w-4xl mx-auto w-full px-6 sm:px-10 pt-6 pb-2">
				<div className="flex items-center gap-3 sm:gap-4 flex-wrap">
					{MOCK_PLAYERS.map((player) => {
						const isActive = player.id === currentPlayer.id;
						return (
							<div
								key={player.id}
								className={`
									flex items-center gap-3 px-5 py-3 rounded-full transition-all duration-300
									ease-[cubic-bezier(0.34,1.56,0.64,1)]
									${isActive
										? "bg-primary-container scale-[1.03]"
										: "bg-surface-low"
									}
								`}
							>
								{isActive && (
									<span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
								)}
								<span
									className={`font-body text-sm font-semibold ${
										isActive ? "text-primary" : "text-on-surface-variant"
									}`}
								>
									{player.name}
								</span>
								<span
									className={`font-display text-lg font-bold ${
										isActive ? "text-on-surface" : "text-on-surface-variant"
									}`}
								>
									{scores[player.id]}
								</span>
							</div>
						);
					})}

					<div className="ml-auto text-xs font-medium text-on-surface-variant tracking-wide">
						{matchedCount} / {totalPairs} pairs
					</div>
				</div>

				{/* Progress bar */}
				<div className="mt-4 h-2 rounded-full bg-secondary-fixed-dim/40 overflow-hidden">
					<div
						className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
						style={{ width: `${(matchedCount / totalPairs) * 100}%` }}
					/>
				</div>
			</div>

			{/* Card grid */}
			<div className="flex-1 flex items-start justify-center px-6 sm:px-10 py-8">
				<div className="w-full max-w-4xl bg-surface-low rounded-[3rem] p-5 sm:p-8">
					<div className="grid grid-cols-4 gap-3 sm:gap-4">
						{cards.map((card) => {
							const state = cardStates[card.id];
							const t = getCardTransform(card.id);
							const isSettled = state !== "facedown";
							return (
								<button
									key={card.id}
									onClick={() => handleCardClick(card.id)}
									disabled={state !== "facedown"}
									style={{
										transform: isSettled
											? "rotate(0deg) translate(0px, 0px)"
											: `rotate(${t.rotate}deg) translate(${t.x}px, ${t.y}px)`,
									}}
									className={`
										relative aspect-[3/4] rounded-[2rem] transition-all duration-300
										ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer
										select-none overflow-hidden
										${
											state === "facedown"
												? "bg-primary-container hover:shadow-[0px_20px_40px_rgba(45,52,51,0.06)] hover:scale-[1.02]"
												: ""
										}
										${state === "flipped" ? "bg-white scale-[1.02] shadow-[0px_20px_40px_rgba(45,52,51,0.06)]" : ""}
										${state === "matched" ? "bg-white animate-[cardMatch_0.6s_ease-out]" : ""}
									`}
								>
									{state === "facedown" ? (
										<div className="absolute inset-0 flex items-center justify-center">
											<div className="w-8 h-8 rounded-full bg-primary/15" />
										</div>
									) : (
										<div className="absolute inset-0 flex items-center justify-center p-3">
											<span
												className={`font-body text-sm sm:text-lg font-semibold text-center leading-snug ${
													state === "matched"
														? "text-[#3d706a]"
														: "text-on-surface"
												}`}
											>
												{card.text}
											</span>
										</div>
									)}
								</button>
							);
						})}
					</div>
				</div>
			</div>

			{/* Completion overlay */}
			{isComplete && (() => {
				const maxScore = Math.max(...Object.values(scores));
				const winners = MOCK_PLAYERS.filter((p) => scores[p.id] === maxScore);
				const isTie = winners.length > 1;

				return (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-surface/70 backdrop-blur-[24px]">
						<div className="bg-surface-lowest rounded-[3rem] p-12 sm:p-16 max-w-md w-full mx-6 shadow-[0px_20px_40px_rgba(45,52,51,0.06)] text-center">
							<h2 className="font-display text-[2.5rem] sm:text-[3.5rem] font-extrabold text-on-surface leading-none">
								{isTie ? "Draw" : `${winners[0].name} Wins`}
							</h2>

							{/* Final scores */}
							<div className="mt-8 flex flex-col gap-2">
								{MOCK_PLAYERS
									.slice()
									.sort((a, b) => scores[b.id] - scores[a.id])
									.map((player, i) => (
										<div
											key={player.id}
											className={`flex items-center justify-between px-5 py-3 rounded-full ${
												i === 0 ? "bg-primary-container" : "bg-surface-low"
											}`}
										>
											<span
												className={`font-body text-sm font-semibold ${
													i === 0 ? "text-primary" : "text-on-surface-variant"
												}`}
											>
												{player.name}
											</span>
											<span
												className={`font-display text-lg font-bold ${
													i === 0 ? "text-on-surface" : "text-on-surface-variant"
												}`}
											>
												{scores[player.id]} pairs
											</span>
										</div>
									))}
							</div>

							<div className="mt-10 flex flex-col gap-3">
								<button
									onClick={() => window.location.reload()}
									className="inline-flex items-center justify-center h-12 px-8 rounded-full bg-gradient-to-br from-primary to-primary-container text-on-primary font-body text-sm font-semibold tracking-wide transition-all duration-200 hover:shadow-[0px_20px_40px_rgba(45,52,51,0.10)] hover:scale-[1.02] cursor-pointer"
								>
									Play Again
								</button>
								<Link
									href="/"
									className="inline-flex items-center justify-center h-12 px-8 rounded-full bg-transparent text-primary font-body text-sm font-semibold tracking-wide transition-colors hover:bg-surface-high cursor-pointer"
									style={{
										boxShadow: `inset 0 0 0 1.5px rgba(172, 179, 178, 0.15)`,
									}}
								>
									Back to Games
								</Link>
							</div>
						</div>
					</div>
				);
			})()}
		</div>
	);
}
