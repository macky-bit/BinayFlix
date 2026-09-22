import type { Show } from "../../movie/types";
import { useTMDBCatalog } from "../../movie/useTMDB";
import { HomeView } from "./components";
import styles from "./home.module.css";

interface Props {
	onWatch: (show: Show) => void;
	onInfo: (show: Show) => void;
}

export default function Home({ onWatch, onInfo }: Props) {
	const data = useTMDBCatalog("home");
	return (
		<div className={`min-h-screen ${styles.page}`}>
			<HomeView data={data} onWatch={onWatch} onInfo={onInfo} />
		</div>
	);
}
