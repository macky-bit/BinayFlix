import { useState, useEffect, useRef } from "react";
import styles from "./account.module.css";
import SubscriptionPage from "../subscription/SubscriptionPage";
import type { Plan } from "../subscription/SubscriptionPage";

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconHome() {
	return (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
			<path d="M3 9.75L12 3l9 6.75V21a1 1 0 01-1 1H4a1 1 0 01-1-1V9.75z" />
			<path d="M9 22V12h6v10" />
		</svg>
	);
}

function IconCard() {
	return (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
			<rect x="2" y="5" width="20" height="14" rx="2" />
			<path d="M2 10h20" />
		</svg>
	);
}

function IconShield() {
	return (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
			<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
		</svg>
	);
}

function IconMonitor() {
	return (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
			<rect x="2" y="3" width="20" height="14" rx="2" />
			<path d="M8 21h8M12 17v4" />
		</svg>
	);
}

function IconUsers() {
	return (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
			<circle cx="9" cy="7" r="4" />
			<path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
			<path d="M16 3.13a4 4 0 010 7.75" />
			<path d="M21 21v-2a4 4 0 00-3-3.87" />
		</svg>
	);
}

function IconLock() {
	return (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
			<rect x="3" y="11" width="18" height="11" rx="2" />
			<path d="M7 11V7a5 5 0 0110 0v4" />
		</svg>
	);
}

function IconChevronRight() {
	return (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
			<path d="M9 18l6-6-6-6" />
		</svg>
	);
}

function IconCreditCard() {
	return (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
			<rect x="2" y="5" width="20" height="14" rx="2" />
			<path d="M2 10h20" />
		</svg>
	);
}

function IconEye({ open }: { open: boolean }) {
	return open ? (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
			<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
			<circle cx="12" cy="12" r="3" />
		</svg>
	) : (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
			<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
			<line x1="1" y1="1" x2="23" y2="23" />
		</svg>
	);
}

function IconX() {
	return (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
			<line x1="18" y1="6" x2="6" y2="18" />
			<line x1="6" y1="6" x2="18" y2="18" />
		</svg>
	);
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Section = "overview" | "membership" | "security" | "devices" | "profiles" | "privacy";
type Modal = null | "email" | "password" | "phone" | "delete1" | "delete2" | "signout" | "billing" | "cancelMembership" | "updatePayment" | "changePlan";

// ─── Modal Overlay ────────────────────────────────────────────────────────────

function ModalOverlay({ onClose, children }: { onClose: () => void; children: React.ReactNode; }) {
	useEffect(() => {
		const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [onClose]);
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: "var(--color-ink)" }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
			{children}
		</div>
	);
}

function ModalBox({ children, title, onClose }: { children: React.ReactNode; title: string; onClose: () => void; }) {
	return (
		<div className="w-full max-w-md rounded-lg p-6 relative" style={{ backgroundColor: "var(--color-ink-soft)", border: "1px solid var(--color-stone)", boxShadow: "0 20px 60px var(--color-ink)" }}>
			<div className="flex items-center justify-between mb-5">
				<h2 className="font-display text-xl font-semibold tracking-wide" style={{ color: "var(--color-cream)" }}>{title}</h2>
				<button onClick={onClose} className="p-1 rounded transition-colors" style={{ color: "var(--color-taupe)" }} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-cream)")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-taupe)")} aria-label="Close modal">
					<IconX />
				</button>
			</div>
			{children}
		</div>
	);
}

function FormField({ label, type, value, onChange, placeholder, error, showToggle, show, onToggle }: { label: string; type: string; value: string; onChange: (v: string) => void; placeholder?: string; error?: string; showToggle?: boolean; show?: boolean; onToggle?: () => void; }) {
	return (
		<div className="mb-4">
			<label className="block text-xs font-medium mb-1.5 tracking-wide uppercase" style={{ color: "var(--color-taupe)" }}>{label}</label>
			<div className="relative">
				<input type={showToggle ? (show ? "text" : "password") : type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full px-3 py-2.5 rounded text-sm outline-none transition-colors" style={{ backgroundColor: "var(--color-ink)", border: `1px solid ${error ? "var(--color-wine)" : "var(--color-stone)"}`, color: "var(--color-cream)", fontFamily: "Barlow, sans-serif" }} onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-wine)"; }} onBlur={(e) => { e.currentTarget.style.borderColor = error ? "var(--color-wine)" : "var(--color-stone)"; }} />
				{showToggle && (
					<button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-taupe)" }} aria-label={show ? "Hide" : "Show"}>
						<IconEye open={!!show} />
					</button>
				)}
			</div>
			{error && <p className="mt-1 text-xs" style={{ color: "var(--color-taupe)" }}>{error}</p>}
		</div>
	);
}

function ModalActions({ onCancel, onSave, saveLabel = "Save", loading }: { onCancel: () => void; onSave: () => void; saveLabel?: string; loading?: boolean; }) {
	return (
		<div className="flex gap-3 mt-6">
			<button onClick={onCancel} className="flex-1 py-2.5 rounded text-sm font-medium transition-colors" style={{ border: "1px solid var(--color-stone)", color: "var(--color-taupe)", backgroundColor: "transparent" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-taupe)"; e.currentTarget.style.color = "var(--color-cream)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-stone)"; e.currentTarget.style.color = "var(--color-taupe)"; }}>Cancel</button>
			<button onClick={onSave} disabled={loading} className="flex-1 py-2.5 rounded text-sm font-semibold transition-colors" style={{ backgroundColor: "var(--color-wine)", color: "var(--color-cream)" }} onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = "var(--color-ink-soft)"; }} onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = "var(--color-wine)"; }}>
				{loading ? "Saving…" : saveLabel}
			</button>
		</div>
	);
}

