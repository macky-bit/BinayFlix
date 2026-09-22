import { HelpView } from "./components";
import styles from "./help.module.css";

interface Props {
	onBack: () => void;
	onNavigate?: (page: "dashboard" | "account" | "profile") => void;
}

export default function HelpPage({ onBack }: Props) {
	return (
		<div className={styles.moduleShell}>
			<div className={styles.backRow}>
				<button type="button" className={styles.backButton} onClick={onBack}>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
					Back to StreamFlix
				</button>
			</div>
			<HelpView />
		</div>
	);
}
