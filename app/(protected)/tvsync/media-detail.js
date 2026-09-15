'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { saveMediaRating, toggleLibraryItem, updateLibraryItem } from './actions';
import styles from './media-detail.module.css';

function Icon({ name, filled = false }) {
  const paths = {
    back: <path d="m15 18-6-6 6-6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    check: <path d="m5 12 4 4L19 6" />,
    heart: <path d="M20.8 5.4a5.1 5.1 0 0 0-7.2 0L12 7l-1.6-1.6a5.1 5.1 0 0 0-7.2 7.2L12 21l8.8-8.4a5.1 5.1 0 0 0 0-7.2Z" />,
    star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />,
    play: <path d="m9 7 8 5-8 5V7Z" />,
    chevron: <path d="m9 18 6-6-6-6" />,
  };
  return <svg width="19" height="19" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

const imageUrl = (path, size = 'w500') => path ? `https://image.tmdb.org/t/p/${size}${path}` : null;

export default function MediaDetail({ media, initialPersonal }) {
  const [library, setLibrary] = useState(initialPersonal.library);
  const [rating, setRating] = useState(initialPersonal.rating);
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();
  const statusOptions = media.mediaType === 'movie' ? [['planned', 'Plan to watch'], ['completed', 'Watched']] : [['planned', 'Plan to watch'], ['watching', 'Watching'], ['completed', 'Completed'], ['paused', 'Paused'], ['dropped', 'Dropped']];

  function toggleLibrary() {
    const previous = library;
    setLibrary((current) => current ? null : { watchStatus: 'planned', favorite: false });
    startTransition(async () => {
      try { const result = await toggleLibraryItem(media); setMessage(result.saved ? 'Added to your library' : 'Removed from your library'); }
      catch { setLibrary(previous); setMessage('Could not update your library.'); }
      finally { window.setTimeout(() => setMessage(''), 2400); }
    });
  }

  function updateLibrary(changes) {
    const next = { ...library, ...changes };
    const previous = library;
    setLibrary(next);
    startTransition(async () => {
      try { await updateLibraryItem({ id: media.id, mediaType: media.mediaType, watchStatus: next.watchStatus, favorite: next.favorite }); setMessage('Library updated'); }
      catch { setLibrary(previous); setMessage('Could not save that change.'); }
      finally { window.setTimeout(() => setMessage(''), 2200); }
    });
  }

  function submitRating(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(async () => {
      try { const saved = await saveMediaRating({ id: media.id, mediaType: media.mediaType, rating: form.get('rating'), review: form.get('review') }); setRating(saved); setMessage('Your review is saved'); }
      catch (error) { setMessage(error.message || 'Could not save your review.'); }
      finally { window.setTimeout(() => setMessage(''), 2400); }
    });
  }

  return <div className={styles.app}>
    {imageUrl(media.backdropPath, 'original') && <div className={styles.backdrop}><Image src={imageUrl(media.backdropPath, 'original')} alt="" fill priority sizes="100vw" /></div>}
    <div className={styles.shade} />
    <div className={styles.container}>
      <div className={styles.topbar}><Link href="/tvsync"><Icon name="back" />Back to TVSync</Link></div>
      <section className={styles.hero}>
        <div className={styles.poster}>{imageUrl(media.posterPath) ? <Image src={imageUrl(media.posterPath)} alt={`${media.title} poster`} fill priority sizes="(max-width: 640px) 34vw, 230px" /> : <div>{media.title}</div>}</div>
        <div className={styles.copy}><span>{media.mediaType === 'movie' ? 'Movie' : 'TV show'} {media.year && `· ${media.year}`}</span><h1>{media.title}</h1>{media.tagline && <p className={styles.tagline}>{media.tagline}</p>}<div className={styles.facts}>{media.voteAverage > 0 && <strong><Icon name="star" filled />{Number(media.voteAverage).toFixed(1)} <small>TMDB</small></strong>}{media.status && <span>{media.status}</span>}{media.runtime && <span>{media.runtime} min</span>}{media.genres.map((genre) => <span key={genre}>{genre}</span>)}</div><p className={styles.overview}>{media.overview || 'More information will be available soon.'}</p><div className={styles.actions}><button className={library ? styles.lightButton : styles.goldButton} type="button" disabled={isPending} onClick={toggleLibrary}><Icon name={library ? 'check' : 'plus'} />{library ? 'In my library' : `Add ${media.mediaType === 'movie' ? 'movie' : 'TV show'}`}</button>{media.trailerUrl && <a href={media.trailerUrl} target="_blank" rel="noopener noreferrer"><Icon name="play" filled />Watch trailer</a>}{library && <button className={`${styles.heartButton} ${library.favorite ? styles.favorite : ''}`} type="button" onClick={() => updateLibrary({ favorite: !library.favorite })}><Icon name="heart" filled={library.favorite} />{library.favorite ? 'Favourite' : 'Add favourite'}</button>}</div>{library && <label className={styles.status}>Watch status<select value={library.watchStatus} onChange={(event) => updateLibrary({ watchStatus: event.target.value })}>{statusOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>}</div>
      </section>
      {media.mediaType === 'tv' && media.seasons.length > 0 && <section className={styles.section}><div className={styles.sectionTitle}><div><span>Episode tracker</span><h2>Seasons</h2></div><p>{initialPersonal.watchedEpisodes.length} episodes watched</p></div><div className={styles.seasons}>{media.seasons.map((season) => <Link href={`/tvsync/tv/${media.id}/season/${season.number}`} key={season.id}><div className={styles.seasonPoster}>{imageUrl(season.posterPath) ? <Image src={imageUrl(season.posterPath)} alt="" fill sizes="120px" /> : <span>S{season.number}</span>}</div><div><strong>{season.name}</strong><small>{season.episodeCount} episodes {season.airDate && `· ${season.airDate.slice(0, 4)}`}</small></div><Icon name="chevron" /></Link>)}</div></section>}
      <section className={styles.section}><div className={styles.sectionTitle}><div><span>Your take</span><h2>Rating & review</h2></div>{rating && <strong><Icon name="star" filled />{rating.rating.toFixed(1)}</strong>}</div><form className={styles.reviewForm} onSubmit={submitRating}><label>Rating out of 10<input name="rating" type="number" min="0" max="10" step="0.1" defaultValue={rating?.rating ?? ''} placeholder="8.5" required /></label><label>Your review<textarea name="review" maxLength="1000" rows="5" defaultValue={rating?.review || ''} placeholder="What did you think?" /></label><button type="submit" disabled={isPending}>{isPending ? 'Saving…' : rating ? 'Update review' : 'Save review'}</button></form></section>
      {(media.crew.length > 0 || media.cast.length > 0) && <section className={styles.section}><div className={styles.sectionTitle}><div><span>Credits</span><h2>Cast & crew</h2></div></div>{media.crew.length > 0 && <p className={styles.director}>Directed by {media.crew.map((person) => person.name).join(', ')}</p>}<div className={styles.cast}>{media.cast.map((person) => <article key={person.id}><div>{imageUrl(person.profilePath, 'w185') ? <Image src={imageUrl(person.profilePath, 'w185')} alt="" fill sizes="90px" /> : <span>{person.name.charAt(0)}</span>}</div><strong>{person.name}</strong><small>{person.character}</small></article>)}</div></section>}
    </div>{message && <div className={styles.toast} role="status">{message}</div>}
  </div>;
}