// ─── Change Email Modal ───────────────────────────────────────────────────────

function ChangeEmailModal({ onClose }: { onClose: () => void }) {
	const [email, setEmail] = useState("");
	const [pass, setPass] = useState("");
	const [showPass, setShowPass] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);

	function validate() {
		const e: Record<string, string> = {};
		if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email address.";
		if (!pass) e.pass = "Enter your current password.";
		return e;
	}

	function save() {
		const e = validate();
		if (Object.keys(e).length) { setErrors(e); return; }
		setLoading(true);
		setTimeout(() => { setLoading(false); setSuccess(true); setTimeout(onClose, 1200); }, 1000);
	}

	return (
		<ModalOverlay onClose={onClose}>
			<ModalBox title="Change Email" onClose={onClose}>
				{success ? (
					<p className="text-sm py-4 text-center" style={{ color: "var(--color-taupe)" }}>Email updated.</p>
				) : (
					<>
						<FormField label="New Email Address" type="email" value={email} onChange={(v) => { setEmail(v); setErrors((p) => ({ ...p, email: "" })); }} placeholder="you@example.com" error={errors.email} />
						<FormField label="Current Password" type="password" value={pass} onChange={(v) => { setPass(v); setErrors((p) => ({ ...p, pass: "" })); }} showToggle show={showPass} onToggle={() => setShowPass((x) => !x)} error={errors.pass} />
						<ModalActions onCancel={onClose} onSave={save} loading={loading} />
					</>
				)}
			</ModalBox>
		</ModalOverlay>
	);
}

// ─── Change Password Modal ────────────────────────────────────────────────────

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
	const [cur, setCur] = useState("");
	const [next, setNext] = useState("");
	const [confirm, setConfirm] = useState("");
	const [show, setShow] = useState({ cur: false, next: false, confirm: false });
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);

	function validate() {
		const e: Record<string, string> = {};
		if (!cur) e.cur = "Enter your current password.";
		if (!next || next.length < 8) e.next = "Password must be at least 8 characters.";
		if (next !== confirm) e.confirm = "The passwords do not match.";
		return e;
	}

	function save() {
		const e = validate();
		if (Object.keys(e).length) { setErrors(e); return; }
		setLoading(true);
		setTimeout(() => { setLoading(false); setSuccess(true); setTimeout(onClose, 1200); }, 1000);
	}

	return (
		<ModalOverlay onClose={onClose}>
			<ModalBox title="Change Password" onClose={onClose}>
				{success ? (
					<p className="text-sm py-4 text-center" style={{ color: "var(--color-taupe)" }}>Password changed.</p>
				) : (
					<>
						<FormField label="Current Password" type="password" value={cur} onChange={(v) => { setCur(v); setErrors((p) => ({ ...p, cur: "" })); }} showToggle show={show.cur} onToggle={() => setShow((s) => ({ ...s, cur: !s.cur }))} error={errors.cur} />
						<FormField label="New Password" type="password" value={next} onChange={(v) => { setNext(v); setErrors((p) => ({ ...p, next: "" })); }} showToggle show={show.next} onToggle={() => setShow((s) => ({ ...s, next: !s.next }))} error={errors.next} />
						<FormField label="Confirm New Password" type="password" value={confirm} onChange={(v) => { setConfirm(v); setErrors((p) => ({ ...p, confirm: "" })); }} showToggle show={show.confirm} onToggle={() => setShow((s) => ({ ...s, confirm: !s.confirm }))} error={errors.confirm} />
						<ModalActions onCancel={onClose} onSave={save} loading={loading} />
					</>
				)}
			</ModalBox>
		</ModalOverlay>
	);
}

// ─── Add Phone Modal ──────────────────────────────────────────────────────────

function AddPhoneModal({ onClose }: { onClose: () => void }) {
	const [country, setCountry] = useState("US +1");
	const [phone, setPhone] = useState("");
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);

	function save() {
		const e: Record<string, string> = {};
		if (!phone || phone.replace(/\D/g, "").length < 7) e.phone = "Enter a valid phone number.";
		if (Object.keys(e).length) { setErrors(e); return; }
		setLoading(true);
		setTimeout(() => { setLoading(false); setSuccess(true); setTimeout(onClose, 1200); }, 1000);
	}

	return (
		<ModalOverlay onClose={onClose}>
			<ModalBox title="Add Phone Number" onClose={onClose}>
				{success ? (
					<p className="text-sm py-4 text-center" style={{ color: "var(--color-taupe)" }}>Phone number added.</p>
				) : (
					<>
						<div className="mb-4">
							<label className="block text-xs font-medium mb-1.5 tracking-wide uppercase" style={{ color: "var(--color-taupe)" }}>Country or Region</label>
							<select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full px-3 py-2.5 rounded text-sm outline-none" style={{ backgroundColor: "var(--color-ink)", border: "1px solid var(--color-stone)", color: "var(--color-cream)", fontFamily: "Barlow, sans-serif" }}>
								<option>US +1</option>
								<option>UK +44</option>
								<option>CA +1</option>
								<option>AU +61</option>
								<option>DE +49</option>
							</select>
						</div>
						<FormField label="Phone Number" type="tel" value={phone} onChange={(v) => { setPhone(v); setErrors((p) => ({ ...p, phone: "" })); }} placeholder="(555) 000-0000" error={errors.phone} />
						<ModalActions onCancel={onClose} onSave={save} loading={loading} saveLabel="Add" />
					</>
				)}
			</ModalBox>
		</ModalOverlay>
	);
}

// ─── Delete Account Modals ────────────────────────────────────────────────────

