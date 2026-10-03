import { useState } from "react";
import styles from "./auth.module.css";

export const LOGO_SVG = (
	<div className="flex items-center gap-2">
		<img src="/streamflix_logo.svg" alt="" aria-hidden className="h-8 w-auto" />
		<svg
			viewBox="0 0 111.81 30"
			className="h-7 w-auto"
			aria-label="StreamFlix"
		>
			<defs>
				<linearGradient id="sfGradAuth" x1="0%" y1="0%" x2="100%" y2="0%">
					<stop offset="0%" stopColor="#F5A800" />
					<stop offset="100%" stopColor="#7C3AED" />
				</linearGradient>
			</defs>
			<path fill="url(#sfGradAuth)" d="M0.66 22.02V20.82H3.78V22.26Q3.78 24.3 5.49 24.3Q6.33 24.3 6.765 23.805Q7.2 23.31 7.2 22.2Q7.2 20.88 6.6 19.875Q6.0 18.87 4.38 17.46Q2.34 15.66 1.53 14.205Q0.72 12.75 0.72 10.92Q0.72 8.43 1.98 7.065Q3.24 5.7 5.64 5.7Q8.01 5.7 9.225 7.065Q10.44 8.43 10.44 10.98V11.85H7.32V10.77Q7.32 9.69 6.9 9.195Q6.48 8.7 5.67 8.7Q4.02 8.7 4.02 10.71Q4.02 11.85 4.635 12.84Q5.25 13.83 6.87 15.24Q8.94 17.04 9.72 18.51Q10.5 19.98 10.5 21.96Q10.5 24.54 9.225 25.92Q7.95 27.3 5.52 27.3Q3.12 27.3 1.89 25.935Q0.66 24.57 0.66 22.02Z M14.97 9.0H11.52V6.0H21.72V9.0H18.27V27.0H14.97Z M23.31 6.0H28.2Q30.75 6.0 31.92 7.185Q33.09 8.37 33.09 10.83V12.12Q33.09 15.39 30.93 16.26V16.32Q32.13 16.68 32.625 17.79Q33.12 18.9 33.12 20.76V24.45Q33.12 25.35 33.18 25.905Q33.24 26.46 33.48 27.0H30.12Q29.94 26.49 29.88 26.04Q29.82 25.59 29.82 24.42V20.58Q29.82 19.14 29.355 18.57Q28.89 18.0 27.75 18.0H26.61V27.0H23.31ZM27.81 15.0Q28.8 15.0 29.295 14.49Q29.79 13.98 29.79 12.78V11.16Q29.79 10.02 29.385 9.51Q28.98 9.0 28.11 9.0H26.61V15.0Z M35.4 6.0H44.4V9.0H38.7V14.55H43.23V17.55H38.7V24.0H44.4V27.0H35.4Z M48.84 6.0H53.31L56.73 27.0H53.43L52.83 22.83V22.89H49.08L48.48 27.0H45.42ZM52.44 20.04 50.97 9.66H50.91L49.47 20.04Z M58.32 6.0H63.03L65.13 21.03H65.19L67.29 6.0H72.0V27.0H68.88V11.1H68.82L66.42 27.0H63.66L61.26 11.1H61.2V27.0H58.32Z M74.46 6.0H83.19V9.0H77.76V14.85H82.02V17.85H77.76V27.0H74.46Z M84.78 6.0H88.08V24.0H93.51V27.0H84.78Z M95.1 6.0H98.4V27.0H95.1Z M103.77 16.26 100.14 6.0H103.62L105.84 12.78H105.9L108.18 6.0H111.3L107.67 16.26L111.48 27.0H108.0L105.6 19.68H105.54L103.08 27.0H99.96Z" />
		</svg>
	</div>
);

export function EyeIcon({ open }: { open: boolean }) {
	return open ? (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
			<path d="M2 12s3.636-7 10-7 10 7 10 7-3.636 7-10 7S2 12 2 12z" />
			<circle cx="12" cy="12" r="3" />
		</svg>
	) : (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
			<path d="M17.94 17.94A10.07 10.07 0 0112 20c-6.364 0-10-7-10-7a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c6.364 0 10 7 10 7a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
			<line x1="1" y1="1" x2="23" y2="23" />
		</svg>
	);
}

