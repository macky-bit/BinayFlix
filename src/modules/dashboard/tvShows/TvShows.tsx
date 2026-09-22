import type { Show } from "../../movie/types";
import { useTMDBCatalog } from "../../movie/useTMDB";
import { TvShowsView } from "./components";
import styles from "./tvShows.module.css";

interface Props {
	onWatch: (show: Show) => void;
	onInfo: (show: Show) => void;
}

export default function TvShows({ onWatch, onInfo }: Props) {
	const data = useTMDBCatalog("tvShows");
	return (
		<div className={`min-h-screen ${styles.page}`}>
			<TvShowsView data={data} onWatch={onWatch} onInfo={onInfo} />
		</div>
	);
}
