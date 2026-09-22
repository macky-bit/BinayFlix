import { useState } from "react";
import type { Show, TMDBCatalogData } from "../../movie/types";
import {
	Hero,
	CarouselRow,
	GenreFilters,
	Footer,
	GENRES,
	ContinueWatchingRow,
} from "../components";

export interface CatalogViewProps {
	data: TMDBCatalogData;
	onWatch: (show: Show) => void;
	onInfo: (show: Show) => void;
}

export function CatalogView({ data, onWatch, onInfo }: CatalogViewProps) {
	const [genre, setGenre] = useState("All");
	const { rows, loading } = data;

	const allShows = rows.flatMap((r) => r.shows);

	const filteredRows = rows.map((row) => ({
		...row,
		shows:
			genre === "All"
				? row.shows
				: row.shows.filter((s) => s.genres?.includes(genre)),
	}));

	if (loading) {
		return (
			<div className="pt-20 px-4 sm:px-10 xl:px-12">
				{[1, 2, 3].map((i) => (
					<div key={i} className="mb-8">
						<div
							className="h-5 w-40 rounded mb-3"
							style={{ background: "#1A1030" }}
						/>
						<div className="flex gap-3">
							{[1, 2, 3, 4, 5].map((j) => (
								<div
									key={j}
									className="rounded-xl shrink-0"
									style={{
										width: 200,
										height: 120,
										background: "#1A1030",
									}}
								/>
							))}
						</div>
					</div>
				))}
			</div>
		);
	}

	return (
		<div className="pt-20 pb-10 space-y-8">
			<GenreFilters active={genre} setActive={setGenre} genres={GENRES} />
			<ContinueWatchingRow
				onPlay={onWatch}
				onInfo={onInfo}
				seedShows={allShows}
			/>
			{filteredRows.map((row) => (
				<CarouselRow
					key={row.title}
					title={row.title}
					shows={row.shows}
					top10={row.top10}
					onPlay={onWatch}
					onInfo={onInfo}
				/>
			))}
			<Footer />
		</div>
	);
}

export function HomeView({ data, onWatch, onInfo }: CatalogViewProps) {
	const [genre, setGenre] = useState("All");
	const { rows, featured, loading } = data;

	const allShows = rows.flatMap((r) => r.shows);

	const filteredRows = rows.map((row) => ({
		...row,
		shows:
			genre === "All"
				? row.shows
				: row.shows.filter((s) => s.genres?.includes(genre)),
	}));

	if (loading) {
		return (
			<div>
				<div
					style={{ height: "53vh", minHeight: 280, background: "#150D2A" }}
				/>
				<div className="pt-6 px-4 sm:px-10 xl:px-12 space-y-8">
					{[1, 2, 3].map((i) => (
						<div key={i} className="mb-8">
							<div
								className="h-5 w-40 rounded mb-3"
								style={{ background: "#1A1030" }}
							/>
							<div className="flex gap-3">
								{[1, 2, 3, 4, 5].map((j) => (
									<div
										key={j}
										className="rounded-xl shrink-0"
										style={{
											width: 200,
											height: 120,
											background: "#1A1030",
										}}
									/>
								))}
							</div>
						</div>
					))}
				</div>
			</div>
		);
	}

	return (
		<div>
			{featured && (
				<Hero show={featured} onWatch={onWatch} onInfo={onInfo} />
			)}
			<div className="space-y-8 pb-10">
				<GenreFilters active={genre} setActive={setGenre} genres={GENRES} />
				<ContinueWatchingRow
					onPlay={onWatch}
					onInfo={onInfo}
					seedShows={allShows}
				/>
				{filteredRows.map((row) => (
					<CarouselRow
						key={row.title}
						title={row.title}
						shows={row.shows}
						top10={row.top10}
						onPlay={onWatch}
						onInfo={onInfo}
					/>
				))}
				<Footer />
			</div>
		</div>
	);
}
