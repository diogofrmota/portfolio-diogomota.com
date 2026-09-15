'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { toggleEpisodeProgress } from './actions';
import styles from './season-detail.module.css';

const imageUrl = (path) => path ? `https://image.tmdb.org/t/p/w500${path}` : null;

export default function SeasonDetail({ show, season, initialWatched }) {
  const [watched, setWatched] = useState(() => new Set(initialWatched));
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();
  const watchedCount = useMemo(() => season.episodes.filter((episode) => watched.has(`${season.seasonNumber}:${episode.number}`)).length, [season, watched]);
  const percentage = season.episodes.length ? Math.round((watchedCount / season.episodes.length) * 100) : 0;
  function toggle(episode) {
    const key = `${season.seasonNumber}:${episode.number}`;
    const nextWatched = !watched.has(key);
    setWatched((current) => { const next = new Set(current); if (nextWatched) next.add(key); else next.delete(key); return next; });
    startTransition(async () => {
      try { await toggleEpisodeProgress({ showId: show.id, seasonNumber: season.seasonNumber, episodeNumber: episode.number, watched: nextWatched }); }
      catch { setWatched((current) => { const next = new Set(current); if (nextWatched) next.delete(key); else next.add(key); return next; }); setMessage('Could not save episode progress.'); window.setTimeout(() => setMessage(''), 2200); }
    });
  }
  return <div className={styles.app}><div className={styles.container}><div className={styles.topbar}><Link href={`/tvsync/tv/${show.id}`}>← {show.title}</Link></div><section className={styles.header}><div className={styles.poster}>{imageUrl(season.posterPath) ? <Image src={imageUrl(season.posterPath)} alt={`${season.name} poster`} fill priority sizes="150px" /> : <span>S{season.seasonNumber}</span>}</div><div><span>Episode tracker</span><h1>{season.name}</h1><p>{season.overview || `Track every episode of ${show.title}.`}</p><div className={styles.progressText}><strong>{watchedCount}/{season.episodes.length}</strong> episodes watched · {percentage}%</div><div className={styles.progress}><i style={{ width: `${percentage}%` }} /></div></div></section><section className={styles.episodes}>{season.episodes.map((episode) => { const key = `${season.seasonNumber}:${episode.number}`; const isWatched = watched.has(key); return <article className={isWatched ? styles.watched : ''} key={episode.id}><div className={styles.still}>{imageUrl(episode.stillPath) ? <Image src={imageUrl(episode.stillPath)} alt="" fill sizes="220px" /> : <span>Episode {episode.number}</span>}</div><div className={styles.copy}><small>Episode {episode.number} {episode.airDate && `· ${episode.airDate}`}</small><h2>{episode.name}</h2><p>{episode.overview || 'Episode details are not available yet.'}</p></div><button type="button" disabled={isPending} onClick={() => toggle(episode)} aria-pressed={isWatched}><span>{isWatched ? '✓' : ''}</span>{isWatched ? 'Seen' : 'Mark seen'}</button></article>; })}{!season.episodes.length && <div className={styles.empty}>Episode information requires a configured TMDB API key.</div>}</section></div>{message && <div className={styles.toast} role="status">{message}</div>}</div>;
}
