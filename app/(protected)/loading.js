import styles from './protected-layout.module.css';

export default function Loading() {
  return <section className={styles.status} role="status"><h1>Opening your app…</h1><p>Your space will be ready in a moment.</p></section>;
}
