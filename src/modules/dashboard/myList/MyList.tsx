import { MyListView } from "./components";

interface Props {
	onBrowse: () => void;
}

export default function MyList({ onBrowse }: Props) {
	return <MyListView onBrowse={onBrowse} />;
}
