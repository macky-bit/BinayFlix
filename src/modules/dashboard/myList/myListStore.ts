import { useCallback, useEffect, useState } from "react";

export type MediaType = "movie" | "tv";
export interface SavedEntry { id: number; mediaType: MediaType; addedAt: number }

const KEY = "sf_mylist";
const EVENT = "sf-mylist-change";

export function getMyList(): SavedEntry[] {
	try {
		const value = JSON.parse(localStorage.getItem(KEY) ?? "[]");
		return Array.isArray(value) ? value : [];
	} catch { return []; }
}

function save(entries: SavedEntry[]) {
	localStorage.setItem(KEY, JSON.stringify(entries));
	window.dispatchEvent(new Event(EVENT));
}

export const isInMyList = (id: number, mediaType: MediaType) =>
	getMyList().some((entry) => entry.id === id && entry.mediaType === mediaType);

export function addToMyList(id: number, mediaType: MediaType, addedAt = Date.now()) {
	if (!isInMyList(id, mediaType)) save([...getMyList(), { id, mediaType, addedAt }]);
}

export function removeFromMyList(id: number, mediaType: MediaType) {
	save(getMyList().filter((entry) => entry.id !== id || entry.mediaType !== mediaType));
}

export function useMyList() {
	const [entries, setEntries] = useState(getMyList);
	useEffect(() => {
		const refresh = () => setEntries(getMyList());
		window.addEventListener(EVENT, refresh);
		window.addEventListener("storage", refresh);
		return () => { window.removeEventListener(EVENT, refresh); window.removeEventListener("storage", refresh); };
	}, []);
	const toggle = useCallback((id: number, mediaType: MediaType) => {
		if (isInMyList(id, mediaType)) removeFromMyList(id, mediaType);
		else addToMyList(id, mediaType);
	}, []);
	return { entries, toggle, isSaved: (id: number, mediaType: MediaType) => entries.some((e) => e.id === id && e.mediaType === mediaType) };
}
