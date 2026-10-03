import { useState, useEffect, useRef, useCallback } from "react";
import styles from "./myList.module.css";
import { fetchShowDetails } from "../../movie/tmdb";
import type { Show } from "../../movie/types";
import { addToMyList, getMyList, removeFromMyList } from "./myListStore";

// ── Types ────────────────────────────────────────────────────────────────────

type ContentType = "Movie" | "Series";
type SortOption =
	| "Recently Added"
	| "Title A–Z"
	| "Title Z–A"
	| "Release Year: Newest"
	| "Release Year: Oldest";

interface Title {
	id: number;
	title: string;
	type: ContentType;
	year: number;
	rating: string;
	runtime?: string;
	addedAt: number;
	gradient?: string;
	image?: string;
	mediaType?: "movie" | "tv";
	show?: Show;
}

// ── Icons ────────────────────────────────────────────────────────────────────

const InfoIcon = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
		<circle cx="12" cy="12" r="10" />
		<line x1="12" y1="8" x2="12" y2="8" strokeWidth="3" strokeLinecap="round" />
		<line x1="12" y1="12" x2="12" y2="16" strokeLinecap="round" />
	</svg>
);
const CheckIcon = ({ size = 11 }: { size?: number }) => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width={size} height={size}>
		<polyline points="20,6 9,17 4,12" />
	</svg>
);
const ChevronDown = ({ size = 13 }: { size?: number }) => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width={size} height={size}>
		<polyline points="6,9 12,15 18,9" />
	</svg>
);
const CloseIcon = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15">
		<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
	</svg>
);
const XIcon = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
		<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
	</svg>
);
const BookmarkIcon = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32">
		<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
	</svg>
);
const CirclePlayIcon = () => (
	<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
		<circle cx="12" cy="12" r="11" fill="#7C3AED" />
		<polygon points="10,8 17,12 10,16" fill="white" />
	</svg>
);

// ── Tooltip ──────────────────────────────────────────────────────────────────

function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
	const [show, setShow] = useState(false);
	return (
		<div className={styles.tooltipWrap} onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
			{children}
			{show && <div className={styles.tooltipBubble}>{label}</div>}
		</div>
	);
}

// ── Content Card ─────────────────────────────────────────────────────────────

function ContentCard({ item, onRemove, onInfo }: {
	item: Title;
	onRemove: (id: number) => void;
	onInfo: (item: Title) => void;
}) {
	const [hovered, setHovered] = useState(false);
	const [focused, setFocused] = useState(false);
	const active = hovered || focused;

	return (
		<div
			className={styles.cardWrap}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
			onFocus={() => setFocused(true)}
			onBlur={() => setFocused(false)}
			tabIndex={0}
			role="group"
			aria-label={item.title}
			onClick={() => onInfo(item)}
		>
			{/* Thumbnail */}
			<div className={styles.cardThumb}>
				{item.image
					? <img src={item.image} alt={item.title} />
					: <div style={{ width: "100%", height: "100%", background: item.gradient ?? "#1A1030" }} />
				}
				<div className={styles.cardThumbGradient} />

				{/* Type badge */}
				<div className={styles.cardTypeBadge}>{item.type}</div>

				{/* Checked / remove badge */}
				<button
					className={styles.cardRemoveBadge}
					title="Remove from My List"
					onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
					aria-label={`Remove ${item.title} from My List`}
				>
					<CheckIcon />
				</button>

				{/* Hover overlay with actions */}
				{active && (
					<div className={styles.cardHoverOverlay}>
						<Tooltip label="More Info">
							<button className={styles.btnOutline} onClick={(e) => { e.stopPropagation(); onInfo(item); }} aria-label={`More info about ${item.title}`}>
								<InfoIcon />
							</button>
						</Tooltip>
						<Tooltip label="Remove">
							<button className={styles.btnOutline} onClick={(e) => { e.stopPropagation(); onRemove(item.id); }} aria-label={`Remove ${item.title}`}>
								<XIcon />
							</button>
						</Tooltip>
					</div>
				)}
			</div>

			{/* Metadata */}
			<div className={styles.cardMeta}>
				<p className={styles.cardTitle}>{item.title}</p>
				<div className={styles.cardInfo}>
					<span className={styles.cardYear}>{item.year}</span>
					<span className={styles.cardDot}>·</span>
					<span className={styles.cardRating}>{item.rating}</span>
					{item.runtime && (
						<><span className={styles.cardDot}>·</span><span className={styles.cardRuntime}>{item.runtime}</span></>
					)}
				</div>
				{/* Inline action buttons */}
				<div className={styles.cardActions} onClick={(e) => e.stopPropagation()}>
					<button
						className={styles.cardActionList}
						aria-label="Remove from list"
						onClick={() => onRemove(item.id)}
					>
						✓
					</button>
				</div>
			</div>
		</div>
	);
}

// ── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard() {
	return (
		<div style={{ borderRadius: 12, overflow: "hidden", background: "#1A1030" }}>
			<div className={styles.skeleton} style={{ aspectRatio: "16/10" }} />
			<div style={{ padding: "10px 12px 12px" }}>
				<div className={styles.skeleton} style={{ height: 11, borderRadius: 3, marginBottom: 7, width: "72%" }} />
				<div className={styles.skeleton} style={{ height: 9, borderRadius: 3, width: "48%" }} />
			</div>
		</div>
	);
}

// ── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, action, onAction, onDismiss }: {
	message: string;
	action: string;
	onAction: () => void;
	onDismiss: () => void;
}) {
	useEffect(() => {
		const t = setTimeout(onDismiss, 5000);
		return () => clearTimeout(t);
	}, [onDismiss]);

	return (
		<div className={styles.toast} role="status" aria-live="polite">
			<span className={styles.toastText}>{message}</span>
			<button className={styles.toastUndo} onClick={onAction}>{action}</button>
			<button className={styles.toastDismiss} onClick={onDismiss} aria-label="Dismiss"><CloseIcon /></button>
		</div>
	);
}

// ── Sort Dropdown ─────────────────────────────────────────────────────────────

const SORT_OPTIONS: SortOption[] = [
	"Recently Added", "Title A–Z", "Title Z–A", "Release Year: Newest", "Release Year: Oldest",
];

function SortDropdown({ value, onChange }: { value: SortOption; onChange: (v: SortOption) => void }) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function handler(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
		function handleKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
		document.addEventListener("mousedown", handler);
		document.addEventListener("keydown", handleKey);
		return () => { document.removeEventListener("mousedown", handler); document.removeEventListener("keydown", handleKey); };
	}, []);

	return (
		<div ref={ref} style={{ position: "relative" }}>
			<button
				className={styles.sortTrigger}
				onClick={() => setOpen((v) => !v)}
				aria-expanded={open}
				aria-haspopup="listbox"
			>
				<span className={styles.sortLabel}>Sort:</span>
				{value}
				<ChevronDown />
			</button>
			{open && (
				<div className={styles.dropdown} style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", width: 230, zIndex: 50 }} role="listbox">
					{SORT_OPTIONS.map((opt) => (
						<button
							key={opt}
							role="option"
							aria-selected={opt === value}
							className={`${styles.dropdownOption} ${opt === value ? styles.dropdownOptionActive : styles.dropdownOptionInactive}`}
							onClick={() => { onChange(opt); setOpen(false); }}
						>
							{opt}
						</button>
					))}
				</div>
			)}
		</div>
	);
}

// ── Sorting logic ─────────────────────────────────────────────────────────────

function sortTitles(titles: Title[], sort: SortOption): Title[] {
	const arr = [...titles];
	switch (sort) {
		case "Recently Added": return arr.sort((a, b) => b.addedAt - a.addedAt);
		case "Title A–Z": return arr.sort((a, b) => a.title.localeCompare(b.title));
		case "Title Z–A": return arr.sort((a, b) => b.title.localeCompare(a.title));
		case "Release Year: Newest": return arr.sort((a, b) => b.year - a.year);
		case "Release Year: Oldest": return arr.sort((a, b) => a.year - b.year);
		default: return arr;
	}
}

// ── Main View ─────────────────────────────────────────────────────────────────

type AppState = "loading" | "loaded" | "error";
type FilterType = "All" | "Movie" | "Series";

function titleToShow(item: Title): Show {
	if (item.show) return item.show;

	return {
		id: item.id,
		title: item.title,
		year: item.year ? String(item.year) : "",
		rating: item.rating,
		duration: item.runtime ?? "",
		genres: [],
		image: item.image ?? "",
		mediaType: item.mediaType ?? (item.type === "Series" ? "tv" : "movie"),
	};
}

