'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { searchMedia, toggleLibraryItem, updateLibraryItem } from './actions';
import styles from './tvsync.module.css';

const navItems = [
  { id: 'explore', label: 'Explore', icon: 'compass' },
  { id: 'movies', label: 'Movies', icon: 'film' },
  { id: 'tv', label: 'TV Shows', icon: 'tv' },
  { id: 'library', label: 'My Library', icon: 'bookmark' },
];

function Icon({ name, size = 20, filled = false }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    compass: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" /></>,
    film: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 4v16M17 4v16M3 9h4M17 9h4M3 15h4M17 15h4" /></>,
    tv: <><rect x="3" y="6" width="18" height="14" rx="2" /><path d="m8 2 4 4 4-4" /></>,
    bookmark: <path d="M6 3h12v18l-6-4-6 4V3Z" />,
    plus: <path d="M12 5v14M5 12h14" />,
    check: <path d="m5 12 4 4L19 6" />,
    play: <path d="m9 7 8 5-8 5V7Z" />,
    star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />,
    heart: <path d="M20.8 5.4a5.1 5.1 0 0 0-7.2 0L12 7l-1.6-1.6a5.1 5.1 0 0 0-7.2 7.2L12 21l8.8-8.4a5.1 5.1 0 0 0 0-7.2Z" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    chevron: <path d="m9 18 6-6-6-6" />,
  };
  return <svg className={styles.icon} width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function mediaKey(item) { return `${item.mediaType}:${item.id}`; }
function posterUrl(path) { return path ? `https://image.tmdb.org/t/p/w500${path}` : null; }
function backdropUrl(path) { return path ? `https://image.tmdb.org/t/p/original${path}` : null; }

function Poster({ item, priority = false }) {
  const src = posterUrl(item.posterPath);
  return <div className={styles.poster}>{src ? <Image src={src} alt={`${item.title} poster`} fill sizes="(max-width: 640px) 42vw, (max-width: 1100px) 25vw, 190px" priority={priority} /> : <div className={styles.posterFallback}><Icon name={item.mediaType === 'movie' ? 'film' : 'tv'} size={30} /><span>{item.title}</span></div>}</div>;
}

function MediaCard({ item, saved, pending, onOpen, onToggle }) {
  return (
    <article className={styles.mediaCard}>
      <button className={styles.posterButton} type="button" onClick={() => onOpen(item)} aria-label={`View ${item.title}`}><Poster item={item} /></button>
      <button className={`${styles.saveButton} ${saved ? styles.saved : ''}`} type="button" disabled={pending} onClick={() => onToggle(item)} aria-label={`${saved ? 'Remove' : 'Add'} ${item.title} ${saved ? 'from' : 'to'} library`} aria-pressed={saved}><Icon name={saved ? 'check' : 'plus'} size={17} /></button>
      <div className={styles.mediaCopy}><button type="button" onClick={() => onOpen(item)}><h3>{item.title}</h3></button><div><span>{item.year || 'Coming soon'}</span><span>{item.mediaType === 'movie' ? 'Movie' : 'TV show'}</span>{item.voteAverage > 0 && <span className={styles.rating}><Icon name="star" size={12} filled />{Number(item.voteAverage).toFixed(1)}</span>}</div></div>
    </article>
  );
}

function Rail({ title, copy, items, libraryKeys, pendingKey, onOpen, onToggle }) {
  if (!items.length) return null;
  return <section className={styles.rail}><div className={styles.sectionTitle}><div><h2>{title}</h2><p>{copy}</p></div><span>{items.length} titles</span></div><div className={styles.posterGrid}>{items.map((item) => <MediaCard item={item} saved={libraryKeys.has(mediaKey(item))} pending={pendingKey === mediaKey(item)} onOpen={onOpen} onToggle={onToggle} key={mediaKey(item)} />)}</div></section>;
}

