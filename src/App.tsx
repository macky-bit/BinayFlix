import { useState } from "react";
import type { Show } from "./modules/movie/types";
import type { Plan } from "./modules/subscription/SubscriptionPage";

import LoginPage from "./modules/login/LoginPage";
import RegisterPage from "./modules/register/RegisterPage";
import SubscriptionPage from "./modules/subscription/SubscriptionPage";
import ProfileSelectPage from "./modules/profileSelect/ProfileSelectPage";
import type { Profile } from "./modules/profileSelect/ProfileSelectPage";
import Dashboard from "./modules/dashboard/Dashboard";
import WatchScreen from "./modules/movie/fixedscreen/movie";
import AccountPage from "./modules/account/AccountPage";
import ProfilePage from "./modules/profile/ProfilePage";
import HelpPage from "./modules/help/HelpPage";
import SettingsPage from "./modules/settings/SettingsPage";
import PreviewModal from "./modules/movie/PreviewModal";

type Page =
	| "login"
	| "register"
	| "subscription"
	| "profileSelect"
	| "dashboard"
	| "watch"
	| "account"
	| "profile"
	| "help"
	| "settings";

export default function App() {
	const [page, setPage] = useState<Page>("login");
	const [plan, setPlan] = useState<Plan | null>(null);
	const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
	const [watchShow, setWatchShow] = useState<Show | null>(null);
	const [previewShow, setPreviewShow] = useState<Show | null>(null);

	const handleWatch = (show: Show) => {
		setWatchShow(show);
		setPreviewShow(null);
		setPage("watch");
	};

	const handleInfo = (show: Show) => {
		setPreviewShow(show);
	};

	return (
		<>
			{page === "login" && (
				<LoginPage onNavigate={(p) => setPage(p)} />
			)}

			{page === "register" && (
				<RegisterPage onNavigate={(p) => setPage(p)} />
			)}

			{page === "subscription" && (
				<SubscriptionPage
					onComplete={() => setPage("profileSelect")}
					onBack={() => setPage("login")}
					onSubscribe={(p) => setPlan(p)}
				/>
			)}

			{page === "profileSelect" && (
				<ProfileSelectPage
					maxProfiles={plan?.MaxUser ?? 1}
					onSelect={(profile) => {
						setActiveProfile(profile);
						setPage("dashboard");
					}}
				/>
			)}

			{page === "dashboard" && (
				<>
					<Dashboard
						onSignOut={() => setPage("login")}
						onWatch={handleWatch}
						onInfo={handleInfo}
						onNavigate={(p) => setPage(p)}
					/>
					{previewShow && (
						<PreviewModal
							show={previewShow}
							onClose={() => setPreviewShow(null)}
							onSelect={setPreviewShow}
							onPlay={(show) => {
								setPreviewShow(null);
								handleWatch(show);
							}}
						/>
					)}
				</>
			)}

			{page === "watch" && watchShow && (
				<WatchScreen
					id={watchShow.id}
					title={watchShow.title}
					year={watchShow.year}
					rating={watchShow.rating}
					match={watchShow.match ?? 0}
					backgroundImage={watchShow.hero ?? watchShow.image}
					isSeries={watchShow.mediaType === "tv"}
					onBack={() => setPage("dashboard")}
				/>
			)}

			{page === "account" && (
				<AccountPage
					onBack={() => setPage("dashboard")}
					plan={plan}
					onPlanChange={(p) => setPlan(p)}
				/>
			)}

			{page === "profile" && (
				<ProfilePage onBack={() => setPage("dashboard")} />
			)}

			{page === "help" && (
				<HelpPage onBack={() => setPage("dashboard")} />
			)}

			{page === "settings" && (
				<SettingsPage onBack={() => setPage("dashboard")} />
			)}
		</>
	);
}
