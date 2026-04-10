import Link from "next/link";

const games = [
	{
		id: "basic-greetings",
		title: "Basic Greetings",
		description: "Hello, thank you, goodbye... Learn everyday greetings through matching",
		pairs: 8,
		level: "Beginner",
		accent: "from-primary to-primary-container",
	},
	{
		id: "food-and-drinks",
		title: "Food & Drinks",
		description: "Match food and drink vocabulary to build your culinary lexicon",
		pairs: 10,
		level: "Beginner",
		accent: "from-[#4a7a6d] to-[#b8e8d4]",
	},
	{
		id: "travel-essentials",
		title: "Travel Essentials",
		description: "Essential words and phrases for your next journey abroad",
		pairs: 12,
		level: "Intermediate",
		accent: "from-[#5b7a6e] to-[#c2e8da]",
	},
	{
		id: "emotions",
		title: "Emotions",
		description: "Learn to express feelings and emotions with rich vocabulary",
		pairs: 10,
		level: "Intermediate",
		accent: "from-[#3d706a] to-[#b0e0d6]",
	},
	{
		id: "business-basics",
		title: "Business Basics",
		description: "Master commonly used words and phrases in professional settings",
		pairs: 14,
		level: "Advanced",
		accent: "from-[#2d5c56] to-[#a8d8ce]",
	},
	{
		id: "idioms",
		title: "Idioms & Phrases",
		description: "Discover common idioms and fixed expressions through play",
		pairs: 8,
		level: "Advanced",
		accent: "from-[#3b6761] to-[#bdece5]",
	},
];

function LevelBadge({ level }: { level: string }) {
	const styles: Record<string, string> = {
		Beginner: "bg-primary-container/60 text-primary",
		Intermediate: "bg-secondary-container/60 text-[#3d706a]",
		Advanced: "bg-[#e8d8f0]/60 text-[#5a4a6a]",
	};

	return (
		<span
			className={`inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${styles[level] ?? ""}`}
		>
			{level}
		</span>
	);
}

export default function Home() {
	return (
		<div className="min-h-screen">
			{/* Navigation - Glassmorphism */}
			<nav className="sticky top-0 z-50 bg-surface/70 backdrop-blur-[24px]">
				<div className="max-w-6xl mx-auto px-6 sm:px-10 py-5 flex items-center justify-between">
					<span className="font-display text-xl font-bold tracking-tight text-on-surface">
						Tactile Mind
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

			{/* Game Cards Section */}
			<section className="px-6 sm:px-10 pb-24">
				<div className="max-w-6xl mx-auto">
					<h2 className="font-display text-sm font-semibold tracking-widest uppercase text-on-surface-variant mb-10">
						Games
					</h2>

					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
						{games.map((game) => (
							<Link
								key={game.id}
								href={`/games/${game.id}`}
								className="group block"
							>
								<article className="relative bg-surface-lowest rounded-[2rem] p-8 pt-10 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:shadow-[0px_20px_40px_rgba(45,52,51,0.06)] hover:scale-[1.02]">
									{/* Accent gradient strip */}
									<div
										className={`h-1.5 w-16 rounded-full bg-gradient-to-r ${game.accent} mb-7 transition-all duration-300 group-hover:w-24`}
									/>

									<div className="flex items-start justify-between gap-3 mb-4">
										<h3 className="font-display text-xl font-bold text-on-surface leading-snug">
											{game.title}
										</h3>
										<LevelBadge level={game.level} />
									</div>

									<p className="text-sm leading-relaxed text-on-surface-variant mb-8">
										{game.description}
									</p>

									<div className="flex items-center justify-between">
										<span className="text-xs font-medium text-on-surface-variant tracking-wide">
											{game.pairs} pairs
										</span>
										<span className="text-xs font-semibold text-primary opacity-0 translate-x-[-4px] transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0">
											Play →
										</span>
									</div>
								</article>
							</Link>
						))}
					</div>
				</div>
			</section>
		</div>
	);
}
