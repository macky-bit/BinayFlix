import { useState } from "react";
import type { Show } from "../movie/types";
import { Navbar, type DashboardView } from "./components";
import Home from "./home/Home";
import Movies from "./movies/Movies";
import NewAndPopular from "./newAndPopular/NewAndPopular";
import TvShows from "./tvShows/TvShows";
import MyList from "./myList/MyList";

interface Props {
	onSignOut: () => void;
	onWatch: (show: Show) => void;
	onInfo: (show: Show) => void;
	onNavigate: (page: "account" | "profile" | "help" | "settings") => void;
}

export default function Dashboard({ onSignOut, onWatch, onInfo, onNavigate }: Props) {
	const [searchOpen, setSearchOpen] = useState(false);
	const [view, setView] = useState<DashboardView>("home");

	return (
		<div className="min-h-screen" style={{ background: "var(--color-ink)" }}>
			<Navbar
				activeView={view}
				onSignOut={onSignOut}
				searchOpen={searchOpen}
				setSearchOpen={setSearchOpen}
				onNavigatePage={onNavigate}
				onNavigateView={setView}
			/>

			{view === "home" && <Home onWatch={onWatch} onInfo={onInfo} />}
			{view === "tvShows" && <TvShows onWatch={onWatch} onInfo={onInfo} />}
			{view === "movies" && <Movies onWatch={onWatch} onInfo={onInfo} />}
			{view === "newAndPopular" && <NewAndPopular onWatch={onWatch} onInfo={onInfo} />}
			{view === "myList" && <MyList onBrowse={() => setView("home")} />}
		</div>
	);
}
