import Link from 'next/link';
import ProductHeader from '../components/product-header';
import { apps } from '../../lib/app-navigation';
import styles from './apps.module.css';

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
        <path d="M21 17v30M13 23v18M43 17v30M51 23v18M21 32h22M7 32h6M51 32h6" />
      )}
    </svg>
  );
}

export default function AppsClient({ user, callbackUrl }) {
  const authenticated = Boolean(user);
  const callbackPath = callbackUrl?.split(/[?#]/, 1)[0];
  const accountHref = (registering = false) => ({
    pathname: '/login',
    query: {
      ...(callbackUrl && { callbackUrl }),
      ...(registering && { mode: 'register' }),
    },
  });

  return (
    <div className={styles.shell}>
      {authenticated ? <ProductHeader user={user} /> : (
        <header className={styles.header}>
          <Link className={styles.brand} href="/">dm<span> / apps</span></Link>
          <span className={styles.productNote}>One account &middot; three apps</span>
        </header>
      )}

      <main id="product-content" tabIndex={-1} className={styles.main}>
        <p className={styles.eyebrow}>ONE ACCOUNT · THREE MINI-APPS</p>
        <h1>Everything in one place.</h1>
        <p className={styles.intro}>
          Choose where to start. Your account and profile move with you.
        </p>

        <div className={styles.appGrid}>
          {apps.map((app) => {
            const continuesCallback =
              callbackPath === app.href ||
              callbackPath?.startsWith(`${app.href}/`);
            const href = authenticated
              ? continuesCallback
                ? callbackUrl
                : app.href
              : {
                  pathname: '/login',
                  query: {
                    callbackUrl: continuesCallback ? callbackUrl : app.href,
                  },
                };

            return (
              <Link className={styles.appLink} href={href} key={app.href}>
                <span className={`${styles.appTile} ${styles[app.color]}`}>
                  <span className={styles.tileCategory}>{app.category}</span>
                  <AppIcon icon={app.icon} />
                  <span className={styles.tileArrow} aria-hidden="true">
                    ↗
                  </span>
                </span>
                <span className={styles.appName}>{app.name}</span>
                <span className={styles.appDescription}>{app.description}</span>
                {continuesCallback && (
                  <span className={styles.suggested}>
                    Continue where you were headed{' '}
                    <span aria-hidden="true">→</span>
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {!authenticated ? (
          <section className={styles.access} aria-labelledby="account-access">
            <p id="account-access">
              Sign in once to use all three mini-apps with the same account.
            </p>
            <nav className={styles.accessActions} aria-label="Account access">
              <Link className={styles.primaryAction} href={accountHref()}>
                Sign in
              </Link>
              <Link className={styles.secondaryAction} href={accountHref(true)}>
                Create account
              </Link>
            </nav>
          </section>
        ) : (
          <p className={styles.selectionNote}>
            One login, one shared account. Switch mini-apps anytime.
          </p>
        )}
      </main>


    </div>
  );
}
