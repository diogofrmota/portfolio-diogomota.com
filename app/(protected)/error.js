'use client';

import styles from './protected-layout.module.css';

export default function Error({ reset }) {
  return <section className={styles.status} role="alert"><h1>This app couldn’t load.</h1><p>Try again, or switch to another app using the navigation above.</p><button type="button" onClick={reset}>Try again</button></section>;
}
