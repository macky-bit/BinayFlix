import { useState } from "react";
import styles from "./profileSelect.module.css";
import logoImg from "/streamflix_logo.png";

export interface Profile {
	id: number;
	name: string;
	label: string;
	avatar: string;
}

const DEFAULT_PROFILES: Profile[] = [
	{
		id: 1,
		name: "Maria Santos",
		label: "Profile 1",
		avatar: "https://images.unsplash.com/photo-1542880941-1abfea46bba6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80",
	},
	{
		id: 2,
		name: "Engels Manzano",
		label: "Profile 2",
		avatar: "https://images.unsplash.com/photo-1670597991538-facc824e7cae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80",
	},
	{
		id: 3,
		name: "Alexa",
		label: "Profile 3",
		avatar: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80",
	},
];

function CheckIcon() {
	return (
		<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
			<polyline points="20 6 9 17 4 12" />
		</svg>
	);
}

function PencilIcon() {
	return (
		<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
			<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
		</svg>
	);
}

function PlayIcon() {
	return (
		<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
			<polygon points="5,3 19,12 5,21" />
		</svg>
	);
}

function LockIcon() {
	return (
		<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
			<path d="M7 11V7a5 5 0 0 1 10 0v4" />
		</svg>
	);
}

function StreamflixLogo() {
	return (
		<div className={styles.logoWrap}>
			<img src={logoImg} alt="" aria-hidden className={styles.logoImg} />
			<svg viewBox="0 0 290 48" className={styles.logoSvg} aria-label="StreamFlix">
				<defs>
					<linearGradient id="sfGradProfile" x1="0%" y1="0%" x2="100%" y2="0%">
						<stop offset="0%" stopColor="#F5A800" />
						<stop offset="55%" stopColor="#C026D3" />
						<stop offset="100%" stopColor="#7C3AED" />
					</linearGradient>
				</defs>
				<text
					x="0"
					y="40"
					fontFamily="var(--font-display), sans-serif"
					fontWeight="900"
					fontSize="44"
					letterSpacing="2"
					fill="url(#sfGradProfile)"
				>
					STREAMFLIX
				</text>
			</svg>
		</div>
	);
}

function ProfileCard({
	profile,
	selected,
	onSelect,
}: {
	profile: Profile;
	selected: boolean;
	onSelect: (p: Profile) => void;
}) {
	return (
		<button
			className={`${styles.card} ${selected ? styles.cardSelected : ""}`}
			onClick={() => onSelect(profile)}
			aria-label={`Select ${profile.name}`}
			aria-pressed={selected}
		>
			<div className={styles.avatarWrap}>
				<img src={profile.avatar} alt={profile.name} className={styles.avatarImg} />
				{selected && (
					<div className={styles.checkBadge}><CheckIcon /></div>
				)}
			</div>
			<span className={styles.profileName}>{profile.name}</span>
			<span className={styles.profileLabel}>{profile.label}</span>
			<span className={styles.editIcon}><PencilIcon /></span>
		</button>
	);
}

function AddProfileCard({ onClick }: { onClick: () => void }) {
	return (
		<button className={styles.addCard} onClick={onClick} aria-label="Add profile">
			<div className={styles.addCircle}>
				<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round">
					<line x1="12" y1="5" x2="12" y2="19" />
					<line x1="5" y1="12" x2="19" y2="12" />
				</svg>
			</div>
			<span className={styles.profileName} style={{ color: "#9CA3AF" }}>Add Profile</span>
		</button>
	);
}

interface Props {
	maxProfiles?: number;
	onSelect: (profile: Profile) => void;
}

export default function ProfileSelectPage({ maxProfiles = 4, onSelect }: Props) {
	const [profiles] = useState<Profile[]>(() =>
		DEFAULT_PROFILES.slice(0, Math.min(maxProfiles, 3))
	);
	const [selected, setSelected] = useState<Profile>(profiles[0]);

	const canAdd = profiles.length < Math.min(maxProfiles, 4);

	return (
		<div className={styles.page}>
			<div className={styles.bgGlow} aria-hidden />

			<div className={styles.container}>
				<StreamflixLogo />

				<h1 className={styles.heading}>{"Who's watching?"}</h1>
				<p className={styles.subheading}>Select a profile to continue.</p>

				<div className={styles.profileRow}>
					{profiles.map((p) => (
						<ProfileCard
							key={p.id}
							profile={p}
							selected={selected.id === p.id}
							onSelect={setSelected}
						/>
					))}
					{canAdd && <AddProfileCard onClick={() => {}} />}
				</div>

				<button className={styles.continueBtn} onClick={() => onSelect(selected)}>
					<PlayIcon />
					Continue as {selected.name}
				</button>

				<p className={styles.secureNote}>
					<LockIcon />
					Profiles are private and secure.
				</p>
			</div>
		</div>
	);
}