function Details({ item, libraryItem, pending, onClose, onToggle, onUpdate }) {
  const dialogRef = useRef(null);
  const saved = Boolean(libraryItem);
  const statusOptions = item.mediaType === 'movie' ? [['planned', 'Plan to watch'], ['completed', 'Watched']] : [['planned', 'Plan to watch'], ['watching', 'Watching'], ['completed', 'Completed'], ['paused', 'Paused'], ['dropped', 'Dropped']];
  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.querySelector('button')?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') { onClose(); return; }
      if (event.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll('a[href], button:not([disabled]), select:not([disabled])');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, [onClose]);
  return <div className={styles.backdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section ref={dialogRef} className={styles.details} role="dialog" aria-modal="true" aria-labelledby="media-title"><button className={styles.closeButton} type="button" onClick={onClose} aria-label="Close details"><Icon name="close" /></button>{backdropUrl(item.backdropPath) && <div className={styles.detailBackdrop}><Image src={backdropUrl(item.backdropPath)} alt="" fill sizes="720px" /></div>}<div className={styles.detailContent}><div className={styles.detailPoster}><Poster item={item} priority /></div><div className={styles.detailCopy}><span className={styles.mediaType}>{item.mediaType === 'movie' ? 'Movie' : 'TV Show'} {item.year && `· ${item.year}`}</span><h2 id="media-title">{item.title}</h2>{item.voteAverage > 0 && <div className={styles.detailRating}><Icon name="star" filled size={17} />{Number(item.voteAverage).toFixed(1)} <small>TMDB rating</small></div>}<p>{item.overview || 'More information will be available soon.'}</p><div className={styles.detailActions}><Link className={styles.openLink} href={`/tvsync/${item.mediaType === 'movie' ? 'movie' : 'tv'}/${item.id}`}>Full details <Icon name="chevron" size={17} /></Link><button className={saved ? styles.secondaryButton : styles.goldButton} type="button" disabled={pending} onClick={() => onToggle(item)}><Icon name={saved ? 'check' : 'plus'} size={17} />{saved ? 'In my library' : `Add ${item.mediaType === 'movie' ? 'movie' : 'TV show'}`}</button>{saved && <button className={`${styles.favoriteButton} ${libraryItem.favorite ? styles.favorite : ''}`} type="button" onClick={() => onUpdate(item, { ...libraryItem, favorite: !libraryItem.favorite })} aria-pressed={libraryItem.favorite}><Icon name="heart" size={18} filled={libraryItem.favorite} />{libraryItem.favorite ? 'Favourite' : 'Add favourite'}</button>}</div>{saved && <label className={styles.statusLabel}>Watch status<select value={libraryItem.watchStatus} onChange={(event) => onUpdate(item, { ...libraryItem, watchStatus: event.target.value })}>{statusOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>}</div></div></section></div>;
}

export default function TVSyncDashboard({ discovery, initialLibrary, tmdbConfigured }) {
  const [active, setActive] = useState('explore');
  const [library, setLibrary] = useState(initialLibrary);
  const [selected, setSelected] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [pendingKey, setPendingKey] = useState('');
  const [isPending, startTransition] = useTransition();
  const libraryKeys = useMemo(() => new Set(library.map(mediaKey)), [library]);
  const libraryByKey = useMemo(() => new Map(library.map((item) => [mediaKey(item), item])), [library]);
  const featured = discovery[0];
  const movies = discovery.filter((item) => item.mediaType === 'movie');
  const shows = discovery.filter((item) => item.mediaType === 'tv');

  function switchView(view) { setActive(view); setSearchResults(null); setSearchQuery(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function toggleItem(item) {
    const key = mediaKey(item);
    const previous = library;
    const existing = libraryByKey.get(key);
    setPendingKey(key);
    setLibrary((current) => existing ? current.filter((entry) => mediaKey(entry) !== key) : [{ ...item, watchStatus: 'planned', favorite: false, dateAdded: new Date().toISOString() }, ...current]);
    startTransition(async () => {
      try { await toggleLibraryItem(item); setNotice(existing ? 'Removed from your library' : 'Added to your library'); }
      catch { setLibrary(previous); setNotice('Could not update your library. Try again.'); }
      finally { setPendingKey(''); window.setTimeout(() => setNotice(''), 2600); }
    });
  }
  function updateItem(item, changes) {
    const key = mediaKey(item);
    const previous = library;
    setLibrary((current) => current.map((entry) => mediaKey(entry) === key ? { ...entry, watchStatus: changes.watchStatus, favorite: changes.favorite } : entry));
    startTransition(async () => {
      try { await updateLibraryItem({ id: item.id, mediaType: item.mediaType, watchStatus: changes.watchStatus, favorite: changes.favorite }); setNotice('Library updated'); }
      catch { setLibrary(previous); setNotice('Could not save that change.'); }
      finally { window.setTimeout(() => setNotice(''), 2200); }
    });
  }
  function submitSearch(event) {
    event.preventDefault();
    const query = searchQuery.trim();
    if (query.length < 2) return;
    startTransition(async () => {
      try {
        setSearchResults(await searchMedia(query));
      } catch {
        setSearchResults([]);
        setNotice('Search is temporarily unavailable.');
        window.setTimeout(() => setNotice(''), 2600);
      }
    });
  }

  const visible = active === 'movies' ? movies : active === 'tv' ? shows : library;
  const currentSelected = selected ? libraryByKey.get(mediaKey(selected)) : null;

  return (
    <div className={styles.app}>
      <header className={styles.header}><button className={styles.logo} type="button" onClick={() => switchView('explore')}>Tv<span>Sync</span></button><nav aria-label="TVSync navigation">{navItems.map((item) => <button className={active === item.id ? styles.activeNav : ''} type="button" aria-current={active === item.id ? "page" : undefined} key={item.id} onClick={() => switchView(item.id)}><Icon name={item.icon} size={18} />{item.label}{item.id === 'library' && library.length > 0 && <small>{library.length}</small>}</button>)}</nav></header>
      <div className={styles.main}>
        <form className={styles.search} role="search" onSubmit={submitSearch}><Icon name="search" /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search movies and TV shows" aria-label="Search movies and TV shows" /><button type="submit" disabled={isPending || searchQuery.trim().length < 2}>{isPending ? 'Searching…' : 'Search'}</button></form>
        {!tmdbConfigured && <div className={styles.configurationNote}><strong>Catalogue unavailable</strong><span>Discovery and search will return when the media service is configured.</span></div>}
        {!featured && searchResults === null && active === 'explore' && <div className={styles.empty}><Icon name="compass" size={30} /><h2>No catalogue titles available</h2><p>Your personal library is still available. Discovery requires the media service.</p><button type="button" onClick={() => switchView('library')}>Open my library <Icon name="chevron" size={16} /></button></div>}
        {searchResults !== null ? <section className={styles.results}><div className={styles.pageTitle}><div><span>Search</span><h1>Results for “{searchQuery}”</h1></div><button type="button" onClick={() => { setSearchResults(null); setSearchQuery(''); }}>Clear search</button></div>{searchResults.length ? <div className={styles.posterGrid}>{searchResults.map((item) => <MediaCard item={item} saved={libraryKeys.has(mediaKey(item))} pending={pendingKey === mediaKey(item)} onOpen={setSelected} onToggle={toggleItem} key={mediaKey(item)} />)}</div> : <div className={styles.empty}><Icon name="search" size={28} /><h2>No titles found</h2><p>Try a different movie or show name.</p></div>}</section> : active === 'explore' ? <>{featured && <section className={styles.hero}>{backdropUrl(featured.backdropPath) && <Image src={backdropUrl(featured.backdropPath)} alt="" fill priority sizes="(max-width: 1200px) 100vw, 1200px" />}<div className={styles.heroShade} /><div className={styles.heroContent}><span className={styles.mediaType}>Featured {featured.mediaType === 'movie' ? 'movie' : 'TV show'}</span><h1>{featured.title}</h1>{featured.voteAverage > 0 && <div className={styles.heroRating}><Icon name="star" filled size={17} />{Number(featured.voteAverage).toFixed(1)} <small>TMDB</small></div>}<p>{featured.overview}</p><div><button className={styles.goldButton} type="button" onClick={() => setSelected(featured)}><Icon name="play" filled size={17} />View details</button><button className={styles.secondaryButton} type="button" onClick={() => toggleItem(featured)}><Icon name={libraryKeys.has(mediaKey(featured)) ? 'check' : 'plus'} size={17} />{libraryKeys.has(mediaKey(featured)) ? 'In my library' : 'Add to library'}</button></div></div></section>}<Rail title="Trending now" copy="The titles everyone is talking about." items={discovery.slice(0, 6)} libraryKeys={libraryKeys} pendingKey={pendingKey} onOpen={setSelected} onToggle={toggleItem} /><Rail title="Movies worth watching" copy="Find the next film for your list." items={movies.slice(0, 6)} libraryKeys={libraryKeys} pendingKey={pendingKey} onOpen={setSelected} onToggle={toggleItem} /><Rail title="TV shows to start next" copy="One episode is all it takes." items={shows.slice(0, 6)} libraryKeys={libraryKeys} pendingKey={pendingKey} onOpen={setSelected} onToggle={toggleItem} /></> : <section className={styles.browse}><div className={styles.pageTitle}><div><span>{active === 'library' ? 'Your collection' : 'Discover'}</span><h1>{navItems.find((item) => item.id === active)?.label}</h1><p>{active === 'library' ? 'Everything you saved, with progress that follows you.' : `Browse trending ${active === 'movies' ? 'films' : 'series'} and save what looks good.`}</p></div>{active === 'library' && <strong>{library.length} {library.length === 1 ? 'title' : 'titles'}</strong>}</div>{visible.length ? <div className={styles.posterGrid}>{visible.map((item) => <MediaCard item={item} saved={libraryKeys.has(mediaKey(item))} pending={pendingKey === mediaKey(item)} onOpen={setSelected} onToggle={toggleItem} key={mediaKey(item)} />)}</div> : <div className={styles.empty}><Icon name="bookmark" size={30} /><h2>Your library is waiting</h2><p>Save a movie or TV show and it will appear here on every device.</p><button type="button" onClick={() => switchView('explore')}>Explore titles <Icon name="chevron" size={16} /></button></div>}</section>}
      </div>
      <nav className={styles.mobileNav} aria-label="TVSync mobile navigation">{navItems.map((item) => <button className={active === item.id ? styles.activeMobileNav : ''} type="button" aria-current={active === item.id ? "page" : undefined} key={item.id} onClick={() => switchView(item.id)}><Icon name={item.icon} size={19} /><span>{item.id === 'library' ? 'Library' : item.label}</span></button>)}</nav>
      {selected && <Details item={selected} libraryItem={currentSelected} pending={pendingKey === mediaKey(selected)} onClose={() => setSelected(null)} onToggle={toggleItem} onUpdate={updateItem} />}
      {notice && <div className={styles.toast} role="status">{notice}</div>}
    </div>
  );
}