export function MyListView({
	onBrowse,
	onInfo,
}: {
	onBrowse: () => void;
	onInfo: (show: Show) => void;
}) {
	const [appState, setAppState] = useState<AppState>("loading");
	const [titles, setTitles] = useState<Title[]>([]);
	const [sortOption, setSortOption] = useState<SortOption>("Recently Added");
	const [filter, setFilter] = useState<FilterType>("All");
	const [toast, setToast] = useState<{ item: Title } | null>(null);

	const loadEntries = useCallback(() => {
		let active = true;
		const entries = getMyList();
		if (entries.length === 0) { setTitles([]); setAppState("loaded"); return () => { active = false; }; }
		setAppState("loading");
		Promise.all(entries.map(async (entry) => {
			const show = await fetchShowDetails(entry.id, entry.mediaType) ?? entry.show ?? null;
			return show
				? { id: show.id, title: show.title, type: entry.mediaType === "tv" ? "Series" as const : "Movie" as const, year: Number(show.year) || 0, rating: show.rating, runtime: show.duration, addedAt: entry.addedAt, image: show.image, mediaType: entry.mediaType, show }
				: null;
		})).then((items) => {
			if (!active) return;
			setTitles(items.flatMap((item) => item ? [item] : []));
			setAppState("loaded");
		}).catch(() => active && setAppState("error"));
		return () => { active = false; };
	}, []);

	useEffect(() => {
		const cleanup = loadEntries();
		const refresh = () => loadEntries();
		window.addEventListener("sf-mylist-change", refresh);
		window.addEventListener("storage", refresh);
		return () => {
			cleanup?.();
			window.removeEventListener("sf-mylist-change", refresh);
			window.removeEventListener("storage", refresh);
		};
	}, [loadEntries]);

	const sorted = sortTitles(
		filter === "All" ? titles : titles.filter((t) => t.type === filter),
		sortOption,
	);

	const handleRemove = useCallback((id: number) => {
		const item = titles.find((t) => t.id === id);
		if (!item) return;
		removeFromMyList(item.id, item.mediaType ?? (item.type === "Series" ? "tv" : "movie"));
		setTitles((prev) => prev.filter((t) => t.id !== id));
		setToast({ item });
	}, [titles]);

	const handleUndo = useCallback(() => {
		if (!toast) return;
		addToMyList(
			toast.item.id,
			toast.item.mediaType ?? (toast.item.type === "Series" ? "tv" : "movie"),
			toast.item.addedAt,
			titleToShow(toast.item),
		);
		setTitles((prev) => {
			if (prev.find((t) => t.id === toast.item.id)) return prev;
			return sortTitles([...prev, toast.item], sortOption);
		});
		setToast(null);
	}, [toast, sortOption]);

	const handleInfo = useCallback((item: Title) => onInfo(titleToShow(item)), [onInfo]);

	return (
		<div className={styles.page}>
			<div id="sr-announce" aria-live="assertive" aria-atomic="true" style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", border: 0 }} />
			<main className={styles.main}>

				{/* ── Loading ── */}
				{appState === "loading" && (
					<>
						<div className={styles.skeleton} style={{ height: 48, width: 200, marginBottom: 10, borderRadius: 6 }} />
						<div className={styles.skeleton} style={{ height: 14, width: 300, marginBottom: 36, borderRadius: 4 }} />
						<div className={styles.cardGrid}>
							{Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
						</div>
					</>
				)}

				{/* ── Error ── */}
				{appState === "error" && (
					<div style={{ textAlign: "center", paddingTop: 80 }}>
						<h1 className={`${styles.display} ${styles.heading}`} style={{ marginBottom: 12 }}>{"Couldn't load My List."}</h1>
						<p className={styles.subHeading} style={{ marginBottom: 24 }}>Please try again.</p>
						<button className={styles.browseBtn} onClick={() => setAppState("loading")}>Try Again</button>
					</div>
				)}

				{/* ── Loaded ── */}
				{appState === "loaded" && (
					<>
						{/* Page header */}
						<div className={styles.pageHeader}>
							<div>
								<h1 className={`${styles.display} ${styles.heading}`}>My List</h1>
								<p className={styles.subHeading}>Your saved movies and series, all in one place.</p>
							</div>
							<div className={styles.countBadge}>
								{titles.length} {titles.length === 1 ? "title" : "titles"}
							</div>
						</div>

						{/* Toolbar */}
						<div className={styles.toolbar}>
							{/* Filter pills */}
							<div className={styles.filterRow}>
								<span className={styles.filterLabel}>Filter</span>
								{(["All", "Movie", "Series"] as FilterType[]).map((f) => (
									<button
										key={f}
										className={f === filter ? styles.filterPillActive : styles.filterPillInactive}
										onClick={() => setFilter(f)}
									>
										{f}
									</button>
								))}
							</div>
							<SortDropdown value={sortOption} onChange={setSortOption} />
						</div>

						{/* Empty state */}
						{sorted.length === 0 ? (
							<div className={styles.emptyState}>
								<div className={styles.emptyIconWrap}><BookmarkIcon /></div>
								<h2 className={`${styles.display} ${styles.emptyTitle}`}>
									{titles.length === 0 ? "Your list is empty." : "No matches."}
								</h2>
								<p className={styles.emptyText}>
									{titles.length === 0
										? "Browse StreamFlix and add movies and shows to keep them here."
										: "Try a different filter."}
								</p>
								{titles.length === 0 && (
									<button className={styles.browseBtn} onClick={onBrowse}>
										<CirclePlayIcon /> Browse StreamFlix
									</button>
								)}
							</div>
						) : (
							<>
								{/* Section header matching dashboard rows */}
								<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
									<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
										<CirclePlayIcon />
										<span style={{ color: "#ffffff", fontWeight: 700, fontSize: "1rem" }}>
											{filter === "All" ? "All Titles" : filter === "Movie" ? "Movies" : "Series"}
										</span>
									</div>
									<span style={{ color: "#9CA3AF", fontSize: "0.75rem" }}>{sorted.length} {sorted.length === 1 ? "title" : "titles"}</span>
								</div>

								<div className={styles.cardGrid} role="list" aria-label="My List">
									{sorted.map((item) => (
										<div key={item.id} role="listitem">
											<ContentCard item={item} onRemove={handleRemove} onInfo={handleInfo} />
										</div>
									))}
								</div>
							</>
						)}
					</>
				)}
			</main>

			{toast && <Toast message="Removed from My List." action="Undo" onAction={handleUndo} onDismiss={() => setToast(null)} />}
		</div>
	);
}
