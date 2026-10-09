import { useEffect, useState } from "react";
import type { Show } from "./types";
import { fetchShowDetails, fetchTrailerKey, fetchSimilar } from "./tmdb";
import styles from "./movie.module.css";
import { useMyList } from "../dashboard/myList/myListStore";

function PlayIcon({ size = 16, color = "var(--color-ink)" }: { size?: number; color?: string }) {
	return (
		<svg width={size} height={size} viewBox="0 0 16 16" fill={color}>
			<polygon points="3,2 13,8 3,14" />
		</svg>
	);
}

function PlusIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
			<line x1="12" y1="5" x2="12" y2="19" />
			<line x1="5" y1="12" x2="19" y2="12" />
		</svg>
	);
}

function CloseIcon() {
	return (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
			<line x1="18" y1="6" x2="6" y2="18" />
			<line x1="6" y1="6" x2="18" y2="18" />
		</svg>
	);
}

function MuteIcon({ muted }: { muted: boolean }) {
	return muted ? (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
			<line x1="23" y1="9" x2="17" y2="15" />
			<line x1="17" y1="9" x2="23" y2="15" />
		</svg>
	) : (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
			<path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
			<path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
		</svg>
	);
}

export default function PreviewModal({
	show,
	onClose,
	onSelect,
	onPlay,
}: {
	show: Show | null;
	onClose: () => void;
	onSelect?: (show: Show) => void;
	onPlay?: (show: Show) => void;
}) {
	const [trailerKey, setTrailerKey] = useState<string | null>(null);
	const [details, setDetails] = useState<Show | null>(null);
	const [muted, setMuted] = useState(true);
	const [similar, setSimilar] = useState<Show[]>([]);
	const [loadingTrailer, setLoadingTrailer] = useState(false);
	const { isSaved, toggle } = useMyList();
	const mediaType = show?.mediaType ?? "movie";

	useEffect(() => {
		if (!show) return;
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [show, onClose]);

	useEffect(() => {
		if (!show) return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => { document.body.style.overflow = prev; };
	}, [show]);

	useEffect(() => {
		if (!show) {
			setDetails(null);
			setTrailerKey(null);
			setSimilar([]);
			return;
		}
		let cancelled = false;
		setDetails(null);
		setTrailerKey(null);
		setSimilar([]);
		setMuted(true);
		setLoadingTrailer(true);

		Promise.all([
			fetchShowDetails(show.id, show.mediaType ?? "movie"),
			fetchTrailerKey(show.id, show.mediaType ?? "movie"),
			fetchSimilar(show.id, show.mediaType ?? "movie"),
		]).then(([fullDetails, key, sim]) => {
			if (cancelled) return;
			setDetails(fullDetails);
			setTrailerKey(key);
			setSimilar(sim);
			setLoadingTrailer(false);
		}).catch(() => {
			if (!cancelled) setLoadingTrailer(false);
		});

		return () => { cancelled = true; };
	}, [show]);

	if (!show) return null;
	const resolvedShow: Show = details
		? {
			...show,
			...details,
			image: details.image || show.image,
			hero: details.hero || show.hero,
		  }
		: show;
	const inList = isSaved(resolvedShow.id, mediaType);

	return (
		<div
			className={`fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-3 sm:p-6 md:p-10 ${styles.overlay}`}
			onClick={onClose}
			role="presentation"
		>
			<div
				className={`relative w-full rounded-xl overflow-hidden shadow-2xl my-4 md:my-8 ${styles.modal}`}
				onClick={(e) => e.stopPropagation()}
				role="dialog"
				aria-modal="true"
				aria-labelledby="preview-modal-title"
			>
				{/* Close button */}
				<button
					onClick={onClose}
					className={`absolute top-4 right-4 z-30 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${styles.closeBtn}`}
					aria-label="Close"
				>
					<CloseIcon />
				</button>

				{/* Media — 45% height via aspect-video */}
				<div className={`relative w-full aspect-video ${styles.mediaBg}`} style={{ maxHeight: "45vh" }}>
					{trailerKey ? (
						<iframe
							key={trailerKey}
							className="absolute inset-0 w-full h-full"
							src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=${muted ? 1 : 0}&controls=0&loop=1&playlist=${trailerKey}&modestbranding=1&rel=0&showinfo=0`}
							title={`${resolvedShow.title} trailer`}
							allow="autoplay; encrypted-media"
							allowFullScreen
						/>
					) : (
						<img
							src={resolvedShow.hero ?? resolvedShow.image}
							alt={resolvedShow.title}
							className="absolute inset-0 w-full h-full object-cover"
						/>
					)}

					<div className={`absolute inset-0 pointer-events-none ${styles.mediaGradient}`} />

					<div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 flex items-end justify-between gap-3">
						<div>
							<h2 id="preview-modal-title" className={`uppercase leading-none tracking-tight mb-3 text-2xl md:text-4xl ${styles.modalTitle}`}>
								{resolvedShow.title}
							</h2>
							<div className="flex items-center gap-3 flex-wrap">
								<button
									onClick={() => onPlay?.(resolvedShow)}
									className={`flex items-center gap-2 px-5 md:px-6 py-2 font-bold transition-all duration-150 text-sm md:text-base ${styles.filledBtn}`}
								>
									<PlayIcon />
									Play
								</button>
								<button
									onClick={() => toggle(resolvedShow.id, mediaType, resolvedShow)}
									className={`w-9 h-9 md:w-10 md:h-10 rounded-full border flex items-center justify-center transition-colors ${styles.circleBtn}`}
									aria-label={inList ? "Remove from list" : "Add to list"}
								>
									{inList ? "✓" : <PlusIcon />}
								</button>
							</div>
						</div>

						{trailerKey && (
							<button
								onClick={() => setMuted((m) => !m)}
								className={`w-9 h-9 md:w-10 md:h-10 rounded-full border flex items-center justify-center transition-colors flex-shrink-0 ${styles.circleBtn}`}
								aria-label={muted ? "Unmute" : "Mute"}
							>
								<MuteIcon muted={muted} />
							</button>
						)}
					</div>
				</div>

				{/* Details */}
				<div className={`p-4 md:p-8 ${styles.detailsWrap}`}>
					<div className="grid md:grid-cols-3 gap-6">
						<div className="md:col-span-2">
							<div className="flex items-center gap-3 mb-3 flex-wrap">
								{typeof resolvedShow.match === "number" && (
									<span className={`font-semibold text-sm ${styles.matchText}`}>{resolvedShow.match}% Match</span>
								)}
								<span className={`text-sm ${styles.metaText}`}>{resolvedShow.year}</span>
								{resolvedShow.rating && (
									<span className={`text-xs px-1.5 py-0.5 border rounded ${styles.badge}`}>{resolvedShow.rating}</span>
								)}
								{resolvedShow.duration && (
									<span className={`text-sm ${styles.metaText}`}>{resolvedShow.duration}</span>
								)}
								{!trailerKey && !loadingTrailer && (
									<span className={`text-xs italic ${styles.noTrailerText}`}>No trailer available</span>
								)}
							</div>
							<p className={`text-sm md:text-base leading-relaxed ${styles.descriptionText}`}>
								{resolvedShow.description || "No description available."}
							</p>
						</div>
						<div className={`text-sm space-y-2 ${styles.genresText}`}>
							{resolvedShow.genres.length > 0 && (
								<p>
									<span className={styles.genresLabel}>Genres: </span>
									{resolvedShow.genres.join(", ")}
								</p>
							)}
						</div>
					</div>

					{similar.length > 0 && (
						<div className="mt-8">
							<h3 className={`font-bold text-lg md:text-xl tracking-wide mb-4 ${styles.similarHeading}`}>
								More Like This
							</h3>
							<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
								{similar.map((s) => (
									<div
										key={s.id}
										onClick={() => onSelect?.(s)}
										className={`cursor-pointer group ${styles.similarCard}`}
									>
										<div className="relative overflow-hidden" style={{ aspectRatio: "16/9" }}>
											<img
												src={s.hero ?? s.image}
												alt={s.title}
												className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
											/>
										</div>
										<div className="p-2">
											<div className="flex items-center justify-between mb-1">
												{typeof s.match === "number" && (
													<span className={`text-xs font-semibold ${styles.matchText}`}>{s.match}% Match</span>
												)}
												<span className={`text-xs px-1 border rounded ${styles.badge}`}>{s.rating}</span>
											</div>
											<p className={`text-xs line-clamp-2 ${styles.similarDesc}`}>{s.description}</p>
										</div>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
