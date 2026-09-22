import { ProfileView } from "./components";
import styles from "./profile.module.css";

interface Props {
	onBack: () => void;
	onNavigate?: (page: "dashboard" | "account" | "help") => void;
}

export default function ProfilePage({ onBack }: Props) {
	return (
		<div className={styles.moduleShell}>
			<div className={styles.backRow}>
				<button type="button" className={styles.backButton} onClick={onBack}>
					← Back to StreamFlix
				</button>
			</div>
			<ProfileView />
		</div>
	);
}
