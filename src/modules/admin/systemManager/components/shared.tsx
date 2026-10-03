import { ReactNode } from "react";

export type StatusVariant = "positive" | "warning" | "critical" | "info" | "neutral";

interface StatusBadgeProps {
  label: string;
  variant: StatusVariant;
  dot?: boolean;
}

const variantStyles: Record<StatusVariant, string> = {
  positive: "bg-emerald-900/40 text-emerald-400 border border-emerald-700/40",
  warning: "bg-amber-900/40 text-amber-400 border border-amber-700/40",
  critical: "bg-red-900/40 text-red-400 border border-red-700/40",
  info: "bg-blue-900/40 text-blue-400 border border-blue-700/40",
  neutral: "bg-stone-900/40 text-stone-400 border border-stone-700/40",
};

const dotColors: Record<StatusVariant, string> = {
  positive: "bg-emerald-400",
  warning: "bg-amber-400",
  critical: "bg-red-400",
  info: "bg-blue-400",
  neutral: "bg-stone-400",
};

export function StatusBadge({ label, variant, dot = true }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${variantStyles[variant]}`}
      role="status"
      aria-label={label}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColors[variant]}`}
          aria-hidden="true"
        />
      )}
      {label}
    </span>
  );
}

export function statusVariantFor(label: string): StatusVariant {
  const l = label.toLowerCase();
  if (
    ["operational", "connected", "protected", "successful", "resolved", "completed", "active", "online", "false positive"].some(
      (k) => l.includes(k)
    )
  )
    return "positive";
  if (
    ["degraded", "slow", "warning", "monitoring", "in progress", "new"].some((k) => l.includes(k))
  )
    return "warning";
  if (
    ["offline", "disconnected", "critical", "failed", "cancelled", "unauthorized"].some((k) =>
      l.includes(k)
    )
  )
    return "critical";
  if (["info"].some((k) => l.includes(k))) return "info";
  return "neutral";
}

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Drawer({ open, onClose, title, children, footer }: DrawerProps) {
  if (!open) return null;
  return (
    <>
      <div
        className="drawer-overlay"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="drawer-panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between p-5 border-b border-stone-700/60 flex-shrink-0">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-white transition-colors p-1 rounded focus-ring"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">{children}</div>
        {footer && (
          <div className="p-5 border-t border-stone-700/60 flex gap-3 flex-shrink-0 flex-wrap">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  if (!open) return null;
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal-panel">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-white transition-colors p-1 rounded focus-ring"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="mb-5">{children}</div>
        {footer && <div className="flex gap-3 justify-end flex-wrap">{footer}</div>}
      </div>
    </div>
  );
}

interface DetailRowProps {
  label: string;
  value: ReactNode;
}

export function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-[#9CA3AF] uppercase tracking-wider">{label}</span>
      <span className="text-sm text-white">{value}</span>
    </div>
  );
}

interface PaginationProps {
  page: number;
  total: number;
  perPage: number;
  onPage: (p: number) => void;
  onPerPage: (n: number) => void;
  label: string;
}

export function Pagination({ page, total, perPage, onPage, onPerPage, label }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const start = (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);

  function pages(): (number | "...")[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const result: (number | "...")[] = [1];
    if (page > 3) result.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++)
      result.push(i);
    if (page < totalPages - 2) result.push("...");
    result.push(totalPages);
    return result;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-stone-700/60">
      <div className="flex items-center gap-3 text-xs text-[#9CA3AF]">
        <span>
          Showing {total === 0 ? 0 : start}–{end} of {total} {label}
        </span>
        <select
          value={perPage}
          onChange={(event) => onPerPage(Number(event.target.value))}
          className="select-dark rounded px-2 py-1"
          aria-label={`Rows per page for ${label}`}
        >
          {[10, 25, 50].map((amount) => (
            <option key={amount} value={amount}>{amount} per page</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="w-8 h-8 flex items-center justify-center rounded border border-stone-700 text-[#9CA3AF] hover:border-[#7C3AED] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-ring"
          aria-label="Previous page"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        {pages().map((p, i) =>
          p === "..." ? (
            <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-[#9CA3AF] text-xs">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p as number)}
              className={`w-8 h-8 flex items-center justify-center rounded text-xs transition-colors focus-ring ${
                p === page
                  ? "bg-[#7C3AED] text-white"
                  : "border border-stone-700 text-[#9CA3AF] hover:border-[#7C3AED] hover:text-white"
              }`}
              aria-label={`Page ${p}`}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded border border-stone-700 text-[#9CA3AF] hover:border-[#7C3AED] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-ring"
          aria-label="Next page"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <span
      className="spinner"
      style={{ width: size, height: size }}
      aria-label="Loading"
      role="status"
    />
  );
}

export function LoadingRow({ cols }: { cols: number }) {
  return (
    <tr>
      <td colSpan={cols} className="text-center py-12">
        <div className="flex flex-col items-center gap-3 text-[#9CA3AF]">
          <Spinner size={24} />
          <span className="text-sm">Loading…</span>
        </div>
      </td>
    </tr>
  );
}

export function EmptyRow({ cols, message }: { cols: number; message: string }) {
  return (
    <tr>
      <td colSpan={cols} className="text-center py-12 text-[#9CA3AF] text-sm">
        {message}
      </td>
    </tr>
  );
}

interface SelectProps {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}

export function Select({ value, onChange, options, className = "" }: SelectProps) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-[rgba(26,16,48,0.5)] border border-stone-700 rounded-md pl-3 pr-8 py-2 text-sm text-white focus:outline-none focus:border-[#7C3AED] cursor-pointer w-full"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none"
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-[rgba(26,16,48,0.5)] border border-stone-700 rounded-md pl-9 pr-3 py-2 text-sm text-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED] w-full"
      />
    </div>
  );
}

export function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <p className="text-sm text-[#9CA3AF] mt-1">{description}</p>
    </div>
  );
}

export function ProgressBar({ value, color = "#7C3AED" }: { value: number; color?: string }) {
  return (
    <div className="progress-bar-bg w-full" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div
        className="progress-bar-fill"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }}
      />
    </div>
  );
}
