import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth, signOut } from '../../auth';
import { apps, safeAppPath } from '../../lib/app-navigation';
import styles from '../entry.module.css';

export const metadata = { title: 'Choose an app' };

function AppIcon({ icon }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icon === 'tv' ? (
        <>
          <rect x="9" y="16" width="46" height="33" rx="7" />
          <path d="m24 7 8 9 8-9M26 56h12" />
          <path d="m28 26 12 7-12 7Z" />
        </>
      ) : icon === 'calendar' ? (
        <>
          <rect x="11" y="14" width="42" height="42" rx="7" />
          <path d="M21 8v12M43 8v12M11 27h42M32 48s-13-7-9-12c3-4 7-1 9 2 2-3 6-6 9-2 4 5-9 12-9 12Z" />
        </>
      ) : (
        <>
          <path d="M21 17v30M13 23v18M43 17v30M51 23v18M21 32h22M7 32h6M51 32h6" />
        </>
      )}
    </svg>
  );
}

export default async function SelectApp({ searchParams }) {
  const callbackUrl = safeAppPath((await searchParams).callbackUrl);
  const session = await auth();
  if (!session?.user)
    redirect(
      callbackUrl
        ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
        : '/login'
    );
  const firstName = session.user.name?.trim().split(/\s+/)[0];

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/">
          dm<span> / apps</span>
        </Link>
        <div className={styles.account}>
          <span className={styles.accountName}>
            {session.user.name || session.user.email}
          </span>
          <form
            action={async () => {
              'use server';
              await signOut({ redirectTo: '/login' });
            }}
          >
            <button className={styles.signOut}>Sign out</button>
          </form>
        </div>
      </header>
      <main className={styles.selectionMain}>
        <p className={styles.eyebrow}>
          {firstName
            ? `WELCOME, ${firstName.toUpperCase()}`
            : 'WELCOME TO YOUR APPS'}
        </p>
        <h1>What’s the plan?</h1>
        <p className={styles.selectionCopy}>Pick an app. Make it your own.</p>
        <div className={styles.appGrid}>
          {apps.map((app) => {
            const destinationPath = callbackUrl?.split(/[?#]/, 1)[0];
            const suggested =
              destinationPath === app.href ||
              destinationPath?.startsWith(`${app.href}/`);
            return (
              <Link
                key={app.href}
                className={styles.appLink}
                href={suggested ? callbackUrl : app.href}
              >
                <span className={`${styles.appTile} ${styles[app.color]}`}>
                  <span className={styles.tileCategory}>{app.category}</span>
                  <AppIcon icon={app.icon} />
                  <span className={styles.tileArrow} aria-hidden="true">
                    ↗
                  </span>
                </span>
                <span className={styles.appName}>{app.name}</span>
                <span className={styles.appDescription}>{app.description}</span>
                {suggested && (
                  <span className={styles.suggested}>
                    Continue where you were headed{' '}
                    <span aria-hidden="true">→</span>
                  </span>
                )}
              </Link>
            );
          })}
        </div>
        <p className={styles.selectionNote}>
          Your account goes with you. Switch apps anytime.
        </p>
      </main>
      <footer className={styles.footer}>
        Made by Diogo Mota
        <Link href="/">
          Back to home <span aria-hidden="true">↗</span>
        </Link>
      </footer>
    </div>
  );
}
