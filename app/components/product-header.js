'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { apps } from '../../lib/app-navigation';
import { signOutAccount } from '../auth-actions';
import styles from './product-header.module.css';

function SignOutButton() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending}>{pending ? 'Signing out…' : 'Sign out'}</button>;
}

export default function ProductHeader({ user }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
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
      <Link className={styles.brand} href="/apps" onClick={() => setOpen(false)} aria-label="dm / apps — product home">dm<span> / apps</span></Link>
      <nav className={styles.apps} aria-label="Switch apps">
        {apps.map((app) => {
          const active = pathname === app.href || pathname.startsWith(`${app.href}/`);
          return (
            <Link key={app.href} href={app.href} aria-current={active ? 'page' : undefined} onClick={() => setOpen(false)}>
              <span className={`${styles.dot} ${styles[app.color]}`} aria-hidden="true" />
              {app.name}
            </Link>
          );
        })}
      </nav>
      <div className={styles.account} ref={account}>
        <button ref={trigger} className={styles.trigger} type="button" aria-expanded={open} aria-controls="product-account" aria-label={`Account: ${label}`} onClick={() => setOpen(!open)}>
          <span className={styles.avatar} aria-hidden="true">{label.charAt(0).toUpperCase()}</span>
          <span className={styles.accountLabel}>Account</span>
          <span aria-hidden="true">⌄</span>
        </button>
        {open && <section id="product-account" className={styles.panel} aria-label="Your shared account">
          <strong>{label}</strong>
          {user?.email && <span>{user.email}</span>}
          <p>One account for all three apps.</p>
          <Link href="/apps" onClick={() => setOpen(false)}>All apps</Link>
          <form action={signOutAccount}><SignOutButton /></form>
        </section>}
      </div>
    </header>
  );
}
