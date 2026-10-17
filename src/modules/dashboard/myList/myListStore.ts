import { useCallback, useEffect, useState } from "react";
import type { Show } from "../../movie/types";

export type MediaType = "movie" | "tv";
export interface SavedEntry {
	contentId?: number;
	tmdbId?: number | null;
	mediaType: MediaType;
	addedAt: number;
	show?: Show;
}

const KEY = "sf_mylist";
const EVENT = "sf-mylist-change";

export function getMyList(): SavedEntry[] {
	try {
		const value = JSON.parse(localStorage.getItem(KEY) ?? "[]");
		return Array.isArray(value)
			? value.filter((entry) =>
				entry?.contentId != null || entry?.show?.contentId != null ||
				entry?.tmdbId != null || entry?.show?.tmdbId != null)
			: [];
	} catch { return []; }
}

function save(entries: SavedEntry[]) {
	localStorage.setItem(KEY, JSON.stringify(entries));
	window.dispatchEvent(new Event(EVENT));
}

function matches(entry: SavedEntry, show: Show) {
	if (show.contentId != null) {
		return (entry.contentId ?? entry.show?.contentId) === show.contentId;
	}
	if (show.tmdbId != null) {
		return entry.mediaType === (show.mediaType ?? "movie") &&
			(entry.tmdbId ?? entry.show?.tmdbId) === show.tmdbId;
	}
	return false;
}

export const isInMyList = (show: Show) =>
	getMyList().some((entry) => matches(entry, show));

export function addToMyList(
	show: Show,
	addedAt = Date.now(),
) {
	if (!isInMyList(show)) {
		save([
			...getMyList(),
			{
				contentId: show.contentId,
				tmdbId: show.tmdbId,
				mediaType: show.mediaType ?? "movie",
				addedAt,
				show,
			},
		]);
	}
}

export function removeFromMyList(show: Show) {
	save(getMyList().filter((entry) => !matches(entry, show)));
}

export function useMyList() {
	const [entries, setEntries] = useState(getMyList);
	useEffect(() => {
		const refresh = () => setEntries(getMyList());
		window.addEventListener(EVENT, refresh);
		window.addEventListener("storage", refresh);
		return () => { window.removeEventListener(EVENT, refresh); window.removeEventListener("storage", refresh); };
	}, []);
	const toggle = useCallback((show: Show) => {
		if (isInMyList(show)) removeFromMyList(show);
		else addToMyList(show);
	}, []);
	return { entries, toggle, isSaved: (show: Show) => entries.some((entry) => matches(entry, show)) };
}
