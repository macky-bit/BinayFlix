import { useState, useRef, useEffect, useCallback } from "react";
import styles from "./help.module.css";

// ─── Color tokens ────────────────────────────────────────────────
const C = {
	ink: "var(--color-ink)",
	wine: "var(--color-wine)",
	wineDark: "var(--color-ink-soft)",
	cream: "var(--color-cream)",
	taupe: "var(--color-taupe)",
	stone: "var(--color-stone)",
	surfaceElevated: "var(--color-ink-soft)",
};

// ─── Help articles data ──────────────────────────────────────────
const ARTICLES = [
	{
		id: "reset-password",
		title: "How to reset your password",
		category: "Account & Profiles",
		content: [
			"Go to the StreamFlix sign-in page.",
			'Click "Forgot password?" below the password field.',
			"Enter the email address linked to your account.",
			"Check your inbox for a reset link and click it.",
			"Enter and confirm your new password.",
			"Select Save. You can now sign in with the new password.",
		],
	},
	{
		id: "edit-profile",
		title: "How to edit your profile",
		category: "Account & Profiles",
		content: [
			"Open the profile menu from any page.",
			"Select Profile or Manage Profiles.",
			"Choose the profile you want to update.",
			"Change the profile name, avatar, language, or maturity rating.",
			"Select Save.",
		],
	},
	{
		id: "subtitle-appearance",
		title: "How to change subtitle appearance",
		category: "Subtitles & Language",
		content: [
			"While watching a title, open the audio and subtitles menu.",
			"Select Subtitle Appearance.",
			"Adjust font size, style, color, and background.",
			"Changes apply immediately during playback.",
		],
	},
	{
		id: "manage-profile-settings",
		title: "How to manage profile settings",
		category: "Account & Profiles",
		content: [
			"Select your profile icon in the top-right corner.",
			"Choose Manage Profiles.",
			"Select the profile you want to configure.",
			"Update name, avatar, language, maturity rating, and autoplay preferences.",
			"Select Save when done.",
		],
	},
	{
		id: "remove-from-mylist",
		title: "How to remove a title from My List",
		category: "My List",
		content: [
			"Navigate to My List from the main menu.",
			"Hover over the title you want to remove.",
			"Click the checkmark icon to toggle it off your list.",
			"The title is immediately removed from My List.",
		],
	},
	{
		id: "remove-continue-watching",
		title: "How to remove a title from Continue Watching",
		category: "Continue Watching",
		content: [
			"Find the title in the Continue Watching row on the Home page.",
			"Hover over the title thumbnail.",
			"Click the three-dot menu icon.",
			"Select Remove from Row.",
			"The title is removed from Continue Watching.",
		],
	},
	{
		id: "video-not-playing",
		title: "Why a video is not playing",
		category: "Playback",
		content: [
			"Check your internet connection — StreamFlix requires a stable connection.",
			"Restart the StreamFlix app or refresh the browser page.",
			"Clear your browser cache if using the web app.",
			"Check for app updates and install any available updates.",
			"Try a different device or browser.",
			"If the issue persists, contact our support team.",
		],
	},
	{
		id: "change-language",
		title: "How to change your default language",
		category: "Subtitles & Language",
		content: [
			"Select your profile icon and choose Account.",
			"Under Profile & Parental Controls, select your profile.",
			"Next to Language, select Change.",
			"Choose your preferred language from the list.",
			"Select Save. The change applies immediately.",
		],
	},
	{
		id: "set-profile-pin",
		title: "How to set a profile PIN",
		category: "Privacy & Security",
		content: [
			"Select your profile icon and choose Account.",
			"Under Profile & Parental Controls, select your profile.",
			"Next to Profile Lock, select Change.",
			"Enter your account password to confirm.",
			"Toggle on Require a PIN to access the selected profile.",
			"Enter and confirm your 4-digit PIN.",
			"Select Save.",
		],
	},
	{
		id: "autoplay-settings",
		title: "How to manage autoplay settings",
		category: "Account & Profiles",
		content: [
			"Select your profile icon and choose Account.",
			"Under Profile & Parental Controls, select your profile.",
			"Under Playback Settings, select Change.",
			"Toggle Autoplay next episode in a series on or off.",
			"Toggle Autoplay previews while browsing on or off.",
			"Select Save.",
		],
	},
	{
		id: "watch-history",
		title: "How to view your watch history",
		category: "My List",
		content: [
			"Select your profile icon and choose Account.",
			"Under Profile & Parental Controls, select your profile.",
			"Click Viewing Activity.",
			"Browse your complete watch history.",
			"To hide a title, click the hide icon next to it.",
		],
	},
	{
		id: "account-secure",
		title: "How to keep your account secure",
		category: "Privacy & Security",
		content: [
			"Use a unique, strong password that you do not use elsewhere.",
			"Enable two-step verification in Account settings.",
			"Review the devices signed in to your account regularly.",
			"Sign out of devices you no longer use.",
			"Never share your account password.",
		],
	},
	{
		id: "parental-controls",
		title: "How to manage parental controls",
		category: "Privacy & Security",
		content: [
			"Select your profile icon and choose Account.",
			"Under Profile & Parental Controls, select the profile to restrict.",
			"Next to Viewing Restrictions, select Change.",
			"Set the maturity rating appropriate for the profile.",
			"Optionally enable a Profile Lock PIN so the settings cannot be changed without it.",
			"Select Save.",
		],
	},
	{
		id: "change-profile-settings",
		title: "How to change profile settings",
		category: "Account & Profiles",
		content: [
			"Select your profile icon in the top-right corner.",
			"Choose Manage Profiles.",
			"Select the profile you want to update.",
			"Modify name, avatar, language, maturity rating, or autoplay behavior.",
			"Select Save when finished.",
		],
	},
];

