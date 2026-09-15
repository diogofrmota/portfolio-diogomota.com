'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { appSections } from '../../lib/app-sections';
import { signOutAccount } from '../auth-actions';
import styles from './product-header.module.css';

function SignOutButton() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending}>{pending ? 'Signing out…' : 'Sign out'}</button>;
}

export default function ProductHeader({ user, app, theme, onThemeChange }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState('');
  const config = appSections[app];
  useEffect(() => {
    const update = () => { setSection(window.location.hash.slice(1)); setOpen(false); };
    update();
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, [pathname]);
  const account = useRef(null);
  const trigger = useRef(null);
  const label = user?.name || user?.email || 'Your account';

  useEffect(() => {
    if (!open) return;
    function dismiss(event) {
      if (!account.current?.contains(event.target)) setOpen(false);
    }
    function escape(event) {
      if (event.key === 'Escape') {
        setOpen(false);
        trigger.current?.focus();
      }
    }
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('focusin', dismiss);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('focusin', dismiss);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  return (
    <header className={styles.header}>
      <a className={styles.skip} href="#product-content">Skip to content</a>
      <Link className={styles.brand} href={app ? `/${app}` : '/apps'} onClick={() => setOpen(false)}>
        {app === 'tvsync' ? <>Tv<span>Sync</span></> : app === 'couple-planner' ? <><span className={styles.mark} aria-hidden="true">&#9825;</span>Couple Planner</> : app === 'fithub' ? <><svg className={styles.mark} aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6v12M3 9v6M18 6v12M21 9v6M6 12h12" /></svg>FitHub</> : <>dm<span> / apps</span></>}
      </Link>
      {config ? <nav className={styles.apps} aria-label={`${config.name} navigation`}>
        {config.sections.map(([id, title], index) => <a key={id} href={`/${app}#${id}`} aria-current={pathname === `/${app}` && (section === id || (!section && index === 0)) ? 'page' : undefined} onClick={() => setOpen(false)}>{title}</a>)}
      </nav> : <div />}
      <div className={styles.account} ref={account}>
        <button ref={trigger} className={styles.trigger} type="button" aria-expanded={open} aria-controls="product-account" onClick={() => setOpen(!open)}>
          Account
        </button>
        {open && <section id="product-account" className={styles.panel} aria-label="Your shared account">
          <strong>{label}</strong>
          {user?.email && <span>{user.email}</span>}
          <p>One account for all three apps.</p>
          <Link href="/apps" onClick={() => setOpen(false)}>Change app</Link>
          {onThemeChange && <fieldset className={styles.themes}><legend>Theme</legend>{['light', 'dark'].map((value) => <button key={value} type="button" aria-pressed={theme === value} onClick={() => { onThemeChange(value); setOpen(false); trigger.current?.focus(); }}>{value === 'light' ? 'Light' : 'Dark'}{theme === value && <span aria-hidden="true"> &#10003;</span>}</button>)}</fieldset>}
          <form action={signOutAccount} data-account-signout><SignOutButton /></form>
        </section>}
      </div>
    </header>
  );
}
