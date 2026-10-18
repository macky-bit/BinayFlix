import { useState, useEffect, useRef, useCallback } from "react";
import styles from "./myList.module.css";
import type { Show } from "../../movie/types";
import { useSupabaseCatalog } from "../../movie/useSupabaseCatalog";
import { TrendingCard } from "../components";
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
const BookmarkIcon = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32">
		<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
	</svg>
);
const CirclePlayIcon = () => (
	<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
		<polygon points="10,8 17,12 10,16" fill="white" />
	</svg>
);

// ── Content Card ─────────────────────────────────────────────────────────────

function ContentCard({ item, onRemove, onInfo, onPlay }: {
	item: Title;
	onRemove: (id: number) => void;
	onInfo: (item: Title) => void;
	onPlay: (show: Show) => void;
}) {
	return (
		<div className={styles.posterItem}>
			<TrendingCard show={item.show ?? titleToShow(item)} onInfo={() => onInfo(item)} onPlay={onPlay} onListToggle={() => onRemove(item.id)} />
			<button type="button" className={styles.posterRemove} title="Remove from My List" aria-label={`Remove ${item.title} from My List`} onClick={() => onRemove(item.id)}>
				<CloseIcon />
			</button>
		</div>
	);
}

// ── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard() {
	return (
		<div className={`${styles.skeleton} ${styles.posterSkeleton}`} aria-hidden="true" />
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
	onPlay,
}: {
	onBrowse: () => void;
	onInfo: (show: Show) => void;
	onPlay: (show: Show) => void;
}) {
	const [appState, setAppState] = useState<AppState>("loading");
	const [titles, setTitles] = useState<Title[]>([]);
	const [sortOption, setSortOption] = useState<SortOption>("Recently Added");
	const [filter, setFilter] = useState<FilterType>("All");
	const [toast, setToast] = useState<{ item: Title } | null>(null);
	const catalog = useSupabaseCatalog("home");

	const loadEntries = useCallback(() => {
		const entries = getMyList();
		if (entries.length === 0) { setTitles([]); setAppState("loaded"); return; }
		if (catalog.loading) { setAppState("loading"); return; }
		if (catalog.error) { setAppState("error"); return; }
		const catalogShows = catalog.rows.find((row) => row.title === "All Content")?.shows ?? [];
		const items = entries.flatMap((entry) => {
			const show = catalogShows.find((candidate) =>
				entry.show?.contentId != null
					? candidate.contentId === entry.show.contentId
					: candidate.id === entry.id && candidate.mediaType === entry.mediaType,
			);
			return show ? [{ id: show.id, title: show.title, type: entry.mediaType === "tv" ? "Series" as const : "Movie" as const, year: Number(show.year) || 0, rating: show.rating, runtime: show.duration, addedAt: entry.addedAt, image: show.image, mediaType: entry.mediaType, show }] : [];
		});
		setTitles(items);
		setAppState("loaded");
	}, [catalog.loading, catalog.error, catalog.rows]);

	useEffect(() => {
		loadEntries();
		const refresh = () => loadEntries();
		window.addEventListener("sf-mylist-change", refresh);
		window.addEventListener("storage", refresh);
		return () => {
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
										<span style={{ color: "#ffffff", fontWeight: 700, fontSize: "1rem" }}>
											{filter === "All" ? "All Titles" : filter === "Movie" ? "Movies" : "Series"}
										</span>
									</div>
									<span style={{ color: "#9CA3AF", fontSize: "0.75rem" }}>{sorted.length} {sorted.length === 1 ? "title" : "titles"}</span>
								</div>

								<div className={styles.cardGrid} role="list" aria-label="My List">
									{sorted.map((item) => (
										<div key={item.id} role="listitem">
											<ContentCard item={item} onRemove={handleRemove} onInfo={handleInfo} onPlay={onPlay} />
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