// ─── Icons ───────────────────────────────────────────────────────
function SearchIcon({
	size = 20,
	color = C.taupe,
}: {
	size?: number;
	color?: string;
}) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 20 20"
			fill="none"
			aria-hidden="true"
		>
			<circle cx="8.5" cy="8.5" r="5.75" stroke={color} strokeWidth="1.5" />
			<path
				d="M13.5 13.5L17 17"
				stroke={color}
				strokeWidth="1.5"
				strokeLinecap="round"
			/>
		</svg>
	);
}

function ChevronDownIcon({
	size = 12,
	color = C.taupe,
}: {
	size?: number;
	color?: string;
}) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 12 12"
			fill="none"
			aria-hidden="true"
		>
			<path
				d="M2 4L6 8L10 4"
				stroke={color}
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

function ChevronRightIcon({
	size = 14,
	color = C.taupe,
}: {
	size?: number;
	color?: string;
}) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 14 14"
			fill="none"
			aria-hidden="true"
		>
			<path
				d="M5 3L9 7L5 11"
				stroke={color}
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

function XIcon({
	size = 16,
	color = C.taupe,
}: {
	size?: number;
	color?: string;
}) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 16 16"
			fill="none"
			aria-hidden="true"
		>
			<path
				d="M3 3L13 13M13 3L3 13"
				stroke={color}
				strokeWidth="1.5"
				strokeLinecap="round"
			/>
		</svg>
	);
}

function ArticleIcon({
	size = 16,
	color = C.taupe,
}: {
	size?: number;
	color?: string;
}) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 16 16"
			fill="none"
			aria-hidden="true"
		>
			<rect
				x="2"
				y="2"
				width="12"
				height="12"
				rx="1.5"
				stroke={color}
				strokeWidth="1.25"
			/>
			<path
				d="M5 6H11M5 8.5H11M5 11H8.5"
				stroke={color}
				strokeWidth="1.25"
				strokeLinecap="round"
			/>
		</svg>
	);
}

function ArrowLeftIcon({
	size = 16,
	color = C.taupe,
}: {
	size?: number;
	color?: string;
}) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 16 16"
			fill="none"
			aria-hidden="true"
		>
			<path
				d="M10 3L5 8L10 13"
				stroke={color}
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

// ─── Highlight matching text ─────────────────────────────────────
function Highlighted({ text, query }: { text: string; query: string }) {
	if (!query.trim()) return <>{text}</>;
	const idx = text.toLowerCase().indexOf(query.toLowerCase());
	if (idx === -1) return <>{text}</>;
	return (
		<>
			{text.slice(0, idx)}
			<mark
				style={{
					background: C.wine,
					color: C.cream,
					borderRadius: 2,
					padding: "0 2px",
				}}
			>
				{text.slice(idx, idx + query.length)}
			</mark>
			{text.slice(idx + query.length)}
		</>
	);
}

