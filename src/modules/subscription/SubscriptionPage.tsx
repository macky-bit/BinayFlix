import { useState, useEffect, useRef, useCallback } from "react";
import styles from "./subscription.module.css";

// ── Plan data ─────────────────────────────────────────────────────────────────
export type Plan = {
	id: string;
	PlanName: string;
	MonthlyPrice: string;
	PlanDescription: string;
	MaxUser: number;
	features: string[];
	recommended?: boolean;
};

const PLANS: Plan[] = [
	{
		id: "basic",
		PlanName: "Basic",
		MonthlyPrice: "₱149",
		PlanDescription: "Great for casual viewers.",
		MaxUser: 1,
		features: [
			"Watch on 1 device at a time",
			"HD (720p) quality",
			"Download on 1 device",
			"Access to all available content",
		],
	},
	{
		id: "standard",
		PlanName: "Standard",
		MonthlyPrice: "₱249",
		PlanDescription: "The perfect balance of quality and value.",
		MaxUser: 2,
		recommended: true,
		features: [
			"Watch on 2 devices at a time",
			"Full HD (1080p) quality",
			"Download on 2 devices",
			"Access to all available content",
		],
	},
	{
		id: "premium",
		PlanName: "Premium",
		MonthlyPrice: "₱349",
		PlanDescription: "The ultimate streaming experience.",
		MaxUser: 4,
		features: [
			"Watch on 4 devices at a time",
			"4K (UHD) + HDR quality",
			"Download on 4 devices",
			"Access to all available content",
		],
	},
];

// ── Icons ─────────────────────────────────────────────────────────────────────
function IconCheck({ size = 14, color = "#7C3AED" }: { size?: number; color?: string }) {
	return (
		<svg viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
			<polyline points="2,8 6,13 14,3" />
		</svg>
	);
}

function IconX({ className = "" }: { className?: string }) {
	return (
		<svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width={16} height={16}>
			<line x1="3" y1="3" x2="13" y2="13" /><line x1="13" y1="3" x2="3" y2="13" />
		</svg>
	);
}

function IconDevices() {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width={28} height={28}>
			<rect x="2" y="7" width="14" height="10" rx="1" />
			<path d="M16 10h4a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-4" />
			<line x1="8" y1="17" x2="8" y2="20" />
			<line x1="5" y1="20" x2="11" y2="20" />
		</svg>
	);
}

function IconShield() {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width={28} height={28}>
			<path d="M12 2l7 3.5v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V5.5L12 2z" />
			<polyline points="9,12 11,14 15,10" />
		</svg>
	);
}

function IconHeadset() {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width={28} height={28}>
			<path d="M3 12a9 9 0 1 1 18 0" />
			<rect x="2" y="12" width="4" height="6" rx="1" />
			<rect x="18" y="12" width="4" height="6" rx="1" />
		</svg>
	);
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonCard() {
	return (
		<div className={styles.skeletonCard}>
			<div className={styles.skeletonLine} style={{ height: 22, width: "55%", marginBottom: 10 }} />
			<div className={styles.skeletonLine} style={{ height: 14, width: "80%", marginBottom: 22 }} />
			<div className={styles.skeletonLine} style={{ height: 44, width: "60%", marginBottom: 6 }} />
			<div className={styles.skeletonLine} style={{ height: 14, width: "30%", marginBottom: 28 }} />
			{[80, 90, 70, 85].map((w, i) => (
				<div key={i} className={styles.skeletonLine} style={{ height: 12, width: `${w}%`, marginBottom: 10 }} />
			))}
			<div className={styles.skeletonLine} style={{ height: 44, width: "100%", marginTop: 24, borderRadius: 9999 }} />
		</div>
	);
}

