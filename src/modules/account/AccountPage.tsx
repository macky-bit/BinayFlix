import { AccountView } from "./components";
import styles from "./account.module.css";
import type { Plan } from "../subscription/SubscriptionPage";

interface Props {
	onBack: () => void;
	onNavigate?: (page: "dashboard" | "profile" | "help") => void;
	plan: Plan | null;
	onPlanChange: (plan: Plan) => void;
}

export default function AccountPage({ onBack, plan, onPlanChange }: Props) {
	return (
		<div className={styles.moduleShell}>
			<div className={styles.backRow}>
				<button type="button" className={styles.backButton} onClick={onBack}>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
					Back to StreamFlix
				</button>
			</div>
			<AccountView plan={plan} onPlanChange={onPlanChange} />
		</div>
	);
}
