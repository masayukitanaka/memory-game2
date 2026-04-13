"use client";

import Link from "next/link";
import { useState, useCallback, useEffect, useRef, use } from "react";

type Card = {
	id: string;
	pairId: string;
	text: string;
	side: "front" | "back";
};

// DB card structure from games.cards
type DbCard = {
	id: number;
	content: string;
	pairId: number;
	side: "front" | "back";
	position: number;
	isMatched: boolean;
};

type CardState = "facedown" | "flipped" | "matched";

type Player = {
	sessionId: string;
	playerName: string;
	score: number;
};

// --- WebSocket message types ---
type WsPlayerJoined = { type: "player-joined"; player: Player };
type WsCardFlipped = { type: "card-flipped"; cardId: string; sessionId: string };
type WsCardsMatched = { type: "cards-matched"; cardIds: [string, string]; scorerSessionId: string };
type WsCardsUnmatched = { type: "cards-unmatched"; cardIds: [string, string]; nextPlayerIndex: number };
type WsPlayerDisconnected = { type: "player-disconnected" };
type WsMessage = WsPlayerJoined | WsCardFlipped | WsCardsMatched | WsCardsUnmatched | WsPlayerDisconnected;

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
		rotate: (r1 - 0.5) * 6,
		x: (r2 - 0.5) * 6,
		y: (r3 - 0.5) * 6,
	};
}

const DEFAULT_PLAYER_NAME = "no name";

