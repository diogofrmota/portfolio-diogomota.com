import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '../../auth';
import { appSelectionUrl, safeAppPath } from '../../lib/app-navigation';
import GoogleButton from './google-button';
import { continueWithGoogle } from '../auth-actions';
import styles from '../entry.module.css';

export async function generateMetadata({ searchParams }) {
  return {
    title:
      (await searchParams).mode === 'register'
        ? 'Create an account'
        : 'Sign in',
  };
}

export default async function Login({ searchParams }) {
  const { callbackUrl: requestedCallback, error, mode } = await searchParams;
  const callbackUrl = safeAppPath(requestedCallback) || '';
  if ((await auth())?.user) redirect(appSelectionUrl(callbackUrl));
  const registering = mode === 'register';
  const modeLink = (register) => ({
    pathname: '/login',
    query: {
      ...(callbackUrl && { callbackUrl }),
      ...(register && { mode: 'register' }),
    },
  });

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/">
          dm<span> / apps</span>
        </Link>
        <Link className={styles.quietLink} href="/apps">
          Back to apps <span aria-hidden="true">↗</span>
        </Link>
      </header>
      <main className={styles.loginMain}>
        <div className={styles.loginIntro}>
          <p className={styles.eyebrow}>A LITTLE SPACE FOR YOUR EVERYDAY</p>
          <h1>
            Your shows.
            <br />
            Your plans.
            <br />
            <span>Your progress.</span>
          </h1>
          <p className={styles.introCopy}>
            A few useful apps, all in one place.
            <br />
            One account to make them yours.
          </p>
          <div
            className={styles.miniApps}
            aria-label="TVSync, Couple Planner and Fithub"
          >
            <span>Watch</span>
            <span>Plan</span>
            <span>Move</span>
          </div>
        </div>
        <section className={styles.loginCard} aria-labelledby="login-title">
          <nav className={styles.modes} aria-label="Account access">
            <Link
              href={modeLink(false)}
              aria-current={!registering ? 'page' : undefined}
            >
              Sign in
            </Link>
            <Link
              href={modeLink(true)}
              aria-current={registering ? 'page' : undefined}
            >
              Create account
            </Link>
          </nav>
          <p className={styles.eyebrow}>
            {registering ? 'GET STARTED' : 'YOUR PERSONAL COLLECTION'}
          </p>
          <h2 id="login-title">
            {registering ? 'Make yourself at home.' : 'Welcome back.'}
          </h2>
          <p className={styles.cardCopy}>
            {registering
              ? 'Create your account with Google, then choose an app to get started.'
              : 'Sign in to your account, then choose where you want to go.'}
          </p>
          {error && (
            <p className={styles.error} role="alert">
              {error === 'AccessDenied'
                ? 'Access was not granted. Please try again with your Google account.'
                : 'We couldn’t sign you in. Please try again.'}
            </p>
          )}
          <form action={continueWithGoogle}>
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
            <GoogleButton />
          </form>
          <p className={styles.note}>
            One Google account. All three apps.
            <br />
            No extra password to remember.
          </p>
          <p className={styles.switchCopy}>
            {registering ? 'Already have an account? ' : 'New here? '}
            <Link href={modeLink(!registering)}>
              {registering ? 'Sign in' : 'Create an account'}
            </Link>
          </p>
        </section>
      </main>
      <footer className={styles.footer}>
        Made by Diogo Mota<span>One account. Your everyday.</span>
      </footer>
    </div>
  );
}