export function GoogleIcon() {
	return (
		<svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0">
			<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
			<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
			<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
			<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
		</svg>
	);
}

export function MicrosoftIcon() {
	return (
		<svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0">
			<rect x="1" y="1" width="10" height="10" fill="#F25022" />
			<rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
			<rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
			<rect x="13" y="13" width="10" height="10" fill="#FFB900" />
		</svg>
	);
}

interface FieldProps {
	id?: string;
	label: string;
	type?: string;
	placeholder: string;
	value: string;
	onChange: (v: string) => void;
	error?: string;
	suffix?: React.ReactNode;
	autoComplete?: string;
	min?: string;
	max?: string;
	disabled?: boolean;
}

export function Field({ id, label, type = "text", placeholder, value, onChange, error, suffix, autoComplete, min, max, disabled }: FieldProps) {
	const inputId = id ?? `auth-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
	const errorId = `${inputId}-error`;
	return (
		<div className="flex flex-col gap-[7px]">
			<label htmlFor={inputId} className={`text-[10px] font-semibold uppercase tracking-[0.15em] ${styles.fieldLabel}`}>
				{label}
			</label>
			<div className="relative">
				<input
					id={inputId}
					type={type}
					placeholder={placeholder}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					autoComplete={autoComplete}
					min={min}
					max={max}
					disabled={disabled}
					aria-invalid={Boolean(error)}
					aria-describedby={error ? errorId : undefined}
					className={`w-full rounded-lg px-4 py-[11px] text-sm outline-none transition-all duration-150 ${suffix ? "pr-11" : ""} ${
						error
							? "border border-[#ff5c72] focus:border-[#ff5c72] focus:ring-1 focus:ring-[#ff5c72]/30"
							: "border border-[var(--color-stone)]/60 focus:border-[var(--color-wine)] focus:ring-1 focus:ring-[var(--color-wine)]/30"
					} ${styles.fieldInput}`}
				/>
				{suffix && (
					<div className={`absolute right-3 top-1/2 -translate-y-1/2 ${styles.fieldSuffix}`}>
						{suffix}
					</div>
				)}
			</div>
			{error && <p id={errorId} className={`text-[11px] ${styles.fieldError}`}>{error}</p>}
		</div>
	);
}

export function PasswordField(props: Omit<FieldProps, "type" | "suffix">) {
	const { label, placeholder, value, onChange, error } = props;
	const [show, setShow] = useState(false);
	return (
		<Field
			label={label}
			type={show ? "text" : "password"}
			placeholder={placeholder}
			value={value}
			onChange={onChange}
			error={error}
			id={props.id}
			autoComplete={props.autoComplete}
			disabled={props.disabled}
			suffix={
				<button
					type="button"
					onClick={() => setShow((s) => !s)}
					className="hover:text-[var(--color-cream)] transition-colors"
					aria-label={show ? "Hide password" : "Show password"}
				>
					<EyeIcon open={show} />
				</button>
			}
		/>
	);
}

export function PromoStats() {
	return (
		<div className="flex gap-10">
			{[{ num: "50K+", label: "TITLES" }, { num: "4K", label: "ULTRA HD" }, { num: "190+", label: "COUNTRIES" }].map(({ num, label }) => (
				<div key={label} className="flex flex-col gap-1">
					<span className={`text-2xl font-bold ${styles.statNum}`}>{num}</span>
					<span className={`text-[10px] uppercase tracking-[0.18em] ${styles.statLabel}`}>{label}</span>
				</div>
			))}
		</div>
	);
}

export function SocialButtons({ onGoogle, onMicrosoft, disabled = false }: {
	onGoogle: () => void;
	onMicrosoft: () => void;
	disabled?: boolean;
}) {
	return (
		<div className="flex flex-col gap-3">
			{[
				{ icon: <GoogleIcon />, label: "Continue with Google", onClick: onGoogle },
				{ icon: <MicrosoftIcon />, label: "Continue with Microsoft", onClick: onMicrosoft },
			].map(({ icon, label, onClick }) => (
				<button
					key={label}
					type="button"
					onClick={onClick}
					disabled={disabled}
					className={`w-full flex items-center justify-center gap-3 py-[11px] rounded-lg border text-sm transition-all duration-150 ${styles.socialBtn}`}
				>
					{icon}
					{label}
				</button>
			))}
		</div>
	);
}
