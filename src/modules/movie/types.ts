export interface Show {
	id: number;
	title: string;
	year: string;
	rating: string;
	duration: string;
	genres: string[];
	image: string;
	hero?: string;
	description?: string;
	match?: number;
	mediaType?: "movie" | "tv";
}

export interface CatalogRow {
	title: string;
	shows: Show[];
	top10?: boolean;
	exploreAll?: boolean;
}

export interface TMDBCatalogData {
	featured: Show | null;
	rows: CatalogRow[];
	loading: boolean;
	error: string | null;
}

export type CatalogKind = "home" | "movies" | "tvShows" | "newAndPopular";
