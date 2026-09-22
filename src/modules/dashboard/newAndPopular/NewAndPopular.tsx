import type { Show } from "../../movie/types";
import { useTMDBCatalog } from "../../movie/useTMDB";
import { NewAndPopularView } from "./components";
import styles from "./newAndPopular.module.css";

interface Props {
	onWatch: (show: Show) => void;
	onInfo: (show: Show) => void;
}

export default function NewAndPopular({ onWatch, onInfo }: Props) {
	const data = useTMDBCatalog("newAndPopular");
	return (
		<div className={`min-h-screen ${styles.page}`}>
			<NewAndPopularView data={data} onWatch={onWatch} onInfo={onInfo} />
		</div>
	);
}