// ─── Support Modal ───────────────────────────────────────────────
function SupportModal({ onClose }: { onClose: () => void }) {
	const [topic, setTopic] = useState("");
	const [subject, setSubject] = useState("");
	const [description, setDescription] = useState("");
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [submitted, setSubmitted] = useState(false);
	const overlayRef = useRef<HTMLDivElement>(null);

	const topics = [
		"Account & Profiles",
		"Playback",
		"My List",
		"Continue Watching",
		"Subtitles & Language",
		"Privacy & Security",
		"Other",
	];

	const validate = () => {
		const e: Record<string, string> = {};
		if (!topic) e.topic = "Please select a help topic.";
		if (!subject.trim()) e.subject = "Please enter a subject.";
		if (!description.trim()) e.description = "Please describe the issue.";
		return e;
	};

	const handleSubmit = (ev: React.FormEvent) => {
		ev.preventDefault();
		const e = validate();
		if (Object.keys(e).length > 0) {
			setErrors(e);
			return;
		}
		setSubmitted(true);
	};

	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [onClose]);

	const fieldStyle: React.CSSProperties = {
		width: "100%",
		background: "var(--color-ink-soft)",
		border: `1px solid ${C.stone}`,
		borderRadius: 6,
		color: C.cream,
		fontFamily: "'Barlow', sans-serif",
		fontSize: 14,
		padding: "10px 14px",
		outline: "none",
		transition: "border-color 0.15s",
	};

	const labelStyle: React.CSSProperties = {
		display: "block",
		color: C.cream,
		fontSize: 13,
		fontWeight: 500,
		marginBottom: 6,
	};

	return (
		<div
			ref={overlayRef}
			onClick={(e) => {
				if (e.target === overlayRef.current) onClose();
			}}
			style={{
				position: "fixed",
				inset: 0,
				zIndex: 200,
				background: "var(--color-ink)",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				padding: "16px",
			}}
			role="dialog"
			aria-modal="true"
			aria-label="Contact Support"
		>
			<div
				style={{
					background: C.surfaceElevated,
					border: `1px solid var(--color-stone)`,
					borderRadius: 10,
					width: "100%",
					maxWidth: 520,
					maxHeight: "90vh",
					overflowY: "auto",
					padding: "32px 28px",
					boxShadow: "0 20px 60px var(--color-ink)",
				}}
			>
				{submitted ? (
					<div style={{ textAlign: "center", padding: "32px 0" }}>
						<div
							style={{
								width: 56,
								height: 56,
								borderRadius: "50%",
								background: C.wine,
								margin: "0 auto 20px",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<svg
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
							>
								<path
									d="M5 12L10 17L19 8"
									stroke={C.cream}
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						</div>
						<p
							style={{
								color: C.cream,
								fontSize: 18,
								fontWeight: 600,
								margin: "0 0 12px",
							}}
						>
							Your support request has been submitted.
						</p>
						<p
							style={{
								color: C.taupe,
								fontSize: 14,
								margin: "0 0 28px",
							}}
						>
							Our team will get back to you shortly.
						</p>
						<button
							onClick={onClose}
							style={{
								background: C.wine,
								color: C.cream,
								border: "none",
								borderRadius: 6,
								padding: "10px 28px",
								fontFamily: "'Barlow', sans-serif",
								fontSize: 14,
								fontWeight: 600,
								cursor: "pointer",
							}}
						>
							Close
						</button>
					</div>
				) : (
					<>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								marginBottom: 24,
							}}
						>
							<h2
								style={{
									margin: 0,
									color: C.cream,
									fontSize: 20,
									fontFamily: "'Barlow Condensed', sans-serif",
									fontWeight: 700,
								}}
							>
								Contact Support
							</h2>
							<button
								onClick={onClose}
								style={{
									background: "none",
									border: "none",
									cursor: "pointer",
									padding: 4,
									display: "flex",
									alignItems: "center",
								}}
								aria-label="Close"
							>
								<XIcon color={C.taupe} size={18} />
							</button>
						</div>
						<form
							onSubmit={handleSubmit}
							noValidate
							style={{
								display: "flex",
								flexDirection: "column",
								gap: 18,
							}}
						>
							<div>
								<label style={labelStyle} htmlFor="support-topic">
									Help Topic
								</label>
								<select
									id="support-topic"
									value={topic}
									onChange={(e) => {
										setTopic(e.target.value);
										setErrors((p) => ({ ...p, topic: "" }));
									}}
									style={{
										...fieldStyle,
										appearance: "none",
										cursor: "pointer",
									}}
									onFocus={(e) =>
										(e.target.style.borderColor = C.wine)
									}
									onBlur={(e) =>
										(e.target.style.borderColor = errors.topic
											? "var(--color-ink-soft)"
											: C.stone)
									}
								>
									<option
										value=""
										disabled
										style={{ background: C.ink }}
									>
										Select a topic
									</option>
									{topics.map((t) => (
										<option
											key={t}
											value={t}
											style={{ background: C.ink }}
										>
											{t}
										</option>
									))}
								</select>
								{errors.topic && (
									<p
										style={{
											color: "var(--color-ink-soft)",
											fontSize: 12,
											margin: "6px 0 0",
										}}
									>
										{errors.topic}
									</p>
								)}
							</div>
							<div>
								<label style={labelStyle} htmlFor="support-subject">
									Subject
								</label>
								<input
									id="support-subject"
									type="text"
									value={subject}
									onChange={(e) => {
										setSubject(e.target.value);
										setErrors((p) => ({ ...p, subject: "" }));
									}}
									placeholder="Brief description of your issue"
									style={{
										...fieldStyle,
										...(errors.subject
											? { borderColor: "var(--color-ink-soft)" }
											: {}),
									}}
									onFocus={(e) =>
										(e.target.style.borderColor = C.wine)
									}
									onBlur={(e) =>
										(e.target.style.borderColor = errors.subject
											? "var(--color-ink-soft)"
											: C.stone)
									}
								/>
								{errors.subject && (
									<p
										style={{
											color: "var(--color-ink-soft)",
											fontSize: 12,
											margin: "6px 0 0",
										}}
									>
										{errors.subject}
									</p>
								)}
							</div>
							<div>
								<label style={labelStyle} htmlFor="support-description">
									Description
								</label>
								<textarea
									id="support-description"
									value={description}
									onChange={(e) => {
										setDescription(e.target.value);
										setErrors((p) => ({ ...p, description: "" }));
									}}
									placeholder="Please describe the issue in detail"
									rows={5}
									style={{
										...fieldStyle,
										resize: "vertical",
										...(errors.description
											? { borderColor: "var(--color-ink-soft)" }
											: {}),
									}}
									onFocus={(e) =>
										(e.target.style.borderColor = C.wine)
									}
									onBlur={(e) =>
										(e.target.style.borderColor = errors.description
											? "var(--color-ink-soft)"
											: C.stone)
									}
								/>
								{errors.description && (
									<p
										style={{
											color: "var(--color-ink-soft)",
											fontSize: 12,
											margin: "6px 0 0",
										}}
									>
										{errors.description}
									</p>
								)}
							</div>
							<div>
								<label style={labelStyle} htmlFor="support-attachment">
									Attachment (optional)
								</label>
								<input
									id="support-attachment"
									type="file"
									style={{
										...fieldStyle,
										color: C.taupe,
										cursor: "pointer",
										padding: "8px 14px",
									}}
								/>
							</div>
							<div style={{ display: "flex", gap: 12, marginTop: 8 }}>
								<button
									type="submit"
									style={{
										flex: 1,
										background: C.wine,
										color: C.cream,
										border: "none",
										borderRadius: 6,
										padding: "12px",
										fontFamily: "'Barlow', sans-serif",
										fontSize: 14,
										fontWeight: 600,
										cursor: "pointer",
										transition: "background 0.15s",
									}}
									onMouseEnter={(e) =>
										(e.currentTarget.style.background = C.wineDark)
									}
									onMouseLeave={(e) =>
										(e.currentTarget.style.background = C.wine)
									}
								>
									Submit Request
								</button>
								<button
									type="button"
									onClick={onClose}
									style={{
										flex: 1,
										background: "transparent",
										color: C.taupe,
										border: `1px solid ${C.stone}`,
										borderRadius: 6,
										padding: "12px",
										fontFamily: "'Barlow', sans-serif",
										fontSize: 14,
										fontWeight: 600,
										cursor: "pointer",
										transition: "border-color 0.15s, color 0.15s",
									}}
									onMouseEnter={(e) => {
										e.currentTarget.style.borderColor = C.wine;
										e.currentTarget.style.color = C.cream;
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.borderColor = C.stone;
										e.currentTarget.style.color = C.taupe;
									}}
								>
									Cancel
								</button>
							</div>
						</form>
					</>
				)}
			</div>
		</div>
	);
}