// ── Confirmation modal ────────────────────────────────────────────────────────
function ConfirmModal({ plan, onCancel, onContinue }: {
	plan: Plan;
	onCancel: () => void;
	onContinue: () => void;
}) {
	const [loading, setLoading] = useState(false);
	const [done, setDone] = useState(false);
	const firstFocusRef = useRef<HTMLButtonElement>(null);

	const price = plan.MonthlyPrice;

	useEffect(() => {
		firstFocusRef.current?.focus();
		const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onCancel]);

	async function handleContinue() {
		setLoading(true);
		await new Promise((r) => setTimeout(r, 1200));
		setLoading(false);
		setDone(true);
	}

	return (
		<div
			className={styles.modalBackdrop}
			role="dialog"
			aria-modal="true"
			aria-labelledby="modal-heading"
			id="confirm-modal"
			onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
		>
			<div className={styles.modalBox}>
				<button
					ref={firstFocusRef}
					onClick={onCancel}
					className={styles.modalClose}
					aria-label="Close modal"
				>
					<IconX />
				</button>

				{done ? (
					<div className="text-center py-4">
						<div className={styles.modalSuccessIcon}>
							<IconCheck size={24} color="#fff" />
						</div>
						<h2 id="modal-heading" className={styles.modalTitle}>Plan Selected</h2>
						<p className={styles.modalSubtext}>
							{"You're"} subscribed to the <span style={{ color: "#fff" }}>{plan.PlanName}</span> plan.
						</p>
						<button onClick={onContinue} className={styles.modalPrimaryBtn}>
							Continue to StreamFlix
						</button>
					</div>
				) : (
					<>
						<h2 id="modal-heading" className={styles.modalTitle}>Confirm Your Plan</h2>
						<p className={styles.modalSubtext}>Review your selection before continuing.</p>

						<div className={styles.modalSummary}>
							{[
								["Plan", plan.PlanName],
								["Billing", "Monthly"],
								["Price", `${price} / month`],
								["Max Users", String(plan.MaxUser)],
							].map(([label, value]) => (
								<div key={label} className={styles.modalRow}>
									<span className={styles.modalRowLabel}>{label}</span>
									<span className={styles.modalRowValue}>{value}</span>
								</div>
							))}
						</div>

						<div className={styles.modalActions}>
							<button onClick={onCancel} disabled={loading} className={styles.modalSecondaryBtn}>
								Cancel
							</button>
							<button onClick={handleContinue} disabled={loading} className={styles.modalPrimaryBtn}>
								{loading && (
									<span className={styles.spinner} />
								)}
								{loading ? "Processing…" : `Continue with ${plan.PlanName}`}
							</button>
						</div>
					</>
				)}
			</div>
		</div>
	);
}

// ── Plan Card ─────────────────────────────────────────────────────────────────
function PlanCard({ plan, selected, onChoose, btnRef }: {
	plan: Plan;
	selected: boolean;
	onChoose: (plan: Plan) => void;
	btnRef: React.RefObject<HTMLButtonElement>;
}) {
	const [pressing, setPressing] = useState(false);
	const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
	const [flashing, setFlashing] = useState(false);
	const rippleId = useRef(0);
	const isPopular = plan.recommended;
	const price = plan.MonthlyPrice;

	function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
		const rect = e.currentTarget.getBoundingClientRect();
		const id = ++rippleId.current;
		setRipples((prev) => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
		setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 560);
		setFlashing(true);
		setTimeout(() => setFlashing(false), 420);
		onChoose(plan);
	}

	return (
		<div className={`${styles.card} ${isPopular ? styles.cardPopular : ""} ${selected ? styles.cardSelected : ""} ${flashing ? styles.cardFlash : ""}`}>
			{isPopular && (
				<div className={styles.popularBadge}>Most Popular</div>
			)}

			<div className={styles.cardBody}>
				{/* Name + description */}
				<h3 className={styles.planName}>{plan.PlanName}</h3>
				<p className={styles.planDesc}>{plan.PlanDescription}</p>

				{/* Price */}
				<div className={styles.priceRow}>
					<span className={styles.priceAmount}>{price}</span>
					<span className={styles.pricePer}>/month</span>
				</div>
				{/* Feature list */}
				<ul className={styles.featureList}>
					{plan.features.map((f) => (
						<li key={f} className={styles.featureItem}>
							<span className={styles.featureCheck}>
								<IconCheck size={13} color={isPopular ? "#7C3AED" : "#3BE477"} />
							</span>
							{f}
						</li>
					))}
				</ul>

				{/* CTA button */}
				<button
					ref={btnRef}
					onClick={handleClick}
					onMouseDown={() => setPressing(true)}
					onMouseUp={() => setPressing(false)}
					onMouseLeave={() => setPressing(false)}
					className={`${styles.planBtn} ${isPopular ? styles.planBtnPopular : styles.planBtnOutline}`}
					style={{ transform: pressing ? "scale(0.97)" : "scale(1)" }}
					aria-label={`Get ${plan.PlanName} plan`}
					aria-pressed={selected}
				>
					{ripples.map((r) => (
						<span key={r.id} className={styles.rippleCircle} style={{ left: r.x, top: r.y }} />
					))}
					Get {plan.PlanName}
				</button>
			</div>
		</div>
	);
}