function DeleteAccountModal1({ onClose, onContinue }: { onClose: () => void; onContinue: () => void; }) {
	return (
		<ModalOverlay onClose={onClose}>
			<ModalBox title="Delete Account?" onClose={onClose}>
				<p className="text-sm leading-relaxed mb-6" style={{ color: "var(--color-taupe)" }}>This action will permanently delete your account, profiles, saved titles, and viewing information.</p>
				<div className="flex gap-3">
					<button onClick={onClose} className="flex-1 py-2.5 rounded text-sm font-medium transition-colors" style={{ border: "1px solid var(--color-stone)", color: "var(--color-taupe)", backgroundColor: "transparent" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-taupe)"; e.currentTarget.style.color = "var(--color-cream)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-stone)"; e.currentTarget.style.color = "var(--color-taupe)"; }}>Cancel</button>
					<button onClick={onContinue} className="flex-1 py-2.5 rounded text-sm font-semibold transition-colors" style={{ backgroundColor: "var(--color-wine)", color: "var(--color-cream)" }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--color-ink-soft)"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--color-wine)"; }}>Continue</button>
				</div>
			</ModalBox>
		</ModalOverlay>
	);
}

function DeleteAccountModal2({ onClose }: { onClose: () => void }) {
	const [input, setInput] = useState("");
	const valid = input === "DELETE";
	return (
		<ModalOverlay onClose={onClose}>
			<ModalBox title="Confirm Deletion" onClose={onClose}>
				<p className="text-sm mb-4" style={{ color: "var(--color-taupe)" }}>Type <span style={{ color: "var(--color-cream)", fontFamily: "monospace" }}>DELETE</span> to permanently remove your account.</p>
				<input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="DELETE" className="w-full px-3 py-2.5 rounded text-sm outline-none mb-6" style={{ backgroundColor: "var(--color-ink)", border: "1px solid var(--color-stone)", color: "var(--color-cream)", fontFamily: "monospace", letterSpacing: "0.1em" }} onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-wine)"; }} onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-stone)"; }} />
				<div className="flex gap-3">
					<button onClick={onClose} className="flex-1 py-2.5 rounded text-sm font-medium transition-colors" style={{ border: "1px solid var(--color-stone)", color: "var(--color-taupe)", backgroundColor: "transparent" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-taupe)"; e.currentTarget.style.color = "var(--color-cream)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-stone)"; e.currentTarget.style.color = "var(--color-taupe)"; }}>Cancel</button>
					<button disabled={!valid} className="flex-1 py-2.5 rounded text-sm font-semibold transition-colors" style={{ backgroundColor: "var(--color-wine)", color: "var(--color-cream)", cursor: valid ? "pointer" : "not-allowed" }}>Delete Account</button>
				</div>
			</ModalBox>
		</ModalOverlay>
	);
}

// ─── Sign Out All Devices Modal ───────────────────────────────────────────────

function SignOutAllModal({ onClose }: { onClose: () => void }) {
	const [done, setDone] = useState(false);
	return (
		<ModalOverlay onClose={onClose}>
			<ModalBox title="Sign Out of All Devices?" onClose={onClose}>
				{done ? (
					<p className="text-sm py-4 text-center" style={{ color: "var(--color-taupe)" }}>Signed out of all devices.</p>
				) : (
					<>
						<p className="text-sm mb-6" style={{ color: "var(--color-taupe)" }}>You will be signed out of all devices except this one. You will need to sign in again on those devices.</p>
						<div className="flex gap-3">
							<button onClick={onClose} className="flex-1 py-2.5 rounded text-sm font-medium transition-colors" style={{ border: "1px solid var(--color-stone)", color: "var(--color-taupe)", backgroundColor: "transparent" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-taupe)"; e.currentTarget.style.color = "var(--color-cream)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-stone)"; e.currentTarget.style.color = "var(--color-taupe)"; }}>Cancel</button>
							<button onClick={() => { setDone(true); setTimeout(onClose, 1200); }} className="flex-1 py-2.5 rounded text-sm font-semibold transition-colors" style={{ backgroundColor: "var(--color-wine)", color: "var(--color-cream)" }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--color-ink-soft)"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--color-wine)"; }}>Sign Out All</button>
						</div>
					</>
				)}
			</ModalBox>
		</ModalOverlay>
	);
}

// ─── Billing Details Modal ────────────────────────────────────────────────────

function BillingDetailsModal({ onClose, plan }: { onClose: () => void; plan: Plan | null }) {
	return (
		<ModalOverlay onClose={onClose}>
			<ModalBox title="Billing Details" onClose={onClose}>
				<div className="space-y-3">
					{[
						{ label: "Plan", value: plan ? `StreamFlix ${plan.PlanName}` : "No active plan" },
						{ label: "Amount", value: plan ? `${plan.MonthlyPrice} / month` : "—" },
						{ label: "Payment Method", value: "•••• 4242" },
						{ label: "Next Billing Date", value: "September 27, 2026" },
					].map((row) => (
						<div key={row.label} className="flex justify-between py-2" style={{ borderBottom: "1px solid var(--color-stone)" }}>
							<span className="text-sm" style={{ color: "var(--color-taupe)" }}>{row.label}</span>
							<span className="text-sm font-medium" style={{ color: "var(--color-cream)" }}>{row.value}</span>
						</div>
					))}
				</div>
				<div className="mt-5">
					<p className="text-xs font-medium mb-3 tracking-wide uppercase" style={{ color: "var(--color-taupe)" }}>Billing History</p>
					{["Aug 27, 2026", "Jul 27, 2026", "Jun 27, 2026"].map((date) => (
						<div key={date} className="flex justify-between py-2" style={{ borderBottom: "1px solid var(--color-stone)" }}>
							<span className="text-sm" style={{ color: "var(--color-taupe)" }}>{date}</span>
							<span className="text-sm" style={{ color: "var(--color-cream)" }}>{plan?.MonthlyPrice ?? "—"}</span>
						</div>
					))}
				</div>
				<button onClick={onClose} className="w-full mt-6 py-2.5 rounded text-sm font-medium transition-colors" style={{ border: "1px solid var(--color-stone)", color: "var(--color-taupe)", backgroundColor: "transparent" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-taupe)"; e.currentTarget.style.color = "var(--color-cream)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-stone)"; e.currentTarget.style.color = "var(--color-taupe)"; }}>Close</button>
			</ModalBox>
		</ModalOverlay>
	);
}