export default function GamePage({
	params,
}: {
	params: Promise<{ deck_id: string; game_id: string }>;
}) {
	const { deck_id, game_id } = use(params);

	const [totalPairsCount, setTotalPairsCount] = useState(0);
	const [myName, setMyName] = useState(DEFAULT_PLAYER_NAME);
	const [mySessionId, setMySessionId] = useState<string | null>(null);
	const [isEditingName, setIsEditingName] = useState(false);
	const [editNameValue, setEditNameValue] = useState("");
	const editInputRef = useRef<HTMLInputElement | null>(null);

	const [players, setPlayers] = useState<Player[]>([]);

	const [cards, setCards] = useState<Card[]>([]);
	const [cardStates, setCardStates] = useState<Record<string, CardState>>({});
	const [flippedCards, setFlippedCards] = useState<string[]>([]);
	const [scores, setScores] = useState<Record<string, number>>({});
	const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
	const [isLocked, setIsLocked] = useState(false);
	const wsRef = useRef<WebSocket | null>(null);
	const cardsRef = useRef<Card[]>([]);

	// Keep cardsRef in sync
	useEffect(() => { cardsRef.current = cards; }, [cards]);

	// --- WebSocket connection and message handler ---
	useEffect(() => {
		const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
		const url = `${proto}//${window.location.host}/api/ws/${game_id}`;
		const ws = new WebSocket(url);

		ws.addEventListener("message", (event) => {
			let msg: WsMessage;
			try {
				msg = JSON.parse(event.data) as WsMessage;
			} catch {
				return;
			}

			switch (msg.type) {
				case "player-joined": {
					setPlayers((prev) => {
						const exists = prev.some((p) => p.sessionId === msg.player.sessionId);
						if (exists) {
							return prev.map((p) =>
								p.sessionId === msg.player.sessionId
									? { ...p, playerName: msg.player.playerName }
									: p
							);
						}
						return [...prev, msg.player];
					});
					setScores((prev) => ({
						...prev,
						[msg.player.sessionId]: prev[msg.player.sessionId] ?? 0,
					}));
					break;
				}
				case "card-flipped": {
					setCardStates((prev) => ({ ...prev, [msg.cardId]: "flipped" }));
					setFlippedCards((prev) => [...prev, msg.cardId]);
					break;
				}
				case "cards-matched": {
					const [id1, id2] = msg.cardIds;
					setTimeout(() => {
						setCardStates((prev) => ({
							...prev,
							[id1]: "matched",
							[id2]: "matched",
						}));
						setScores((prev) => ({
							...prev,
							[msg.scorerSessionId]: (prev[msg.scorerSessionId] ?? 0) + 1,
						}));
						setFlippedCards([]);
						setIsLocked(false);
					}, 500);
					// Persist to DB
					fetch(`/api/games/${game_id}`, {
						method: "PATCH",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							matchedCardIds: [Number(id1), Number(id2)],
							scorerSessionId: msg.scorerSessionId,
						}),
					}).catch(() => {});
					break;
				}
				case "cards-unmatched": {
					const [uid1, uid2] = msg.cardIds;
					setIsLocked(true);
					setTimeout(() => {
						setCardStates((prev) => ({
							...prev,
							[uid1]: "facedown",
							[uid2]: "facedown",
						}));
						setFlippedCards([]);
						setCurrentPlayerIndex(msg.nextPlayerIndex);
						setIsLocked(false);
					}, 1000);
					// Persist turn change to DB
					fetch(`/api/games/${game_id}`, {
						method: "PATCH",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							currentPlayerIndex: msg.nextPlayerIndex,
						}),
					}).catch(() => {});
					break;
				}
				case "player-disconnected": {
					// Could refresh player list from API if needed
					break;
				}
			}
		});

		wsRef.current = ws;
		return () => {
			ws.close();
			wsRef.current = null;
		};
	}, [game_id]);

	// Load game data (cards) from DB
	useEffect(() => {
		fetch(`/api/games/${game_id}`)
			.then((res) => (res.ok ? res.json() : null))
			.then((raw) => {
				const game = raw as {
					cards?: DbCard[];
					players?: Player[];
					current_player_index?: number;
				} | null;
				if (!game?.cards) return;
				// Sort by position to ensure consistent order across clients
				const sorted = [...game.cards].sort((a, b) => a.position - b.position);
				const mapped: Card[] = sorted.map((c) => ({
					id: String(c.id),
					pairId: String(c.pairId),
					text: c.content,
					side: c.side,
				}));
				setCards(mapped);
				setTotalPairsCount(mapped.length / 2);
				setCardStates(Object.fromEntries(
					mapped.map((c) => [c.id, (game.cards!.find((dc) => dc.id === Number(c.id))?.isMatched ? "matched" : "facedown") as CardState])
				));
				// Restore players, scores, and turn from DB
				if (game.players && game.players.length > 0) {
					setPlayers(game.players);
					setScores(Object.fromEntries(game.players.map((p) => [p.sessionId, p.score])));
				}
				if (game.current_player_index !== undefined) {
					setCurrentPlayerIndex(game.current_player_index);
				}
			})
			.catch(() => {});
	}, [game_id]);

	// Load player name and join game
	useEffect(() => {
		const saved = localStorage.getItem("playerName");
		const name = saved || DEFAULT_PLAYER_NAME;
		if (saved) setMyName(saved);

		fetch(`/api/games/${game_id}/players`, {
			method: "POST",
			credentials: "include",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ playerName: name }),
		})
			.then((res) => (res.ok ? res.json() : null))
			.then((raw) => {
				const json = raw as { players?: Player[]; sessionId?: string } | null;
				if (json?.players) {
					setPlayers(json.players);
					setScores(Object.fromEntries(json.players.map((p) => [p.sessionId, p.score])));
				}
				if (json?.sessionId) {
					setMySessionId(json.sessionId);
					// Notify other players via WebSocket
					const ws = wsRef.current;
					if (ws && ws.readyState === WebSocket.OPEN) {
						ws.send(JSON.stringify({
							type: "player-joined",
							player: { sessionId: json.sessionId, playerName: name, score: 0 },
						}));
					}
				}
			})
			.catch(() => {});
	}, [game_id]);

	// Focus the edit input when editing starts
	useEffect(() => {
		if (isEditingName) {
			editInputRef.current?.focus();
			editInputRef.current?.select();
		}
	}, [isEditingName]);

	const startEditingName = useCallback(() => {
		setEditNameValue(myName === DEFAULT_PLAYER_NAME ? "" : myName);
		setIsEditingName(true);
	}, [myName]);

	const saveName = useCallback(() => {
		const trimmed = editNameValue.trim();
		const newName = trimmed || DEFAULT_PLAYER_NAME;
		setMyName(newName);
		setIsEditingName(false);
		localStorage.setItem("playerName", newName);
		// Update session
		fetch("/api/session", {
			method: "PATCH",
			credentials: "include",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ playerName: newName }),
		}).catch(() => {});
		// Update game players in DB + notify via WS
		fetch(`/api/games/${game_id}/players`, {
			method: "POST",
			credentials: "include",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ playerName: newName }),
		}).catch(() => {});
		if (mySessionId) {
			const ws = wsRef.current;
			if (ws && ws.readyState === WebSocket.OPEN) {
				ws.send(JSON.stringify({
					type: "player-joined",
					player: { sessionId: mySessionId, playerName: newName, score: scores[mySessionId] ?? 0 },
				}));
			}
		}
	}, [editNameValue, game_id, mySessionId, scores]);

	const cancelEditing = useCallback(() => {
		setIsEditingName(false);
	}, []);

	const totalPairs = totalPairsCount;
	const matchedCount = Object.values(scores).reduce((a, b) => a + b, 0);
	const isComplete = totalPairs > 0 && matchedCount === totalPairs;
	const currentPlayer = players[currentPlayerIndex];

	// --- Card click: send via WebSocket, don't mutate local state ---
	const handleCardClick = useCallback(
		(cardId: string) => {
			if (isLocked) return;
			if (!mySessionId) return;
			// Only allow current player to click
			if (currentPlayer?.sessionId !== mySessionId) return;

			const ws = wsRef.current;
			if (!ws || ws.readyState !== WebSocket.OPEN) return;

			// Send flip event
			ws.send(JSON.stringify({ type: "card-flipped", cardId, sessionId: mySessionId }));

			// Check if this is the second flip
			const newFlipped = [...flippedCards, cardId];
			if (newFlipped.length === 2) {
				const [firstId, secondId] = newFlipped;
				const allCards = cardsRef.current;
				const firstCard = allCards.find((c) => c.id === firstId);
				const secondCard = allCards.find((c) => c.id === secondId);

				if (firstCard && secondCard && firstCard.pairId === secondCard.pairId) {
					ws.send(JSON.stringify({
						type: "cards-matched",
						cardIds: [firstId, secondId],
						scorerSessionId: mySessionId,
					}));
				} else {
					const nextIdx = (currentPlayerIndex + 1) % players.length;
					ws.send(JSON.stringify({
						type: "cards-unmatched",
						cardIds: [firstId, secondId],
						nextPlayerIndex: nextIdx,
					}));
				}
			}
		},
		[isLocked, mySessionId, currentPlayer, flippedCards, currentPlayerIndex, players.length]
	);

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
					{players.map((player) => {
						const isActive = player.sessionId === currentPlayer?.sessionId;
						const isMe = player.sessionId === mySessionId;
						return (
							<div
								key={player.sessionId}
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
									{isMe ? (
										isEditingName ? (
											<span className="inline-flex items-center gap-1">
												<input
													ref={editInputRef}
													type="text"
													value={editNameValue}
													onChange={(e) => setEditNameValue(e.target.value)}
													onKeyDown={(e) => {
														if (e.key === "Enter") saveName();
														if (e.key === "Escape") cancelEditing();
													}}
													onBlur={saveName}
													maxLength={20}
													className="w-20 bg-transparent border-b border-current outline-none text-sm font-semibold"
												/>
												<span className="opacity-60">(You)</span>
											</span>
										) : (
											<span>
												<button
													onClick={startEditingName}
													className="underline decoration-dotted underline-offset-2 hover:decoration-solid cursor-pointer"
												>
													{player.playerName}
												</button>
												<span className="opacity-60"> (You)</span>
											</span>
										)
									) : (
										player.playerName
									)}
								</span>
								<span
									className={`font-display text-lg font-bold ${
										isActive ? "text-on-surface" : "text-on-surface-variant"
									}`}
								>
									{scores[player.sessionId] ?? 0}
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
				const winners = players.filter((p) => scores[p.sessionId] === maxScore);
				const isTie = winners.length > 1;

				return (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-surface/70 backdrop-blur-[24px]">
						<div className="bg-surface-lowest rounded-[3rem] p-12 sm:p-16 max-w-md w-full mx-6 shadow-[0px_20px_40px_rgba(45,52,51,0.06)] text-center">
							<h2 className="font-display text-[2.5rem] sm:text-[3.5rem] font-extrabold text-on-surface leading-none">
								{isTie ? "Draw" : `${winners[0].playerName} Wins`}
							</h2>

							{/* Final scores */}
							<div className="mt-8 flex flex-col gap-2">
								{players
									.slice()
									.sort((a, b) => (scores[b.sessionId] ?? 0) - (scores[a.sessionId] ?? 0))
									.map((player, i) => (
										<div
											key={player.sessionId}
											className={`flex items-center justify-between px-5 py-3 rounded-full ${
												i === 0 ? "bg-primary-container" : "bg-surface-low"
											}`}
										>
											<span
												className={`font-body text-sm font-semibold ${
													i === 0 ? "text-primary" : "text-on-surface-variant"
												}`}
											>
												{player.playerName}
											</span>
											<span
												className={`font-display text-lg font-bold ${
													i === 0 ? "text-on-surface" : "text-on-surface-variant"
												}`}
											>
												{scores[player.sessionId] ?? 0} pairs
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
