import { useState } from "react";
import { getSignedInDestination } from "../../lib/auth";
import { setRememberSession, supabase } from "../../lib/supabase";
import { LOGO_SVG, Field, PasswordField, PromoStats, SocialButtons } from "../auth/AuthUI";
import styles from "../auth/auth.module.css";

export default function LoginPage({
	onNavigate,
}: {
	onNavigate: (p: "register" | "subscription" | "profileSelect" | "admin") => void;
}) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [remember, setRemember] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [submitting, setSubmitting] = useState(false);
	const [notice, setNotice] = useState("");

	const validate = () => {
		const e: Record<string, string> = {};
		if (!email.trim()) e.email = "Required.";
		if (!password) e.password = "Required.";
		setErrors(e);
		return Object.keys(e).length === 0;
	};

	const handleSubmit = async (ev: React.FormEvent) => {
		ev.preventDefault();
		if (!validate()) return;

		setSubmitting(true);
		setErrors({});
		setNotice("");
		setRememberSession(remember);
		const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
		if (error) {
			setErrors({ form: error.message });
			setSubmitting(false);
			return;
		}

		try {
			onNavigate(await getSignedInDestination());
		} catch {
			setErrors({ form: "Signed in, but your StreamFlix account could not be loaded. Please try again." });
			setSubmitting(false);
		}
	};

	const handleForgotPassword = async () => {
		const normalizedEmail = email.trim().toLowerCase();
		if (!normalizedEmail || !/\S+@\S+\.\S+/.test(normalizedEmail)) {
			setErrors((current) => ({ ...current, email: "Enter your email first." }));
			return;
		}
		setSubmitting(true);
		setErrors({});
		setNotice("");
		const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
			redirectTo: window.location.origin,
		});
		setSubmitting(false);
		if (error) setErrors({ form: error.message });
		else setNotice("Password reset instructions have been sent to your email.");
	};

	const handleOAuth = async (provider: "google" | "azure") => {
		setSubmitting(true);
		setErrors({});
		setNotice("");
		setRememberSession(remember);
		const { error } = await supabase.auth.signInWithOAuth({
			provider,
			options: { redirectTo: window.location.origin },
		});
		if (error) {
			setErrors({ form: error.message });
			setSubmitting(false);
		}
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
						<div className={`text-[72px] xl:text-[80px] uppercase ${styles.headlineCream}`}>WELCOME</div>
						<div className={`text-[72px] xl:text-[80px] uppercase ${styles.headlineTaupe}`}>BACK TO</div>
						<div className={`text-[72px] xl:text-[80px] uppercase ${styles.headlineCream}`}>YOUR</div>
						<div className={`text-[72px] xl:text-[80px] uppercase ${styles.headlineTaupe}`}>WORLD.</div>
					</div>

					<p className={`text-sm leading-relaxed mb-10 max-w-[420px] ${styles.promoText}`}>
						Sign back in and pick up right where you left off — thousands of titles waiting for you.
					</p>

					<PromoStats />
				</div>
			</div>

			{/* Divider */}
			<div className={`hidden lg:block w-px self-stretch ${styles.divider}`} />

			{/* ── RIGHT: Login form ── */}
			<div className={`flex-1 lg:w-[40%] flex flex-col overflow-y-auto ${styles.page}`}>
				<div className="lg:hidden absolute inset-0 pointer-events-none">
					<div className={`absolute inset-0 ${styles.mobileOverlay}`} />
				</div>

				<div className="relative z-10 flex flex-col h-full px-6 sm:px-10 xl:px-14 py-10">
					<div className="mb-10">{LOGO_SVG}</div>

					<div className="mb-8">
						<h1 className={`text-4xl sm:text-5xl xl:text-[52px] uppercase leading-none tracking-tight mb-2 ${styles.formTitle}`}>
							Sign In
						</h1>
						<p className={`text-sm ${styles.formSubtitle}`}>
							Continue watching on{" "}
							<span className={`font-semibold ${styles.brandHighlight}`}>STREAMFLIX</span>.
						</p>
					</div>

					<form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
						{notice && (
							<p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{notice}</p>
						)}
						{errors.form && (
							<p role="alert" className="text-sm text-red-300">{errors.form}</p>
						)}
						<Field
							label="Email"
							placeholder="Enter your email"
							value={email}
							onChange={setEmail}
							error={errors.email}
							autoComplete="email"
							disabled={submitting}
						/>
						<PasswordField
							label="Password"
							placeholder="Enter your password"
							value={password}
							onChange={setPassword}
							error={errors.password}
							autoComplete="current-password"
							disabled={submitting}
						/>

						<div className="flex items-center justify-between">
							<label className="flex items-center gap-2 cursor-pointer select-none">
								<input
									type="checkbox"
									checked={remember}
									onChange={(e) => setRemember(e.target.checked)}
									className="w-4 h-4 accent-[var(--color-wine)] rounded"
								/>
								<span className={`text-xs ${styles.rememberText}`}>Remember me</span>
							</label>
							<button type="button" onClick={handleForgotPassword} disabled={submitting} className={`text-xs underline underline-offset-2 transition-colors ${styles.forgotBtn}`}>
								Forgot Password?
							</button>
						</div>

						<button
							type="submit"
							disabled={submitting}
							className={`w-full py-3 text-sm font-bold uppercase tracking-[0.15em] transition-all duration-150 active:scale-[0.99] ${styles.submitBtn}`}
						>
							{submitting ? "Signing in…" : "Login"}
						</button>
					</form>

					<div className="flex items-center gap-3 my-6">
						<div className={`flex-1 h-px ${styles.orDivider}`} />
						<span className={`text-xs uppercase tracking-widest ${styles.orText}`}>or</span>
						<div className={`flex-1 h-px ${styles.orDivider}`} />
					</div>

					<SocialButtons onGoogle={() => void handleOAuth("google")} onMicrosoft={() => void handleOAuth("azure")} disabled={submitting} />

					<p className={`mt-6 text-center text-sm ${styles.footerText}`}>
						{"Don't have an account? "}
						<button
							type="button"
							onClick={() => onNavigate("register")}
							className={`transition-colors ${styles.footerLink}`}
						>
							Register
						</button>
					</p>
				</div>
			</div>
		</div>
	);
}