// ─── Divider ──────────────────────────────────────────────────────────────────

function Divider() {
	return <div style={{ borderTop: "1px solid var(--color-stone)" }} />;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
	return (
		<h2 className="font-display text-base font-semibold tracking-wider uppercase mb-4" style={{ color: "var(--color-taupe)" }}>{children}</h2>
	);
}

// ─── Overview Content ─────────────────────────────────────────────────────────

function OverviewContent({ setSection, setModal }: { setSection: (s: Section) => void; setModal: (m: Modal) => void; }) {
	return (
		<div className="space-y-8">
			<div className="rounded-lg p-5" style={{ backgroundColor: "var(--color-ink-soft)", border: "1px solid var(--color-stone)" }}>
				<div className="flex flex-wrap items-center gap-4">
					<div className="flex-1 min-w-0">
						<p className="text-xs font-medium tracking-widest uppercase mb-1" style={{ color: "var(--color-taupe)" }}>Membership</p>
						<p className="font-display text-2xl font-bold tracking-wide" style={{ color: "var(--color-cream)" }}>StreamFlix Premium</p>
					</div>
					<div className="flex flex-col gap-1.5 items-start">
						<span className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium" style={{ border: "1px solid var(--color-wine)", color: "var(--color-cream)" }}>
							<span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--color-ink-soft)" }} />
							Active
						</span>
						<span className="text-xs" style={{ color: "var(--color-taupe)" }}>Member since 2026</span>
					</div>
					<button onClick={() => setSection("membership")} className="px-5 py-2.5 rounded text-sm font-semibold transition-colors whitespace-nowrap" style={{ backgroundColor: "var(--color-wine)", color: "var(--color-cream)" }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--color-ink-soft)"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--color-wine)"; }}>Manage Membership</button>
				</div>
			</div>

			<div>
				<SectionHeading>Account Information</SectionHeading>
				<div className="space-y-0">
					{[
						{ label: "Email", value: "kevin@example.com", action: "Change", modal: "email" as Modal },
						{ label: "Password", value: "••••••••••", action: "Change", modal: "password" as Modal },
						{ label: "Phone", value: "Not added", action: "Add", modal: "phone" as Modal, muted: true },
					].map((row, i, arr) => (
						<div key={row.label}>
							<div className="flex items-center py-4 gap-4">
								<span className="w-24 text-sm font-medium flex-shrink-0" style={{ color: "var(--color-cream)" }}>{row.label}</span>
								<span className="flex-1 text-sm" style={{ color: row.muted ? "var(--color-taupe)" : "var(--color-cream)" }}>{row.value}</span>
								<button onClick={() => setModal(row.modal)} className="text-sm transition-colors flex-shrink-0" style={{ color: "var(--color-taupe)" }} onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-cream)"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-taupe)"; }}>{row.action}</button>
							</div>
							{i < arr.length - 1 && <Divider />}
						</div>
					))}
				</div>
			</div>

			<Divider />

			<div>
				<SectionHeading>Plan &amp; Billing</SectionHeading>
				<div className="flex flex-wrap items-center gap-4 py-1">
					<div className="flex flex-wrap items-center gap-4 flex-1">
						<span className="text-sm font-bold" style={{ color: "var(--color-cream)" }}>Premium</span>
						<span style={{ color: "var(--color-stone)", fontSize: "1px", borderLeft: "1px solid var(--color-stone)", height: "16px", display: "inline-block" }} />
						<span className="text-sm" style={{ color: "var(--color-cream)" }}>4K + HDR</span>
						<span style={{ color: "var(--color-stone)", fontSize: "1px", borderLeft: "1px solid var(--color-stone)", height: "16px", display: "inline-block" }} />
						<span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--color-cream)" }}>
							<span style={{ color: "var(--color-taupe)" }}><IconCreditCard /></span>
							•••• 4242
						</span>
						<span style={{ color: "var(--color-stone)", fontSize: "1px", borderLeft: "1px solid var(--color-stone)", height: "16px", display: "inline-block" }} />
						<span className="text-sm" style={{ color: "var(--color-taupe)" }}>Next billing date: <span style={{ color: "var(--color-cream)" }}>September 27, 2026</span></span>
					</div>
					<button onClick={() => setModal("billing")} className="px-4 py-2 rounded text-sm font-medium transition-colors whitespace-nowrap" style={{ border: "1px solid var(--color-stone)", color: "var(--color-taupe)", backgroundColor: "transparent" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-taupe)"; e.currentTarget.style.color = "var(--color-cream)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-stone)"; e.currentTarget.style.color = "var(--color-taupe)"; }}>View billing details</button>
				</div>
			</div>

			<Divider />

			<div>
				<SectionHeading>Quick Links</SectionHeading>
				<div>
					{[
						{ label: "Security Settings", icon: <IconShield />, target: "security" as Section },
						{ label: "Manage Devices", icon: <IconMonitor />, target: "devices" as Section },
						{ label: "Manage Profiles", icon: <IconUsers />, target: "profiles" as Section },
					].map((link, i, arr) => (
						<div key={link.label}>
							<button onClick={() => setSection(link.target)} className="w-full flex items-center gap-3 py-4 transition-colors group" style={{ color: "var(--color-cream)" }} onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-wine)"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-cream)"; }}>
								<span style={{ color: "var(--color-taupe)" }} className="group-hover:text-current transition-colors">{link.icon}</span>
								<span className="flex-1 text-sm text-left">{link.label}</span>
								<span style={{ color: "var(--color-taupe)" }}><IconChevronRight /></span>
							</button>
							{i < arr.length - 1 && <Divider />}
						</div>
					))}
				</div>
			</div>

			<Divider />

			<div className="pb-6">
				<SectionHeading>Account Actions</SectionHeading>
				<button onClick={() => setModal("delete1")} className="text-sm transition-colors" style={{ color: "var(--color-taupe)" }} onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-cream)"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-taupe)"; }}>Delete Account</button>
			</div>
		</div>
	);
}

