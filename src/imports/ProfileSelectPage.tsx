import { useState } from "react";
import styles from "./profileSelect.module.css";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface Profile {
	id: number;
	name: string;
	colorIndex: number;
}

// ── Avatar colors — four distinct palette gradients ───────────────────────────
const AVATAR_GRADIENTS = [
	["#7C3AED", "#4C1D95"],   // purple
	["#0EA5E9", "#0C4A6E"],   // blue
	["#EC4899", "#831843"],   // pink
	["#F59E0B", "#78350F"],   // amber
];

// ── Default avatar SVG (person silhouette) ────────────────────────────────────
function AvatarSilhouette({ size = 52 }: { size?: number }) {
	return (
		<svg width={size} height={size} viewBox="0 0 52 52" fill="none" aria-hidden>
			<circle cx="26" cy="18" r="11" fill="rgba(255,255,255,0.35)" />
			<path d="M6 50c0-11.046 8.954-20 20-20s20 8.954 20 20" fill="rgba(255,255,255,0.25)" />
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

function UserCircleIcon() {
	return (
		<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
			<circle cx="12" cy="12" r="10" />
			<circle cx="12" cy="9" r="3" />
			<path d="M6.168 18.849A4 4 0 0 1 10 16h4a4 4 0 0 1 3.834 2.855" />
		</svg>
	);
}

function PlusIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
			<line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
		</svg>
	);
}

// ── Profile Card ──────────────────────────────────────────────────────────────
function ProfileCard({
	profile,
	selected,
	onSelect,
}: {
	profile: Profile;
	selected: boolean;
	onSelect: (p: Profile) => void;
}) {
	const [g1, g2] = AVATAR_GRADIENTS[profile.colorIndex % AVATAR_GRADIENTS.length];

	return (
		<button
			className={`${styles.card} ${selected ? styles.cardSelected : ""}`}
			onClick={() => onSelect(profile)}
			aria-label={`Select ${profile.name}`}
			aria-pressed={selected}
		>
			{/* Avatar */}
			<div
				className={styles.avatar}
				style={{ background: `linear-gradient(145deg, ${g1}, ${g2})` }}
			>
				<AvatarSilhouette size={52} />
			</div>

			{/* Name */}
			<span className={styles.profileName}>{profile.name}</span>

			{/* Edit icon */}
			<span className={`${styles.editIcon} ${selected ? styles.editIconSelected : ""}`}>
				<PencilIcon />
			</span>
		</button>
	);
}

// ── Add Profile Card ──────────────────────────────────────────────────────────
function AddProfileBtn({ onClick }: { onClick: () => void }) {
	return (
		<button className={styles.addBtn} onClick={onClick} aria-label="Add profile">
			<PlusIcon /> Add Profile
		</button>
	);
}

// ── Main Page ─────────────────────────────────────────────────────────────────
interface Props {
	maxProfiles: number;
	onSelect: (profile: Profile) => void;
}

export default function ProfileSelectPage({ maxProfiles, onSelect }: Props) {
	const [profiles, setProfiles] = useState<Profile[]>(() =>
		Array.from({ length: Math.min(maxProfiles, 4) }, (_, i) => ({
			id: i + 1,
			name: `Profile ${i + 1}`,
			colorIndex: i,
		})),
	);
	const [selected, setSelected] = useState<Profile>(profiles[0]);

	function handleSelect(profile: Profile) {
		setSelected(profile);
	}

	function handleContinue() {
		onSelect(selected);
	}

	function handleAdd() {
		if (profiles.length >= Math.min(maxProfiles, 4)) return;
		const next: Profile = {
			id: Date.now(),
			name: `Profile ${profiles.length + 1}`,
			colorIndex: profiles.length,
		};
		setProfiles((prev) => [...prev, next]);
	}

	const canAdd = profiles.length < Math.min(maxProfiles, 4);

	return (
		<div className={styles.page}>
			{/* Background glow */}
			<div className={styles.bgGlow} aria-hidden />

			<div className={styles.container}>
				{/* Icon */}
				<div className={styles.topIcon}>
					<UserCircleIcon />
				</div>

				{/* Heading */}
				<h1 className={styles.heading}>
					{"Who's"} <span className={styles.headingAccent}>Watching?</span>
				</h1>
				<p className={styles.subheading}>Select a profile to continue.</p>

				{/* Profile grid */}
				<div className={styles.profileGrid}>
					{profiles.map((profile) => (
						<ProfileCard
							key={profile.id}
							profile={profile}
							selected={selected.id === profile.id}
							onSelect={handleSelect}
						/>
					))}
				</div>

				{/* Add profile */}
				{canAdd && (
					<div className={styles.addRow}>
						<AddProfileBtn onClick={handleAdd} />
					</div>
				)}

				{/* Continue button */}
				<button className={styles.continueBtn} onClick={handleContinue}>
					Continue as {selected.name}
				</button>
			</div>
		</div>
	);
}
