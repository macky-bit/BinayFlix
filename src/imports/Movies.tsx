import type { Show } from "../../movie/types";
import { useTMDBCatalog } from "../../movie/useTMDB";
import { MoviesView } from "./components";
import styles from "./movies.module.css";

interface Props {
	onWatch: (show: Show) => void;
	onInfo: (show: Show) => void;
}

export default function Movies({ onWatch, onInfo }: Props) {
	const data = useTMDBCatalog("movies");
	return (
		<div className={`min-h-screen ${styles.page}`}>
			<MoviesView data={data} onWatch={onWatch} onInfo={onInfo} />
		</div>
	);
}