// ─── Membership Page ──────────────────────────────────────────────────────────

function MembershipPage({ setModal, plan }: { setModal: (m: Modal) => void; plan: Plan | null }) {
	const [cancelling, setCancelling] = useState(false);
	return (
		<div className="space-y-8 pb-6">
			<div>
				<SectionHeading>Current Plan</SectionHeading>
				<div className="rounded-lg p-5 mb-4" style={{ backgroundColor: "var(--color-ink-soft)", border: "1px solid var(--color-stone)" }}>
					<div className="flex flex-wrap items-start justify-between gap-4">
						<div>
							<p className="font-display text-2xl font-bold tracking-wide mb-1" style={{ color: "var(--color-cream)" }}>{plan ? `StreamFlix ${plan.PlanName}` : "No active plan"}</p>
							<div className="flex flex-wrap gap-3 mt-3">
								{["4K + HDR", "Dolby Audio", "4 Screens", "Downloads"].map((f) => (
									<span key={f} className="text-xs px-2.5 py-1 rounded" style={{ border: "1px solid var(--color-stone)", color: "var(--color-taupe)" }}>{f}</span>
								))}
							</div>
						</div>
						<div className="text-right">
							<p className="font-display text-xl font-bold" style={{ color: "var(--color-cream)" }}>{plan?.MonthlyPrice ?? "—"}</p>
							<p className="text-xs" style={{ color: "var(--color-taupe)" }}>per month</p>
						</div>
					</div>
				</div>
				<button onClick={() => setModal("changePlan")} className="text-sm font-medium px-4 py-2 rounded transition-colors" style={{ border: "1px solid var(--color-stone)", color: "var(--color-taupe)", backgroundColor: "transparent" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-taupe)"; e.currentTarget.style.color = "var(--color-cream)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-stone)"; e.currentTarget.style.color = "var(--color-taupe)"; }}>{plan ? "Change Plan" : "Choose a Plan"}</button>
			</div>

			<Divider />

			<div>
				<SectionHeading>Billing</SectionHeading>
				<div className="space-y-0">
					{[
						{ label: "Payment Method", value: "•••• 4242", action: "Update", onClick: () => setModal("updatePayment") },
						{ label: "Next Billing Date", value: "September 27, 2026", action: null, onClick: undefined },
						{ label: "Amount", value: plan ? `${plan.MonthlyPrice} / month` : "—", action: null, onClick: undefined },
					].map((row, i, arr) => (
						<div key={row.label}>
							<div className="flex items-center py-4 gap-4">
								<span className="w-36 text-sm flex-shrink-0" style={{ color: "var(--color-taupe)" }}>{row.label}</span>
								<span className="flex-1 text-sm" style={{ color: "var(--color-cream)" }}>{row.value}</span>
								{row.action && (
									<button onClick={row.onClick} className="text-sm transition-colors flex-shrink-0" style={{ color: "var(--color-taupe)" }} onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-cream)"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-taupe)"; }}>{row.action}</button>
								)}
							</div>
							{i < arr.length - 1 && <Divider />}
						</div>
					))}
				</div>
			</div>

			<Divider />

			<div>
				<SectionHeading>Billing History</SectionHeading>
				<div>
					{[
						{ date: "Aug 27, 2026", amount: plan?.MonthlyPrice ?? "—", status: "Paid" },
						{ date: "Jul 27, 2026", amount: plan?.MonthlyPrice ?? "—", status: "Paid" },
						{ date: "Jun 27, 2026", amount: plan?.MonthlyPrice ?? "—", status: "Paid" },
					].map((row, i, arr) => (
						<div key={row.date}>
							<div className="flex items-center py-3 gap-4">
								<span className="flex-1 text-sm" style={{ color: "var(--color-taupe)" }}>{row.date}</span>
								<span className="text-sm" style={{ color: "var(--color-cream)" }}>{row.amount}</span>
								<span className="text-xs px-2 py-0.5 rounded" style={{ border: "1px solid var(--color-stone)", color: "var(--color-taupe)" }}>{row.status}</span>
							</div>
							{i < arr.length - 1 && <Divider />}
						</div>
					))}
				</div>
			</div>

			<Divider />

			<div>
				<p className="text-xs font-medium mb-3 tracking-widest uppercase" style={{ color: "var(--color-taupe)" }}>Danger Zone</p>
				{!cancelling ? (
					<button onClick={() => setCancelling(true)} className="text-sm transition-colors" style={{ color: "var(--color-taupe)" }} onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-cream)"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-taupe)"; }}>Cancel Membership</button>
				) : (
					<div className="rounded-lg p-4" style={{ border: "1px solid var(--color-wine)", backgroundColor: "var(--color-wine)" }}>
						<p className="text-sm mb-4" style={{ color: "var(--color-taupe)" }}>Are you sure you want to cancel? You will lose access at the end of your current billing period.</p>
						<div className="flex gap-3">
							<button onClick={() => setCancelling(false)} className="px-4 py-2 rounded text-sm font-medium transition-colors" style={{ border: "1px solid var(--color-stone)", color: "var(--color-taupe)", backgroundColor: "transparent" }}>Keep Membership</button>
							<button className="px-4 py-2 rounded text-sm font-semibold transition-colors" style={{ backgroundColor: "var(--color-wine)", color: "var(--color-cream)" }}>Confirm Cancel</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

// ─── Security Page ────────────────────────────────────────────────────────────

function SecurityPage({ setModal }: { setModal: (m: Modal) => void }) {
	const [twoStep, setTwoStep] = useState(false);
	return (
		<div className="space-y-8 pb-6">
			<div>
				<SectionHeading>Security</SectionHeading>
				<div className="space-y-0">
					{[
						{ label: "Password", value: "Last changed 30 days ago", action: "Change", onClick: () => setModal("password") },
						{ label: "Phone", value: "Not added", action: "Add", onClick: () => setModal("phone"), muted: true },
					].map((row, i, arr) => (
						<div key={row.label}>
							<div className="flex items-center py-4 gap-4">
								<span className="w-36 text-sm font-medium flex-shrink-0" style={{ color: "var(--color-cream)" }}>{row.label}</span>
								<span className="flex-1 text-sm" style={{ color: "var(--color-taupe)" }}>{row.value}</span>
								<button onClick={row.onClick} className="text-sm transition-colors flex-shrink-0" style={{ color: "var(--color-taupe)" }} onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-cream)"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-taupe)"; }}>{row.action}</button>
							</div>
							{i < arr.length - 1 && <Divider />}
						</div>
					))}
				</div>
			</div>

			<Divider />

			<div>
				<SectionHeading>Two-Step Verification</SectionHeading>
				<div className="flex items-center justify-between py-2">
					<div>
						<p className="text-sm font-medium mb-1" style={{ color: "var(--color-cream)" }}>Two-Step Verification</p>
						<p className="text-xs" style={{ color: "var(--color-taupe)" }}>{twoStep ? "Enabled — your account has extra protection." : "Add an extra layer of security to your account."}</p>
					</div>
					<button onClick={() => setTwoStep((x) => !x)} className="relative w-10 h-5 rounded-full transition-colors flex-shrink-0" style={{ backgroundColor: twoStep ? "var(--color-wine)" : "var(--color-stone)" }} role="switch" aria-checked={twoStep} aria-label="Toggle two-step verification">
						<span className="absolute top-0.5 w-4 h-4 rounded-full transition-transform" style={{ backgroundColor: "var(--color-cream)", transform: twoStep ? "translateX(20px)" : "translateX(2px)" }} />
					</button>
				</div>
			</div>

			<Divider />

			<div>
				<SectionHeading>Recent Account Access</SectionHeading>
				<div>
					{[
						{ device: "Chrome on Mac", location: "New York, US", time: "Active now" },
						{ device: "Safari on iPhone", location: "New York, US", time: "2 hours ago" },
						{ device: "StreamFlix TV App", location: "New York, US", time: "Yesterday" },
					].map((row, i, arr) => (
						<div key={row.device}>
							<div className="flex items-center py-3 gap-4">
								<div className="flex-1">
									<p className="text-sm" style={{ color: "var(--color-cream)" }}>{row.device}</p>
									<p className="text-xs mt-0.5" style={{ color: "var(--color-taupe)" }}>{row.location}</p>
								</div>
								<span className="text-xs" style={{ color: "var(--color-taupe)" }}>{row.time}</span>
							</div>
							{i < arr.length - 1 && <Divider />}
						</div>
					))}
				</div>
			</div>

			<Divider />

			<div>
				<button onClick={() => setModal("signout")} className="text-sm transition-colors" style={{ color: "var(--color-taupe)" }} onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-cream)"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-taupe)"; }}>Sign Out of All Devices</button>
			</div>
		</div>
	);
}