// ─── Article Page ────────────────────────────────────────────────
function ArticlePage({
	article,
	onBack,
	onContactUs,
}: {
	article: (typeof ARTICLES)[0];
	onBack: () => void;
	onContactUs: () => void;
}) {
	return (
		<main
			style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px" }}
		>
			{/* Breadcrumb */}
			<nav aria-label="Breadcrumb" style={{ marginBottom: 28 }}>
				<button
					onClick={onBack}
					style={{
						background: "none",
						border: "none",
						cursor: "pointer",
						display: "inline-flex",
						alignItems: "center",
						gap: 6,
						color: C.taupe,
						fontFamily: "'Barlow', sans-serif",
						fontSize: 13,
						padding: 0,
						transition: "color 0.15s",
					}}
					onMouseEnter={(e) => (e.currentTarget.style.color = C.cream)}
					onMouseLeave={(e) => (e.currentTarget.style.color = C.taupe)}
				>
					<ArrowLeftIcon size={14} color="currentColor" />
					Help Center
				</button>
				<span style={{ color: C.stone, margin: "0 8px", fontSize: 13 }}>
					/
				</span>
				<span style={{ color: C.stone, fontSize: 13 }}>
					{article.category}
				</span>
				<span style={{ color: C.stone, margin: "0 8px", fontSize: 13 }}>
					/
				</span>
				<span style={{ color: C.taupe, fontSize: 13 }}>
					{article.title}
				</span>
			</nav>

			{/* Header */}
			<h1
				style={{
					fontFamily: "'Barlow Condensed', sans-serif",
					fontSize: "clamp(28px, 5vw, 40px)",
					fontWeight: 700,
					color: C.cream,
					margin: "0 0 12px",
					lineHeight: 1.15,
				}}
			>
				{article.title}
			</h1>
			<p style={{ color: C.stone, fontSize: 13, margin: "0 0 32px" }}>
				Last updated: August 2026 · {article.category}
			</p>

			<div
				style={{
					borderTop: `1px solid var(--color-stone)`,
					marginBottom: 32,
				}}
			/>

			{/* Steps */}
			<ol
				style={{
					padding: 0,
					margin: "0 0 40px",
					listStyle: "none",
					display: "flex",
					flexDirection: "column",
					gap: 16,
				}}
			>
				{article.content.map((step, i) => (
					<li
						key={i}
						style={{ display: "flex", gap: 16, alignItems: "flex-start" }}
					>
						<span
							style={{
								flexShrink: 0,
								width: 28,
								height: 28,
								borderRadius: "50%",
								background: C.wine,
								color: C.cream,
								fontFamily: "'Barlow Condensed', sans-serif",
								fontSize: 14,
								fontWeight: 700,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							{i + 1}
						</span>
						<p
							style={{
								color: C.taupe,
								fontSize: 15,
								lineHeight: 1.6,
								margin: 0,
								paddingTop: 4,
							}}
						>
							{step}
						</p>
					</li>
				))}
			</ol>

			<div
				style={{
					borderTop: `1px solid var(--color-stone)`,
					marginBottom: 32,
				}}
			/>

			{/* Related articles */}
			<h3
				style={{
					color: C.cream,
					fontSize: 16,
					fontWeight: 600,
					margin: "0 0 16px",
				}}
			>
				Related Articles
			</h3>
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					gap: 8,
					marginBottom: 40,
				}}
			>
				{ARTICLES.filter(
					(a) => a.category === article.category && a.id !== article.id,
				)
					.slice(0, 3)
					.map((a) => (
						<a
							key={a.id}
							href="#"
							onClick={(e) => e.preventDefault()}
							style={{
								color: C.taupe,
								fontSize: 14,
								textDecoration: "underline",
								textDecorationColor: "var(--color-ink-soft)",
								transition: "color 0.15s",
							}}
							onMouseEnter={(e) =>
								(e.currentTarget.style.color = C.cream)
							}
							onMouseLeave={(e) =>
								(e.currentTarget.style.color = C.taupe)
							}
						>
							{a.title}
						</a>
					))}
			</div>

			{/* Actions */}
			<div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
				<button
					onClick={onBack}
					style={{
						background: "transparent",
						color: C.taupe,
						border: `1px solid ${C.stone}`,
						borderRadius: 6,
						padding: "10px 22px",
						fontFamily: "'Barlow', sans-serif",
						fontSize: 14,
						fontWeight: 600,
						cursor: "pointer",
						transition: "border-color 0.15s, color 0.15s",
					}}
					onMouseEnter={(e) => {
						e.currentTarget.style.borderColor = C.wine;
						e.currentTarget.style.color = C.cream;
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.borderColor = C.stone;
						e.currentTarget.style.color = C.taupe;
					}}
				>
					← Back to Help Center
				</button>
				<button
					onClick={onContactUs}
					style={{
						background: C.wine,
						color: C.cream,
						border: "none",
						borderRadius: 6,
						padding: "10px 22px",
						fontFamily: "'Barlow', sans-serif",
						fontSize: 14,
						fontWeight: 600,
						cursor: "pointer",
						transition: "background 0.15s",
					}}
					onMouseEnter={(e) =>
						(e.currentTarget.style.background = C.wineDark)
					}
					onMouseLeave={(e) => (e.currentTarget.style.background = C.wine)}
				>
					Contact Support
				</button>
			</div>
		</main>
	);
}

