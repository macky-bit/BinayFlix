import { useCallback, useEffect, useState } from "react";
import type { Show } from "../movie/types";

export interface ContinueEntry {
	show: Show;
	progress: number;     // 0–100
	episodeLabel?: string;
	updatedAt: number;
}

const KEY = "sf_continue_watching";
const EVENT = "sf-continue-change";

function load(): ContinueEntry[] {
	try {
		const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
		return Array.isArray(v) ? v : [];
	} catch { return []; }
}

function persist(entries: ContinueEntry[]) {
	localStorage.setItem(KEY, JSON.stringify(entries));
	window.dispatchEvent(new Event(EVENT));
}

export function addOrUpdateContinue(show: Show, progress: number, episodeLabel?: string) {
	const entries = load().filter((e) => !(e.show.id === show.id && e.show.mediaType === show.mediaType));
	persist([{ show, progress, episodeLabel, updatedAt: Date.now() }, ...entries]);
}

export function removeContinue(id: number, mediaType: Show["mediaType"]) {
	persist(load().filter((e) => !(e.show.id === id && e.show.mediaType === mediaType)));
}

export function useContinueWatching() {
	const [entries, setEntries] = useState<ContinueEntry[]>(load);

	useEffect(() => {
		const refresh = () => setEntries(load());
		window.addEventListener(EVENT, refresh);
		window.addEventListener("storage", refresh);
		return () => {
			window.removeEventListener(EVENT, refresh);
			window.removeEventListener("storage", refresh);
		};
	}, []);

	const markWatched = useCallback((show: Show, progress: number, episodeLabel?: string) => {
		addOrUpdateContinue(show, progress, episodeLabel);
	}, []);

	const remove = useCallback((id: number, mediaType: Show["mediaType"]) => {
		removeContinue(id, mediaType);
	}, []);

	// Sorted most-recent first, cap at 10
	const sorted = [...entries].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 10);

	return { entries: sorted, markWatched, remove };
}

// Seed some demo data so the row isn't empty on first load
export function seedContinueWatching(shows: Show[]) {
	if (load().length > 0 || shows.length === 0) return;
	const demos = shows.slice(0, 5).map((show, i) => ({
		show,
		progress: [35, 62, 18, 80, 47][i] ?? 50,
		episodeLabel: show.mediaType === "tv" ? `S1 E${i + 1}` : undefined,
		updatedAt: Date.now() - i * 60_000,
	}));
	persist(demos);
}