// ── Trust badges ──────────────────────────────────────────────────────────────
function TrustBadges() {
	const items = [
		{ icon: <IconDevices />, title: "Watch Anywhere", sub: "On your favorite devices." },
		{ icon: <IconShield />, title: "Secure & Safe", sub: "Your data is protected." },
		{ icon: <IconHeadset />, title: "24/7 Support", sub: "We're here to help." },
	];
	return (
		<div className={styles.trustRow}>
			{items.map(({ icon, title, sub }) => (
				<div key={title} className={styles.trustItem}>
					<span className={styles.trustIcon}>{icon}</span>
					<div>
						<p className={styles.trustTitle}>{title}</p>
						<p className={styles.trustSub}>{sub}</p>
					</div>
				</div>
			))}
		</div>
	);
}

// ── Main Page ─────────────────────────────────────────────────────────────────
type PageState = "loading" | "error" | "ready";

interface Props {
	onComplete: () => void;
	onBack?: () => void;
	onSubscribe?: (plan: Plan) => void;
}

export default function SubscriptionPage({ onComplete, onBack, onSubscribe }: Props) {
	const [pageState, setPageState] = useState<PageState>("loading");
	const [plans, setPlans] = useState<Plan[]>([]);
	const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
	const [modalPlan, setModalPlan] = useState<Plan | null>(null);
	const btnRefs = useRef<Record<string, React.RefObject<HTMLButtonElement>>>({});

	PLANS.forEach((p) => {
		if (!btnRefs.current[p.id]) {
			btnRefs.current[p.id] = { current: null } as unknown as React.RefObject<HTMLButtonElement>;
		}
	});

	useEffect(() => {
		const t = setTimeout(() => { setPlans(PLANS); setPageState("ready"); }, 900);
		return () => clearTimeout(t);
	}, []);

	function handleChoose(plan: Plan) {
		setSelectedPlan(plan);
		setModalPlan(plan);
	}

	function handleModalClose() {
		const prev = modalPlan;
		setModalPlan(null);
		if (prev) setTimeout(() => btnRefs.current[prev.id]?.current?.focus(), 50);
	}

	const handleRetry = useCallback(() => {
		setPageState("loading");
		setTimeout(() => { setPlans(PLANS); setPageState("ready"); }, 900);
	}, []);

	return (
		<div className={styles.page}>
			{/* Background scene */}
			<div className={styles.heroBg} aria-hidden />

			<main className={styles.main}>
				{/* Header */}
				<header className={styles.header}>
					<h1 className={styles.heading}>
						Choose <span className={styles.headingAccent}>Your Plan</span>
					</h1>
					<p className={styles.headingSub}>Upgrade your experience. Cancel anytime.</p>
				</header>

				{/* Loading */}
				{pageState === "loading" && (
					<div className={styles.cardsGrid}>
						<SkeletonCard /><SkeletonCard /><SkeletonCard />
					</div>
				)}

				{/* Error */}
				{pageState === "error" && (
					<div className={styles.stateCenter}>
						<p className={styles.stateTitle}>{"Couldn't load plans."}</p>
						<p className={styles.stateSub}>Please try again.</p>
						<button className={styles.retryBtn} onClick={handleRetry}>Try Again</button>
					</div>
				)}

				{/* Ready */}
				{pageState === "ready" && (
					<>
						<div className={styles.cardsGrid} role="list" aria-label="Subscription plans">
							{plans.map((plan) => (
								<div key={plan.id} role="listitem">
									<PlanCard
										plan={plan}
										selected={selectedPlan?.id === plan.id}
										onChoose={handleChoose}
										btnRef={btnRefs.current[plan.id] as React.RefObject<HTMLButtonElement>}
									/>
								</div>
							))}
						</div>

						<TrustBadges />

						<p className={styles.footNote}>You can change or cancel your plan anytime from Account settings.</p>

						{onBack && (
							<div style={{ textAlign: "center", marginTop: 12 }}>
								<button className={styles.backLink} onClick={onBack}>Back to StreamFlix</button>
							</div>
						)}
					</>
				)}
			</main>

			{modalPlan && (
				<ConfirmModal
					plan={modalPlan}
					onCancel={handleModalClose}
					onContinue={() => { onSubscribe?.(modalPlan); onComplete(); }}
				/>
			)}
		</div>
	);
}