// ─── Main App ────────────────────────────────────────────────────
export function HelpView() {
	const [query, setQuery] = useState("");
	const [focused, setFocused] = useState(false);
	const [suggestions, setSuggestions] = useState<typeof ARTICLES>([]);
	const [activeIndex, setActiveIndex] = useState(-1);
	const [selectedArticle, setSelectedArticle] = useState<
		(typeof ARTICLES)[0] | null
	>(null);
	const [showModal, setShowModal] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const suggestionsRef = useRef<HTMLDivElement>(null);
	const searchContainerRef = useRef<HTMLDivElement>(null);

	const filtered =
		query.trim().length > 0
			? ARTICLES.filter((a) =>
					a.title.toLowerCase().includes(query.toLowerCase()),
				)
			: [];

	useEffect(() => {
		setSuggestions(filtered);
		setActiveIndex(-1);
	}, [query]);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (!focused || suggestions.length === 0) return;
		if (e.key === "ArrowDown") {
			e.preventDefault();
			setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setActiveIndex((i) => Math.max(i - 1, -1));
		} else if (e.key === "Enter") {
			if (activeIndex >= 0) {
				setSelectedArticle(suggestions[activeIndex]);
				setFocused(false);
			}
		} else if (e.key === "Escape") {
			setFocused(false);
		}
	};

	const handleClickOutside = useCallback((e: MouseEvent) => {
		if (
			searchContainerRef.current &&
			!searchContainerRef.current.contains(e.target as Node)
		) {
			setFocused(false);
		}
	}, []);

	useEffect(() => {
		document.addEventListener("mousedown", handleClickOutside);
		return () =>
			document.removeEventListener("mousedown", handleClickOutside);
	}, [handleClickOutside]);

	const showSuggestions = focused && query.trim().length > 0;

	if (selectedArticle) {
		return (
			<div className={styles.page} style={{ minHeight: "100vh" }}>
				<ArticlePage
					article={selectedArticle}
					onBack={() => setSelectedArticle(null)}
					onContactUs={() => setShowModal(true)}
				/>
				{showModal && <SupportModal onClose={() => setShowModal(false)} />}
			</div>
		);
	}

	return (
		<div
			className={styles.page}
			style={{
				minHeight: "100vh",
				display: "flex",
				flexDirection: "column",
			}}
		>
			{/* Main content */}
			<main
				style={{
					flex: 1,
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					padding: "48px 24px 80px",
				}}
			>
				{/* Heading */}
				<h1
					style={{
						fontFamily: "'Barlow Condensed', sans-serif",
						fontSize: "clamp(36px, 6vw, 56px)",
						fontWeight: 700,
						color: C.cream,
						textAlign: "center",
						margin: "0 0 32px",
						letterSpacing: "-0.5px",
					}}
				>
					How can we help?
				</h1>

				{/* Search */}
				<div
					ref={searchContainerRef}
					style={{ width: "100%", maxWidth: 860, position: "relative" }}
				>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							background: "var(--color-ink-soft)",
							border: `1.5px solid ${focused ? C.wine : C.stone}`,
							borderRadius: 8,
							padding: "0 16px",
							height: 56,
							transition: "border-color 0.2s",
							gap: 12,
						}}
					>
						<SearchIcon color={focused ? C.cream : C.taupe} size={20} />
						<input
							ref={inputRef}
							type="text"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							onFocus={() => setFocused(true)}
							onKeyDown={handleKeyDown}
							placeholder="Type a question, topic, or issue"
							aria-label="Search Help Center"
							aria-autocomplete="list"
							aria-expanded={showSuggestions}
							style={{
								flex: 1,
								background: "none",
								border: "none",
								outline: "none",
								color: C.cream,
								fontFamily: "'Barlow', sans-serif",
								fontSize: 16,
								caretColor: C.wine,
							}}
						/>
						{query && (
							<button
								onClick={() => {
									setQuery("");
									inputRef.current?.focus();
								}}
								style={{
									background: "none",
									border: "none",
									cursor: "pointer",
									display: "flex",
									alignItems: "center",
									padding: 4,
								}}
								aria-label="Clear search"
							>
								<XIcon color={C.taupe} />
							</button>
						)}
					</div>

					{/* Suggestions panel */}
					{showSuggestions && (
						<div
							ref={suggestionsRef}
							role="listbox"
							aria-label="Search suggestions"
							style={{
								position: "absolute",
								top: "calc(100% + 6px)",
								left: 0,
								right: 0,
								background: "var(--color-ink-soft)",
								border: `1px solid var(--color-stone)`,
								borderRadius: 8,
								zIndex: 50,
								boxShadow: "0 12px 40px var(--color-ink)",
								overflow: "hidden",
							}}
						>
							{suggestions.length > 0 ? (
								suggestions.map((article, i) => (
									<button
										key={article.id}
										role="option"
										aria-selected={i === activeIndex}
										onClick={() => {
											setSelectedArticle(article);
											setFocused(false);
										}}
										style={{
											display: "flex",
											alignItems: "center",
											gap: 12,
											width: "100%",
											padding: "12px 16px",
											background:
												i === activeIndex
													? `var(--color-wine)`
													: "none",
											border: "none",
											cursor: "pointer",
											borderBottom:
												i < suggestions.length - 1
													? `1px solid var(--color-stone)`
													: "none",
											textAlign: "left",
											transition: "background 0.12s",
										}}
										onMouseEnter={(e) => {
											setActiveIndex(i);
											e.currentTarget.style.background = `var(--color-wine)`;
										}}
										onMouseLeave={(e) => {
											e.currentTarget.style.background =
												i === activeIndex
													? `var(--color-wine)`
													: "none";
										}}
									>
										<ArticleIcon color={C.taupe} />
										<div style={{ flex: 1, minWidth: 0 }}>
											<p
												style={{
													margin: 0,
													color: C.cream,
													fontSize: 14,
													fontWeight: 500,
												}}
											>
												<Highlighted
													text={article.title}
													query={query}
												/>
											</p>
											<p
												style={{
													margin: 0,
													color: C.taupe,
													fontSize: 12,
												}}
											>
												{article.category}
											</p>
										</div>
										<ChevronRightIcon color={C.stone} />
									</button>
								))
							) : (
								<div
									style={{ padding: "20px 16px", textAlign: "center" }}
								>
									<p
										style={{
											color: C.cream,
											fontSize: 14,
											margin: "0 0 6px",
											fontWeight: 500,
										}}
									>
										No help articles match your search.
									</p>
									<p
										style={{
											color: C.taupe,
											fontSize: 13,
											margin: 0,
										}}
									>
										Try using fewer or different keywords.
									</p>
								</div>
							)}
						</div>
					)}
				</div>

				{/* Recommended links */}
				<div
					style={{
						marginTop: 28,
						textAlign: "center",
						maxWidth: 860,
						width: "100%",
					}}
				>
					<p
						style={{
							color: C.cream,
							fontSize: 14,
							display: "inline",
							fontWeight: 500,
							marginRight: 8,
						}}
					>
						Recommended for you:
					</p>
					<span
						style={{ display: "inline", flexWrap: "wrap", gap: "8px 0" }}
					>
						{[
							{
								id: "account-secure",
								label: "How to keep your account secure",
							},
							{
								id: "parental-controls",
								label: "How to manage parental controls",
							},
							{
								id: "change-profile-settings",
								label: "How to change profile settings",
							},
						].map((link, i, arr) => {
							const article = ARTICLES.find((a) => a.id === link.id)!;
							return (
								<span key={link.id}>
									<button
										onClick={() => setSelectedArticle(article)}
										style={{
											background: "none",
											border: "none",
											cursor: "pointer",
											color: C.taupe,
											fontSize: 14,
											fontFamily: "'Barlow', sans-serif",
											textDecoration: "underline",
											textDecorationColor: "var(--color-ink-soft)",
											padding: "0 2px",
											transition: "color 0.15s",
										}}
										onMouseEnter={(e) => {
											e.currentTarget.style.color = C.cream;
											e.currentTarget.style.textDecorationColor =
												C.cream;
										}}
										onMouseLeave={(e) => {
											e.currentTarget.style.color = C.taupe;
											e.currentTarget.style.textDecorationColor =
												"var(--color-ink-soft)";
										}}
									>
										{link.label}
									</button>
									{i < arr.length - 1 && (
										<span
											style={{
												color: C.stone,
												margin: "0 8px",
												fontSize: 14,
												opacity: 0.6,
											}}
										>
											|
										</span>
									)}
								</span>
							);
						})}
					</span>
				</div>

				{/* Divider */}
				<div
					style={{
						width: "100%",
						maxWidth: 860,
						borderTop: `1px solid var(--color-stone)`,
						margin: "40px 0",
					}}
				/>

				{/* Still need help */}
				<div style={{ textAlign: "center" }}>
					<h2
						style={{
							fontFamily: "'Barlow Condensed', sans-serif",
							fontSize: "clamp(28px, 4vw, 40px)",
							fontWeight: 700,
							color: C.cream,
							margin: "0 0 10px",
						}}
					>
						Still need help?
					</h2>
					<p style={{ color: C.taupe, fontSize: 15, margin: "0 0 28px" }}>
						Our support team is here for you.
					</p>
					<div
						style={{
							display: "flex",
							gap: 12,
							justifyContent: "center",
							flexWrap: "wrap",
						}}
					>
						<button
							onClick={() => setShowModal(true)}
							style={{
								background: C.wine,
								color: C.cream,
								border: "none",
								borderRadius: 6,
								padding: "12px 32px",
								fontFamily: "'Barlow', sans-serif",
								fontSize: 15,
								fontWeight: 600,
								cursor: "pointer",
								transition: "background 0.15s",
								minWidth: 140,
							}}
							onMouseEnter={(e) =>
								(e.currentTarget.style.background = C.wineDark)
							}
							onMouseLeave={(e) =>
								(e.currentTarget.style.background = C.wine)
							}
						>
							Contact Us
						</button>
						<button
							style={{
								background: "transparent",
								color: C.taupe,
								border: `1px solid ${C.stone}`,
								borderRadius: 6,
								padding: "12px 32px",
								fontFamily: "'Barlow', sans-serif",
								fontSize: 15,
								fontWeight: 600,
								cursor: "pointer",
								transition: "border-color 0.15s, color 0.15s",
								minWidth: 140,
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.borderColor = C.wine;
								e.currentTarget.style.color = C.cream;
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.borderColor = C.stone;
								e.currentTarget.style.color = C.taupe;
							}}
						>
							Back to StreamFlix
						</button>
					</div>
				</div>
			</main>

			{/* Footer */}
			<footer
				style={{
					borderTop: `1px solid var(--color-stone)`,
					background: C.ink,
					padding: "24px",
				}}
			>
				<div
					style={{
						maxWidth: 1200,
						margin: "0 auto",
						display: "flex",
						flexWrap: "wrap",
						alignItems: "center",
						gap: "12px 24px",
						justifyContent: "space-between",
					}}
				>
					<span
						style={{
							fontFamily: "'Barlow Condensed', sans-serif",
							fontWeight: 800,
							fontSize: 18,
							color: C.wine,
							letterSpacing: "0.04em",
						}}
					>
						STREAMFLIX
					</span>
					<div
						style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px" }}
					>
						{[
							"Terms of Use",
							"Privacy",
							"Help Center",
							"Back to StreamFlix",
						].map((item) => (
							<a
								key={item}
								href="#"
								onClick={(e) => e.preventDefault()}
								style={{
									color: C.taupe,
									fontSize: 13,
									textDecoration: "none",
									transition: "color 0.15s",
								}}
								onMouseEnter={(e) =>
									(e.currentTarget.style.color = C.cream)
								}
								onMouseLeave={(e) =>
									(e.currentTarget.style.color = C.taupe)
								}
							>
								{item}
							</a>
						))}
					</div>
				</div>
			</footer>

			{showModal && <SupportModal onClose={() => setShowModal(false)} />}
		</div>
	);
}
