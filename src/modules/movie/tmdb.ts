import type { Show } from "./types";

// ─── TMDB CONFIG ────────────────────────────────────────────────────────────
// Client-side TMDB key loaded from .env.local. This remains public in the
// browser bundle; use a server proxy if the key must be kept secret.
export const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
export const TMDB_BASE = "https://api.themoviedb.org/3";
export const TMDB_IMG = "https://image.tmdb.org/t/p";

// Map TMDB genre IDs -> names
export const GENRE_MAP: Record<number, string> = {
	28: "Action",
	12: "Adventure",
	16: "Animation",
	35: "Comedy",
	80: "Crime",
	99: "Documentary",
	18: "Drama",
	10751: "Family",
	14: "Fantasy",
	36: "Historical",
	27: "Horror",
	10402: "Music",
	9648: "Mystery",
	10749: "Romance",
	878: "Sci-Fi",
	53: "Thriller",
	10770: "TV Movie",
	37: "Western",
	10759: "Action & Adventure",
	10762: "Kids",
	10763: "News",
	10764: "Reality",
	10765: "Sci-Fi & Fantasy",
	10766: "Soap",
	10767: "Talk",
	10768: "War & Politics",
};

// Fetch helper — always returns [] on error so the UI never crashes
export async function tmdb<T>(
	path: string,
	params: Record<string, string> = {},
): Promise<T[]> {
	try {
		const url = new URL(`${TMDB_BASE}${path}`);
		url.searchParams.set("api_key", TMDB_API_KEY);
		url.searchParams.set("language", "en-US");
		Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
		const res = await fetch(url.toString());
		if (!res.ok) {
			if (res.status !== 401 && res.status !== 403) {
				console.warn(`TMDB ${res.status} on ${path}`);
			}
			throw new Error(`TMDB ${res.status}`);
		}
		const data = await res.json();
		return data.results ?? [];
	} catch (e) {
		return [];
	}
}

async function tmdbOne<T>(path: string): Promise<T | null> {
	try {
		const url = new URL(`${TMDB_BASE}${path}`);
		url.searchParams.set("api_key", TMDB_API_KEY);
		url.searchParams.set("language", "en-US");
		const res = await fetch(url.toString());
		if (!res.ok) throw new Error(`TMDB ${res.status}`);
		return await res.json();
	} catch {
		return null;
	}
}

export async function fetchShowDetails(id: number, mediaType: "movie" | "tv" = "movie"): Promise<Show | null> {
	const data = await tmdbOne<any>(`/${mediaType}/${id}`);
	if (!data) return null;
	const show = toShow(data, false, mediaType);
	show.duration = mediaType === "movie" && data.runtime
		? `${Math.floor(data.runtime / 60)}h ${data.runtime % 60}m`
		: mediaType === "tv" && data.number_of_seasons
			? `${data.number_of_seasons} season${data.number_of_seasons === 1 ? "" : "s"}`
			: "";
	return show;
}

export interface TMDBEpisode {
	ep: number;
	title: string;
	duration: string;
	thumb: string;
}

export async function fetchTVEpisodes(id: number): Promise<TMDBEpisode[]> {
	const details = await tmdbOne<{
		seasons?: { season_number: number; episode_count: number }[];
	}>(`/tv/${id}`);
	const season = details?.seasons?.find(
		(item) => item.season_number > 0 && item.episode_count > 0,
	);
	if (!season) return [];

	const seasonData = await tmdbOne<{
		episodes?: {
			episode_number: number;
			name?: string;
			runtime?: number;
			still_path?: string | null;
		}[];
	}>(`/tv/${id}/season/${season.season_number}`);

	return (seasonData?.episodes ?? [])
		.map((episode) => ({
			ep: episode.episode_number,
			title: episode.name ?? "",
			duration: episode.runtime ? `${episode.runtime}m` : "",
			thumb: episode.still_path
				? `${TMDB_IMG}/w300${episode.still_path}`
				: "",
		}))
		.filter((episode) => Boolean(episode.title));
}

// Convert a raw TMDB movie/TV item into our Show shape
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toShow(
	item: any,
	isHero = false,
	mediaType: "movie" | "tv" = "movie",
): Show {
	const title = item.title ?? item.name ?? "";
	const year = (item.release_date ?? item.first_air_date ?? "").slice(0, 4);
	const genres = ((item.genre_ids as number[]) ?? [])
		.map((id) => GENRE_MAP[id])
		.filter(Boolean)
		.slice(0, 3) as string[];
	const vote = Math.round((item.vote_average ?? 0) * 10);
	return {
		id: item.id,
		title,
		year,
		rating: "",
		duration: "",
		genres,
		image: item.poster_path ? `${TMDB_IMG}/w342${item.poster_path}` : "",
		hero:
			isHero && item.backdrop_path
				? `${TMDB_IMG}/original${item.backdrop_path}`
				: undefined,
		description: item.overview ?? "",
		match: vote,
		mediaType,
	};
}

/**
 * Fetch the best available YouTube trailer key for a title (falls back to
 * a teaser if no trailer is tagged). Returns null if nothing usable exists.
 */
export async function fetchTrailerKey(
	id: number,
	mediaType: "movie" | "tv" = "movie",
): Promise<string | null> {
	try {
		const url = new URL(`${TMDB_BASE}/${mediaType}/${id}/videos`);
		url.searchParams.set("api_key", TMDB_API_KEY);
		url.searchParams.set("language", "en-US");
		const res = await fetch(url.toString());
		if (!res.ok) throw new Error(`TMDB ${res.status}`);
		const data = await res.json();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const vids: any[] = data.results ?? [];
		const youtube = vids.filter((v) => v.site === "YouTube");
		const trailer =
			youtube.find((v) => v.type === "Trailer") ??
			youtube.find((v) => v.type === "Teaser") ??
			youtube[0];
		return trailer?.key ?? null;
	} catch (e) {
		console.error("TMDB videos fetch error:", e);
		return null;
	}
}

/** Fetch "More Like This" titles for a given show. */
export async function fetchSimilar(
	id: number,
	mediaType: "movie" | "tv" = "movie",
): Promise<Show[]> {
	const raw = await tmdb(`/${mediaType}/${id}/similar`);
	return raw.map((m) => toShow(m, false, mediaType)).slice(0, 8);
}
