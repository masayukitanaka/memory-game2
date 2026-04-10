import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "Tactile Mind - Language Memory Game",
	description:
		"A serene memory card game for language learning. Match word pairs to build your vocabulary.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<head>
				<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
				<link
					rel="stylesheet"
					href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700&display=swap"
				/>
			</head>
			<body className="antialiased">{children}</body>
		</html>
	);
}