// ─── Devices Page ─────────────────────────────────────────────────────────────

function DevicesPage() {
	const [devices, setDevices] = useState([
		{ id: 1, name: "Chrome on Mac", type: "Computer", location: "New York, US", last: "Active now", download: true },
		{ id: 2, name: "Safari on iPhone 15", type: "Mobile", location: "New York, US", last: "2 hours ago", download: true },
		{ id: 3, name: "StreamFlix Smart TV", type: "TV", location: "New York, US", last: "Yesterday", download: false },
		{ id: 4, name: "Firefox on Windows", type: "Computer", location: "New York, US", last: "3 days ago", download: false },
	]);
	return (
		<div className="space-y-8 pb-6">
			<div>
				<SectionHeading>Signed-In Devices</SectionHeading>
				<div>
					{devices.map((d, i, arr) => (
						<div key={d.id}>
							<div className="flex items-center py-4 gap-4">
								<div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--color-stone)" }}>
									<span style={{ color: "var(--color-taupe)" }}><IconMonitor /></span>
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium" style={{ color: "var(--color-cream)" }}>{d.name}</p>
									<p className="text-xs mt-0.5" style={{ color: "var(--color-taupe)" }}>{d.type} · {d.location} · {d.last}</p>
								</div>
								{d.download && <span className="text-xs px-2 py-0.5 rounded hidden sm:inline" style={{ border: "1px solid var(--color-stone)", color: "var(--color-taupe)" }}>Downloads</span>}
								<button onClick={() => setDevices((prev) => prev.filter((x) => x.id !== d.id))} className="text-xs flex-shrink-0 transition-colors" style={{ color: "var(--color-taupe)" }} onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-cream)"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-taupe)"; }}>Sign Out</button>
							</div>
							{i < arr.length - 1 && <Divider />}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

// ─── Profiles Page ────────────────────────────────────────────────────────────

function ProfilesPage() {
	const [profiles] = useState([
		{ id: 1, initials: "KC", name: "Kevin", rating: "All", lang: "English", locked: false, primary: true },
		{ id: 2, initials: "MR", name: "Movies", rating: "18+", lang: "English", locked: false, primary: false },
		{ id: 3, initials: "KI", name: "Kids", rating: "G", lang: "English", locked: true, primary: false },
	]);
	const [adding, setAdding] = useState(false);
	const [newName, setNewName] = useState("");
	return (
		<div className="space-y-8 pb-6">
			<div>
				<SectionHeading>Profiles</SectionHeading>
				<div>
					{profiles.map((p, i, arr) => (
						<div key={p.id}>
							<div className="flex items-center py-4 gap-4">
								<div className="w-9 h-9 rounded font-display font-bold text-sm flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--color-wine)", color: "var(--color-cream)" }}>{p.initials}</div>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium" style={{ color: "var(--color-cream)" }}>{p.name} {p.primary && <span className="text-xs ml-1" style={{ color: "var(--color-taupe)" }}>(Primary)</span>}</p>
									<p className="text-xs mt-0.5" style={{ color: "var(--color-taupe)" }}>{p.rating} · {p.lang}{p.locked ? " · Locked" : ""}</p>
								</div>
								<button className="text-xs transition-colors" style={{ color: "var(--color-taupe)" }} onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-cream)"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-taupe)"; }}>Edit</button>
							</div>
							{i < arr.length - 1 && <Divider />}
						</div>
					))}
				</div>
				<div className="mt-4">
					{!adding ? (
						<button onClick={() => setAdding(true)} className="text-sm font-medium px-4 py-2 rounded transition-colors" style={{ border: "1px solid var(--color-stone)", color: "var(--color-taupe)", backgroundColor: "transparent" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-taupe)"; e.currentTarget.style.color = "var(--color-cream)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-stone)"; e.currentTarget.style.color = "var(--color-taupe)"; }}>+ Add Profile</button>
					) : (
						<div className="rounded-lg p-4" style={{ border: "1px solid var(--color-stone)", backgroundColor: "var(--color-ink-soft)" }}>
							<p className="text-xs font-medium mb-2 tracking-wide uppercase" style={{ color: "var(--color-taupe)" }}>Profile Name</p>
							<input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New profile name" className="w-full px-3 py-2.5 rounded text-sm outline-none mb-3" style={{ backgroundColor: "var(--color-ink)", border: "1px solid var(--color-stone)", color: "var(--color-cream)", fontFamily: "Barlow, sans-serif" }} />
							<div className="flex gap-3">
								<button onClick={() => { setAdding(false); setNewName(""); }} className="px-4 py-2 rounded text-sm transition-colors" style={{ border: "1px solid var(--color-stone)", color: "var(--color-taupe)", backgroundColor: "transparent" }}>Cancel</button>
								<button onClick={() => { setAdding(false); setNewName(""); }} className="px-4 py-2 rounded text-sm font-semibold transition-colors" style={{ backgroundColor: "var(--color-wine)", color: "var(--color-cream)" }}>Save</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

// ─── Privacy Page ─────────────────────────────────────────────────────────────

function PrivacyPage() {
	const [prefs, setPrefs] = useState({ personalization: true, comms: false, viewingData: true });
	return (
		<div className="space-y-8 pb-6">
			<div>
				<SectionHeading>Privacy Preferences</SectionHeading>
				<div className="space-y-0">
					{[
						{ key: "personalization" as const, label: "Personalization", desc: "Allow StreamFlix to use your viewing history to personalize recommendations." },
						{ key: "viewingData" as const, label: "Viewing Data", desc: "Allow StreamFlix to use your data to improve the service." },
						{ key: "comms" as const, label: "Marketing Communications", desc: "Receive emails about new releases, features, and offers." },
					].map((item, i, arr) => (
						<div key={item.key}>
							<div className="flex items-start justify-between py-4 gap-4">
								<div className="flex-1">
									<p className="text-sm font-medium mb-0.5" style={{ color: "var(--color-cream)" }}>{item.label}</p>
									<p className="text-xs leading-relaxed" style={{ color: "var(--color-taupe)" }}>{item.desc}</p>
								</div>
								<button onClick={() => setPrefs((p) => ({ ...p, [item.key]: !p[item.key] }))} className="relative w-10 h-5 rounded-full transition-colors flex-shrink-0 mt-0.5" style={{ backgroundColor: prefs[item.key] ? "var(--color-wine)" : "var(--color-stone)" }} role="switch" aria-checked={prefs[item.key]} aria-label={`Toggle ${item.label}`}>
									<span className="absolute top-0.5 w-4 h-4 rounded-full transition-transform" style={{ backgroundColor: "var(--color-cream)", transform: prefs[item.key] ? "translateX(20px)" : "translateX(2px)" }} />
								</button>
							</div>
							{i < arr.length - 1 && <Divider />}
						</div>
					))}
				</div>
			</div>
			<Divider />
			<div>
				<button className="text-sm font-medium transition-colors px-4 py-2 rounded" style={{ border: "1px solid var(--color-stone)", color: "var(--color-taupe)", backgroundColor: "transparent" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-taupe)"; e.currentTarget.style.color = "var(--color-cream)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-stone)"; e.currentTarget.style.color = "var(--color-taupe)"; }}>Download Account Data</button>
			</div>
		</div>
	);
}

// ─── Update Payment Modal ─────────────────────────────────────────────────────

function UpdatePaymentModal({ onClose }: { onClose: () => void }) {
	const [card, setCard] = useState("");
	const [exp, setExp] = useState("");
	const [cvv, setCvv] = useState("");
	const [done, setDone] = useState(false);
	function save() {
		if (!card || !exp || !cvv) return;
		setDone(true);
		setTimeout(onClose, 1200);
	}
	return (
		<ModalOverlay onClose={onClose}>
			<ModalBox title="Update Payment Method" onClose={onClose}>
				{done ? (
					<p className="text-sm py-4 text-center" style={{ color: "var(--color-taupe)" }}>Billing information updated.</p>
				) : (
					<>
						<FormField label="Card Number" type="text" value={card} onChange={setCard} placeholder="•••• •••• •••• ••••" />
						<div className="grid grid-cols-2 gap-3">
							<FormField label="Expiry" type="text" value={exp} onChange={setExp} placeholder="MM / YY" />
							<FormField label="CVV" type="password" value={cvv} onChange={setCvv} placeholder="•••" />
						</div>
						<ModalActions onCancel={onClose} onSave={save} saveLabel="Update" />
					</>
				)}
			</ModalBox>
		</ModalOverlay>
	);
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const sidebarItems: { key: Section; label: string; icon: React.ReactNode }[] = [
	{ key: "overview", label: "Overview", icon: <IconHome /> },
	{ key: "membership", label: "Membership", icon: <IconCard /> },
	{ key: "security", label: "Security", icon: <IconShield /> },
	{ key: "devices", label: "Devices", icon: <IconMonitor /> },
	{ key: "profiles", label: "Profiles", icon: <IconUsers /> },
	{ key: "privacy", label: "Privacy", icon: <IconLock /> },
];

function Sidebar({ active, setActive }: { active: Section; setActive: (s: Section) => void; }) {
	return (
		<nav className="w-full md:w-48 lg:w-56 flex-shrink-0" aria-label="Account navigation">
			<ul className="flex md:flex-col gap-0.5">
				{sidebarItems.map((item) => {
					const isActive = item.key === active;
					return (
						<li key={item.key} className="flex-1 md:flex-initial">
							<button onClick={() => setActive(item.key)} className="w-full flex items-center gap-2.5 py-3 px-3 rounded transition-colors relative text-left" style={{ color: isActive ? "var(--color-cream)" : "var(--color-taupe)", backgroundColor: isActive ? "var(--color-wine)" : "transparent" }} onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = "var(--color-cream)"; }} onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = "var(--color-taupe)"; }} aria-current={isActive ? "page" : undefined}>
								{isActive && <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full hidden md:block" style={{ backgroundColor: "var(--color-wine)" }} />}
								<span style={{ color: isActive ? "var(--color-wine)" : "inherit" }}>{item.icon}</span>
								<span className="text-sm font-medium hidden sm:block">{item.label}</span>
							</button>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}

// ─── App ──────────────────────────────────────────────────────────────────────

export function AccountView({ plan, onPlanChange }: { plan: Plan | null; onPlanChange: (plan: Plan) => void }) {
	const [section, setSection] = useState<Section>("overview");
	const [modal, setModal] = useState<Modal>(null);
	const [deleteStep, setDeleteStep] = useState(1);

	const sectionTitles: Record<Section, string> = {
		overview: "Account",
		membership: "Membership",
		security: "Security",
		devices: "Devices",
		profiles: "Profiles",
		privacy: "Privacy",
	};

	return (
		<div className={`min-h-screen ${styles.page}`}>
			<main className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-8 md:pt-6 md:pb-10">
				<h1 className="font-display font-black tracking-wider mb-6 md:mb-8" style={{ color: "var(--color-cream)", fontSize: "clamp(32px, 5vw, 48px)" }}>{sectionTitles[section]}</h1>
				<div className="flex flex-col md:flex-row gap-8 lg:gap-12">
					<Sidebar active={section} setActive={setSection} />
					<div className="flex-1 min-w-0">
						{section === "overview" && <OverviewContent setSection={setSection} setModal={setModal} />}
						{section === "membership" && <MembershipPage setModal={setModal} plan={plan} />}
						{section === "security" && <SecurityPage setModal={setModal} />}
						{section === "devices" && <DevicesPage />}
						{section === "profiles" && <ProfilesPage />}
						{section === "privacy" && <PrivacyPage />}
					</div>
				</div>
			</main>

			{modal === "email" && <ChangeEmailModal onClose={() => setModal(null)} />}
			{modal === "password" && <ChangePasswordModal onClose={() => setModal(null)} />}
			{modal === "phone" && <AddPhoneModal onClose={() => setModal(null)} />}
			{modal === "billing" && <BillingDetailsModal onClose={() => setModal(null)} plan={plan} />}
			{modal === "signout" && <SignOutAllModal onClose={() => setModal(null)} />}
			{modal === "updatePayment" && <UpdatePaymentModal onClose={() => setModal(null)} />}
			{modal === "changePlan" && (
				<div className={styles.subscriptionOverlay}>
					<SubscriptionPage onSubscribe={onPlanChange} onComplete={() => setModal(null)} onBack={() => setModal(null)} />
				</div>
			)}
			{modal === "delete1" && <DeleteAccountModal1 onClose={() => setModal(null)} onContinue={() => { setDeleteStep(2); setModal("delete2"); }} />}
			{modal === "delete2" && deleteStep === 2 && <DeleteAccountModal2 onClose={() => { setModal(null); setDeleteStep(1); }} />}
		</div>
	);
}
