import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth, signOut } from '../../auth';
import styles from './protected-layout.module.css';

export default async function ProtectedLayout({ children }) {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/select-app" aria-label="Back to all apps">
          dm<span>/apps</span>
        </Link>
        <div className={styles.account}>
          <span className={styles.email}>{session.user.email}</span>
          <form action={async () => {
            'use server';
            await signOut({ redirectTo: '/' });
          }}>
            <button className={styles.signOut} type="submit">Sign out</button>
          </form>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
