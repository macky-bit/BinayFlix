import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import styles from "./profileSelect.module.css";
import logoImg from "/favicon.png";

export interface Profile {
	id: number;
	name: string;
	label: string;
	avatar: string;
	avatarPath: string;
	isKids: boolean;
	hasPin: boolean;
	isEntitled: boolean;
}

interface MemberProfileRow {
	member_profile_id: number | string;
	profile_name: string;
	avatar_image: string | null;
	is_kids: boolean;
	has_pin: boolean;
	display_order: number;
	is_entitled: boolean;
}

interface ProfileContextRow {
	max_profiles: number;
	can_add_profile: boolean;
	allows_kids: boolean;
}

interface AvatarOption {
	path: string;
	url: string;
}

const isExternalAvatar = (value: string) => /^(https?:|data:|blob:)/i.test(value);

const initialsFor = (name: string) =>
	name
		.trim()
		.split(/\s+/)
		.map((part) => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase() || "SF";

async function signedAvatarUrls(paths: string[]) {
	const uniquePaths = [...new Set(paths.filter((path) => path && !isExternalAvatar(path)))];
	if (!uniquePaths.length) return new Map<string, string>();

	const { data, error } = await supabase.storage.from("avatar").createSignedUrls(uniquePaths, 60 * 60);
	if (error) return new Map<string, string>();

	return new Map(
		(data ?? [])
			.filter((item) => item.signedUrl)
			.map((item) => [item.path, item.signedUrl]),
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
	onSelect,
}: {
	profile: Profile;
	onSelect: (p: Profile) => void;
}) {
	return (
		<button
			type="button"
			className={`${styles.card} ${!profile.isEntitled ? styles.cardDisabled : ""}`}
			onClick={() => onSelect(profile)}
			disabled={!profile.isEntitled}
			aria-label={
				profile.isEntitled
					? `Continue as ${profile.name}${profile.hasPin ? ", PIN required" : ""}`
					: `${profile.name} is unavailable on the current plan`
			}
		>
			<div className={styles.avatarWrap}>
				<div className={styles.avatarFallback} aria-hidden>
					{initialsFor(profile.name)}
				</div>
				{profile.avatar && (
					<img
						src={profile.avatar}
						alt=""
						className={styles.avatarImg}
						onError={(event) => {
							event.currentTarget.style.display = "none";
						}}
					/>
				)}
			</div>
			<span className={styles.profileName}>{profile.name}</span>
			<span className={styles.profileLabel}>
				{profile.isEntitled ? profile.label : "Unavailable on this plan"}
			</span>
			<span className={styles.editIcon} aria-hidden>{profile.hasPin ? <LockIcon /> : <PencilIcon />}</span>
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

function AddProfileDialog({
	avatars,
	allowsKidsProfiles,
	creating,
	error,
	onCancel,
	onCreate,
}: {
	avatars: AvatarOption[];
	allowsKidsProfiles: boolean;
	creating: boolean;
	error: string;
	onCancel: () => void;
	onCreate: (name: string, avatarPath: string, isKids: boolean) => Promise<void>;
}) {
	const [name, setName] = useState("");
	const [avatarPath, setAvatarPath] = useState(avatars[0]?.path ?? "");
	const [isKids, setIsKids] = useState(false);

	return (
		<div className={styles.dialogBackdrop} role="presentation" onMouseDown={onCancel}>
			<div
				className={styles.dialog}
				role="dialog"
				aria-modal="true"
				aria-labelledby="add-profile-title"
				onMouseDown={(event) => event.stopPropagation()}
			>
				<h2 id="add-profile-title" className={styles.dialogTitle}>Add profile</h2>
				<p className={styles.dialogCopy}>Create a profile for someone who watches on this account.</p>

				<form
					onSubmit={(event) => {
						event.preventDefault();
						void onCreate(name, avatarPath, isKids);
					}}
				>
					<label className={styles.fieldLabel} htmlFor="profile-name">Profile name</label>
					<input
						id="profile-name"
						className={styles.textInput}
						value={name}
						onChange={(event) => setName(event.target.value)}
						maxLength={50}
						autoComplete="off"
						autoFocus
						required
					/>

					<span className={styles.fieldLabel}>Choose an avatar</span>
					{avatars.length ? (
						<div className={styles.avatarOptions}>
							{avatars.map((avatar, index) => (
								<button
									type="button"
									key={avatar.path}
									className={`${styles.avatarOption} ${avatarPath === avatar.path ? styles.avatarOptionSelected : ""}`}
									onClick={() => setAvatarPath(avatar.path)}
									aria-label={`Choose avatar ${index + 1}`}
									aria-pressed={avatarPath === avatar.path}
								>
									<img src={avatar.url} alt="" />
								</button>
							))}
						</div>
					) : (
						<p className={styles.inlineError}>No profile avatars are available.</p>
					)}

					{allowsKidsProfiles && (
						<label className={styles.checkboxLabel}>
							<input type="checkbox" checked={isKids} onChange={(event) => setIsKids(event.target.checked)} />
							Kids profile
						</label>
					)}

					{error && <p className={styles.inlineError} role="alert">{error}</p>}

					<div className={styles.dialogActions}>
						<button type="button" className={styles.secondaryBtn} onClick={onCancel} disabled={creating}>Cancel</button>
						<button type="submit" className={styles.primaryBtn} disabled={creating || !name.trim() || !avatarPath}>
							{creating ? "Creating…" : "Create profile"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

interface VerifyPinRow {
	is_verified: boolean;
	retry_after_seconds: number;
}

function ProfilePinDialog({
	profile,
	onCancel,
	onVerified,
}: {
	profile: Profile;
	onCancel: () => void;
	onVerified: () => void;
}) {
	const [pin, setPin] = useState("");
	const [verifying, setVerifying] = useState(false);
	const [error, setError] = useState("");

	const verify = async () => {
		if (verifying || pin.length !== 4) return;
		setVerifying(true);
		setError("");

		const { data, error: verifyError } = await supabase.rpc(
			"verify_my_member_profile_pin",
			{
				selected_profile_id: profile.id,
				selected_pin: pin,
			},
		);

		setPin("");
		setVerifying(false);
		if (verifyError) {
			setError("The PIN could not be verified. Try again.");
			return;
		}

		const result = ((data ?? [])[0] ?? null) as VerifyPinRow | null;
		if (result?.is_verified) {
			onVerified();
			return;
		}

		if ((result?.retry_after_seconds ?? 0) > 0) {
			const minutes = Math.max(1, Math.ceil(result!.retry_after_seconds / 60));
			setError(`Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`);
			return;
		}

		setError("Incorrect PIN.");
	};

	return (
		<div
			className={styles.dialogBackdrop}
			role="presentation"
			onMouseDown={() => {
				if (!verifying) onCancel();
			}}
		>
			<div
				className={styles.dialog}
				role="dialog"
				aria-modal="true"
				aria-labelledby="profile-pin-title"
				onMouseDown={(event) => event.stopPropagation()}
			>
				<h2 id="profile-pin-title" className={styles.dialogTitle}>Enter profile PIN</h2>
				<p className={styles.dialogCopy}>Enter the four-digit PIN for {profile.name}.</p>

				<form
					onSubmit={(event) => {
						event.preventDefault();
						void verify();
					}}
				>
					<label className={styles.fieldLabel} htmlFor="selected-profile-pin">Profile PIN</label>
					<input
						id="selected-profile-pin"
						className={`${styles.textInput} ${styles.pinInput}`}
						type="password"
						inputMode="numeric"
						pattern="[0-9]{4}"
						autoComplete="current-password"
						maxLength={4}
						value={pin}
						onChange={(event) => {
							setPin(event.target.value.replace(/\D/g, "").slice(0, 4));
							setError("");
						}}
						autoFocus
						required
					/>

					{error && <p className={styles.inlineError} role="alert">{error}</p>}

					<div className={styles.dialogActions}>
						<button type="button" className={styles.secondaryBtn} onClick={onCancel} disabled={verifying}>Cancel</button>
						<button type="submit" className={styles.primaryBtn} disabled={verifying || pin.length !== 4}>
							{verifying ? "Checking…" : "Unlock profile"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

interface Props {
	maxProfiles?: number;
	onSelect: (profile: Profile) => void;
}

export default function ProfileSelectPage({ maxProfiles = 4, onSelect }: Props) {
	const [profiles, setProfiles] = useState<Profile[]>([]);
	const [profileLimit, setProfileLimit] = useState(Math.max(1, maxProfiles));
	const [canAddProfile, setCanAddProfile] = useState(false);
	const [allowsKidsProfiles, setAllowsKidsProfiles] = useState(false);
	const [avatars, setAvatars] = useState<AvatarOption[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState("");
	const [showAddProfile, setShowAddProfile] = useState(false);
	const [creating, setCreating] = useState(false);
	const [createError, setCreateError] = useState("");
	const [lockedProfile, setLockedProfile] = useState<Profile | null>(null);

	const loadProfiles = useCallback(async () => {
		setLoading(true);
		setLoadError("");

		try {
			const [profilesResult, contextResult, avatarListResult] = await Promise.all([
				supabase.rpc("get_my_member_profiles"),
				supabase.rpc("get_my_member_profile_context"),
				supabase.storage.from("avatar").list("", {
					limit: 24,
					sortBy: { column: "name", order: "asc" },
				}),
			]);

			if (profilesResult.error) throw profilesResult.error;
			if (contextResult.error) throw contextResult.error;

			const rows = (profilesResult.data ?? []) as MemberProfileRow[];
			const context = ((contextResult.data ?? [])[0] ?? null) as ProfileContextRow | null;
			const avatarFiles = avatarListResult.error
				? []
				: (avatarListResult.data ?? []).filter((file) => file.id);
			const storedPaths = [
				...rows.map((row) => row.avatar_image ?? ""),
				...avatarFiles.map((file) => file.name),
			];
			const signedUrls = await signedAvatarUrls(storedPaths);

			const loadedProfiles = rows.map((row) => {
				const avatarPath = row.avatar_image?.trim() ?? "";
				return {
					id: Number(row.member_profile_id),
					name: row.profile_name,
					label: row.is_kids ? "Kids profile" : `Profile ${row.display_order}`,
					avatarPath,
					avatar: isExternalAvatar(avatarPath) ? avatarPath : (signedUrls.get(avatarPath) ?? ""),
					isKids: row.is_kids,
					hasPin: row.has_pin,
					isEntitled: row.is_entitled,
				};
			});

			setProfiles(loadedProfiles);
			setProfileLimit(context?.max_profiles ?? Math.max(1, maxProfiles));
			setCanAddProfile(
				context?.can_add_profile ?? loadedProfiles.length < Math.max(1, maxProfiles),
			);
			setAllowsKidsProfiles(context?.allows_kids ?? false);
			setAvatars(
				avatarFiles
					.map((file) => ({ path: file.name, url: signedUrls.get(file.name) ?? "" }))
					.filter((avatar) => avatar.url),
			);
		} catch (error) {
			console.error("Unable to load member profiles", error);
			setLoadError("We couldn't load your profiles. Please try again.");
		} finally {
			setLoading(false);
		}
	}, [maxProfiles]);

	useEffect(() => {
		void loadProfiles();
	}, [loadProfiles]);

	const createProfile = async (name: string, avatarPath: string, isKids: boolean) => {
		if (isKids && !allowsKidsProfiles) {
			setCreateError("Kids profiles require a Standard or Premium plan.");
			return;
		}
		setCreating(true);
		setCreateError("");

		const { error } = await supabase.rpc("create_my_member_profile", {
			selected_profile_name: name.trim(),
			selected_avatar_path: avatarPath,
			selected_is_kids: isKids,
			selected_pin: null,
		});

		if (error) {
			console.error("Unable to create member profile", error);
			setCreateError(error.message || "We couldn't create that profile.");
			setCreating(false);
			return;
		}

		await loadProfiles();
		setCreating(false);
		setShowAddProfile(false);
	};

	const canAdd = canAddProfile && profiles.length < profileLimit;
	const selectProfile = (profile: Profile) => {
		if (!profile.isEntitled) return;
		if (profile.hasPin) {
			setLockedProfile(profile);
			return;
		}
		onSelect(profile);
	};

	return (
		<div className={styles.page}>
			{lockedProfile && (
				<ProfilePinDialog
					profile={lockedProfile}
					onCancel={() => setLockedProfile(null)}
					onVerified={() => {
						const selected = lockedProfile;
						setLockedProfile(null);
						onSelect(selected);
					}}
				/>
			)}
			<div className={styles.bgGlow} aria-hidden />

			<div className={styles.container}>
				<StreamflixLogo />

				<h1 className={styles.heading}>{"Who's watching?"}</h1>
				<p className={styles.subheading}>
					{loading
						? "Loading your profiles…"
						: `Select a profile to continue · ${Math.min(profiles.length, profileLimit)} available · ${profiles.length} total`}
				</p>

				{loadError ? (
					<div className={styles.statePanel} role="alert">
						<p>{loadError}</p>
						<button type="button" className={styles.secondaryBtn} onClick={() => void loadProfiles()}>Try again</button>
					</div>
				) : (
					<div className={styles.profileRow} aria-busy={loading}>
						{profiles.map((profile) => (
							<ProfileCard
								key={profile.id}
								profile={profile}
								onSelect={selectProfile}
							/>
						))}
						{!loading && canAdd && <AddProfileCard onClick={() => { setCreateError(""); setShowAddProfile(true); }} />}
					</div>
				)}

				{!loading && !loadError && !profiles.length && !canAdd && (
					<p className={styles.inlineError}>No active profiles are available for this subscription.</p>
				)}

				<p className={styles.secureNote}>
					<LockIcon />
					Profiles are private and secure.
				</p>
			</div>

			{showAddProfile && (
				<AddProfileDialog
					avatars={avatars}
					allowsKidsProfiles={allowsKidsProfiles}
					creating={creating}
					error={createError}
					onCancel={() => !creating && setShowAddProfile(false)}
					onCreate={createProfile}
				/>
			)}
		</div>
	);
}
