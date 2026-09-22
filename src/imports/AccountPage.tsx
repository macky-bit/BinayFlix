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
					← Back to StreamFlix
				</button>
			</div>
			<AccountView plan={plan} onPlanChange={onPlanChange} />
		</div>
	);
}
