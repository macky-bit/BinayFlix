import { useEffect, useState } from "react";
import { tmdb, toShow } from "./tmdb";
import type { CatalogKind, CatalogRow, Show, TMDBCatalogData } from "./types";
import { MOCK_CATALOGS } from "./mockData";

type MediaType = "movie" | "tv";
type RawItem = Record<string, unknown> & { media_type?: MediaType };

interface FeedRequest {
  title: string;
  path: string;
  mediaType?: MediaType;
  params?: Record<string, string>;
  top10?: boolean;
  exploreAll?: boolean;
}

const FEEDS: Record<CatalogKind, FeedRequest[]> = {
  home: [
    { title: "Trending Now", path: "/trending/all/week" },
    { title: "New Movies", path: "/movie/now_playing", mediaType: "movie", exploreAll: true },
    { title: "Popular TV Shows", path: "/tv/popular", mediaType: "tv", exploreAll: true },
    { title: "Top 10 Movies Today", path: "/movie/popular", mediaType: "movie", top10: true },
    { title: "Critically Acclaimed Movies", path: "/movie/top_rated", mediaType: "movie" },
    { title: "Critically Acclaimed TV Shows", path: "/tv/top_rated", mediaType: "tv" },
  ],
  movies: [
    { title: "Trending Movies", path: "/trending/movie/week", mediaType: "movie" },
    { title: "Now Playing", path: "/movie/now_playing", mediaType: "movie", exploreAll: true },
    { title: "Top 10 Movies Today", path: "/movie/popular", mediaType: "movie", top10: true },
    { title: "Action & Thriller", path: "/discover/movie", mediaType: "movie", params: { with_genres: "28,53", sort_by: "popularity.desc" } },
    { title: "Drama", path: "/discover/movie", mediaType: "movie", params: { with_genres: "18", sort_by: "popularity.desc" } },
    { title: "Sci-Fi", path: "/discover/movie", mediaType: "movie", params: { with_genres: "878", sort_by: "popularity.desc" } },
    { title: "Horror", path: "/discover/movie", mediaType: "movie", params: { with_genres: "27", sort_by: "popularity.desc" } },
    { title: "Comedy", path: "/discover/movie", mediaType: "movie", params: { with_genres: "35", sort_by: "popularity.desc" } },
    { title: "Top Rated Movies", path: "/movie/top_rated", mediaType: "movie" },
  ],
  tvShows: [
    { title: "Trending TV Shows", path: "/trending/tv/week", mediaType: "tv" },
    { title: "On the Air", path: "/tv/on_the_air", mediaType: "tv", exploreAll: true },
    { title: "Top 10 TV Shows Today", path: "/tv/popular", mediaType: "tv", top10: true },
    { title: "Action & Adventure", path: "/discover/tv", mediaType: "tv", params: { with_genres: "10759", sort_by: "popularity.desc" } },
    { title: "Drama", path: "/discover/tv", mediaType: "tv", params: { with_genres: "18", sort_by: "popularity.desc" } },
    { title: "Sci-Fi & Fantasy", path: "/discover/tv", mediaType: "tv", params: { with_genres: "10765", sort_by: "popularity.desc" } },
    { title: "Mystery", path: "/discover/tv", mediaType: "tv", params: { with_genres: "9648", sort_by: "popularity.desc" } },
    { title: "Comedy", path: "/discover/tv", mediaType: "tv", params: { with_genres: "35", sort_by: "popularity.desc" } },
    { title: "Top Rated TV Shows", path: "/tv/top_rated", mediaType: "tv" },
  ],
  newAndPopular: [
    { title: "Trending Today", path: "/trending/all/day" },
    { title: "Popular This Week", path: "/trending/all/week" },
    { title: "Upcoming Movies", path: "/movie/upcoming", mediaType: "movie", exploreAll: true },
    { title: "TV Shows Airing Now", path: "/tv/on_the_air", mediaType: "tv", exploreAll: true },
    { title: "Popular Movies", path: "/movie/popular", mediaType: "movie" },
    { title: "Popular TV Shows", path: "/tv/popular", mediaType: "tv" },
  ],
};

function mediaTypeFor(item: RawItem, fallback?: MediaType): MediaType {
  return item.media_type === "tv" || item.media_type === "movie"
    ? item.media_type
    : (fallback ?? "movie");
}

function mapFeed(items: RawItem[], fallback?: MediaType, hero = false): Show[] {
  return items
    .map((item) => toShow(item, hero, mediaTypeFor(item, fallback)))
    .filter((show) => Boolean(show.title && show.image))
    .slice(0, 12);
}

const API_KEY = (import.meta.env.VITE_TMDB_API_KEY as string | undefined)?.trim() || undefined;

export function useTMDBCatalog(kind: CatalogKind): TMDBCatalogData {
  const [state, setState] = useState<TMDBCatalogData>({
    featured: null,
    rows: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    // No API key — return mock data immediately so the UI is always populated.
    if (!API_KEY) {
      setState(MOCK_CATALOGS[kind] ?? MOCK_CATALOGS.home);
      return;
    }

    let cancelled = false;

    async function load() {
      setState({ featured: null, rows: [], loading: true, error: null });

      const requests = FEEDS[kind];
      const results = await Promise.all(
        requests.map((feed) => tmdb<RawItem>(feed.path, feed.params)),
      );

      if (cancelled) return;

      const rows: CatalogRow[] = requests
        .map((feed, index) => ({
          title: feed.title,
          shows: mapFeed(results[index], feed.mediaType),
          top10: feed.top10,
          exploreAll: feed.exploreAll,
        }))
        .filter((row) => row.shows.length > 0);

      let heroSource: RawItem | undefined;
      let heroFallback: MediaType | undefined;
      results.some((items, index) => {
        heroSource = items.find((item) =>
          Boolean(item.backdrop_path && item.poster_path),
        );
        heroFallback = requests[index].mediaType;
        return Boolean(heroSource);
      });
      const featured = heroSource
        ? toShow(heroSource, true, mediaTypeFor(heroSource, heroFallback))
        : (rows[0]?.shows[0] ?? null);

      if (!featured || rows.length === 0) {
        // API returned nothing useful — fall back to mock so the UI is still populated.
        if (!cancelled) setState(MOCK_CATALOGS[kind] ?? MOCK_CATALOGS.home);
        return;
      }

      setState({ featured, rows, loading: false, error: null });
    }

    load().catch(() => {
      if (!cancelled) {
        // Network failure — fall back to mock instead of showing an error screen.
        setState(MOCK_CATALOGS[kind] ?? MOCK_CATALOGS.home);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [kind]);

  return state;
}
