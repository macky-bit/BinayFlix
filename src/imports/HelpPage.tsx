import { HelpView } from "./components";
import styles from "./help.module.css";

interface Props {
	onBack: () => void;
	onNavigate?: (page: "dashboard" | "account" | "profile") => void;
}

export default function HelpPage({ onBack }: Props) {
	return (
		<div className={styles.moduleShell}>
			<button
				type="button"
				className={`fixed left-4 top-20 z-[70] ${styles.backButton}`}
				onClick={onBack}
			>
				← Back
			</button>
			<HelpView />
		</div>
	);
}
