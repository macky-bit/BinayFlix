import { useState } from "react";
import { LOGO_SVG, Field, PasswordField, PromoStats, SocialButtons } from "../auth/AuthUI";
import styles from "../auth/auth.module.css";

export default function RegisterPage({
	onNavigate,
}: {
	onNavigate: (p: "login" | "subscription") => void;
}) {
	const [form, setForm] = useState({
		firstName: "",
		lastName: "",
		dob: "",
		username: "",
		email: "",
		password: "",
	});
	const [agreed, setAgreed] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});

	const set = (key: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [key]: v }));

	const validate = () => {
		const e: Record<string, string> = {};
		if (!form.firstName.trim()) e.firstName = "Required.";
		if (!form.lastName.trim()) e.lastName = "Required.";
		if (!form.dob) e.dob = "Required.";
		if (!form.username.trim()) e.username = "Required.";
		if (!form.email.trim()) e.email = "Required.";
		else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email.";
		if (!form.password) e.password = "Required.";
		else if (form.password.length < 8) e.password = "At least 8 characters.";
		if (!agreed) e.terms = "You must agree to continue.";
		setErrors(e);
		return Object.keys(e).length === 0;
	};

	const handleSubmit = (ev: React.FormEvent) => {
		ev.preventDefault();
		if (validate()) onNavigate("subscription");
	};

	return (
		<div className={`flex min-h-screen w-full ${styles.page}`}>
			{/* ── LEFT: Cinematic section ── */}
			<div className="relative hidden lg:flex lg:w-[60%] flex-col justify-end overflow-hidden">
				<div className={`absolute inset-0 ${styles.cinemaBg}`} />
				<div className={`absolute inset-0 ${styles.overlayBase}`} />
				<div className={`absolute inset-0 ${styles.overlayWine}`} />
				<div className={`absolute inset-0 ${styles.overlayRadial}`} />

				<div className="relative z-10 px-14 pb-16 max-w-[560px]">
					<p className={`text-[11px] uppercase tracking-[0.22em] mb-6 ${styles.eyebrow}`}>
						Premium Streaming
					</p>

					<div className={`leading-none mb-6 ${styles.headline}`}>
						<div className={`text-[72px] xl:text-[80px] uppercase ${styles.headlineCream}`}>UNLIMITED</div>
						<div className={`text-[72px] xl:text-[80px] uppercase ${styles.headlineTaupe}`}>MOVIES,</div>
						<div className={`text-[72px] xl:text-[80px] uppercase ${styles.headlineCream}`}>TV SHOWS,</div>
						<div className={`text-[72px] xl:text-[80px] uppercase ${styles.headlineTaupe}`}>AND MORE.</div>
					</div>

					<p className={`text-sm leading-relaxed mb-10 max-w-[420px] ${styles.promoText}`}>
						Create your account and start streaming thousands of titles anytime, anywhere — in stunning quality.
					</p>

					<PromoStats />
				</div>
			</div>

			{/* Divider */}
			<div className={`hidden lg:block w-px self-stretch ${styles.divider}`} />

			{/* ── RIGHT: Registration form ── */}
			<div className={`flex-1 lg:w-[40%] flex flex-col overflow-y-auto ${styles.page}`}>
				<div className="lg:hidden absolute inset-0 pointer-events-none">
					<div className={`absolute inset-0 ${styles.mobileOverlay}`} />
				</div>

				<div className="relative z-10 flex flex-col h-full px-6 sm:px-10 xl:px-14 py-10">
					<div className="mb-10">{LOGO_SVG}</div>

					<div className="mb-8">
						<h1 className={`text-4xl sm:text-5xl xl:text-[52px] uppercase leading-none tracking-tight mb-2 ${styles.formTitle}`}>
							Account
						</h1>
						<p className={`text-sm ${styles.formSubtitle}`}>
							Join{" "}
							<span className={`font-semibold ${styles.brandHighlight}`}>STREAMFLIX</span>{" "}
							and enjoy unlimited entertainment.
						</p>
					</div>

					<form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
						<div className="grid grid-cols-2 gap-4">
							<Field label="First Name" placeholder="First name" value={form.firstName} onChange={set("firstName")} error={errors.firstName} />
							<Field label="Last Name" placeholder="Last name" value={form.lastName} onChange={set("lastName")} error={errors.lastName} />
						</div>
						<Field label="Date of Birth" type="date" placeholder="MM/DD/YYYY" value={form.dob} onChange={set("dob")} error={errors.dob} />
						<Field label="Username" placeholder="Choose a username" value={form.username} onChange={set("username")} error={errors.username} />
						<Field label="Email Address" type="email" placeholder="Enter your email" value={form.email} onChange={set("email")} error={errors.email} />
						<PasswordField label="Password" placeholder="Create a strong password" value={form.password} onChange={set("password")} error={errors.password} />

						<div className="flex flex-col gap-1">
							<label className="flex items-start gap-2.5 cursor-pointer select-none">
								<input
									type="checkbox"
									checked={agreed}
									onChange={(e) => setAgreed(e.target.checked)}
									className="mt-0.5 w-4 h-4 shrink-0 accent-[var(--color-wine)] rounded"
								/>
								<span className={`text-xs leading-relaxed ${styles.checkboxLabel}`}>
									I agree to the{" "}
									<button type="button" className="underline hover:text-[var(--color-cream)] transition-colors">Terms of Service</button>
									{" "}and{" "}
									<button type="button" className="underline hover:text-[var(--color-cream)] transition-colors">Privacy Policy</button>.
								</span>
							</label>
							{errors.terms && <p className={`text-[11px] pl-6 ${styles.errorText}`}>{errors.terms}</p>}
						</div>

						<button
							type="submit"
							className={`w-full py-3 text-sm font-bold uppercase tracking-[0.15em] transition-all duration-150 active:scale-[0.99] ${styles.submitBtn}`}
						>
							Create Account
						</button>
					</form>

					<div className="flex items-center gap-3 my-5">
						<div className={`flex-1 h-px ${styles.orDivider}`} />
						<span className={`text-xs uppercase tracking-widest ${styles.orText}`}>or</span>
						<div className={`flex-1 h-px ${styles.orDivider}`} />
					</div>

					<SocialButtons />

					<p className={`mt-6 text-center text-sm ${styles.footerText}`}>
						Already have an account?{" "}
						<button
							type="button"
							onClick={() => onNavigate("login")}
							className={`transition-colors ${styles.footerLink}`}
						>
							Sign In
						</button>
					</p>
				</div>
			</div>
		</div>
	);
}
