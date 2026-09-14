'use client';
import styles from './couple-planner.module.css';
export default function PlannerError({ reset }) {
  return <div className={`${styles.app} ${styles.fallback}`}><div className={styles.content}><span className={styles.eyebrow}>Couple Planner</span><h1>We could not open your plans.</h1><p>Your saved plans are still in your shared space. Check your connection and try again.</p><button type="button" className={styles.primaryButton} onClick={reset}>Try again</button></div></div>;
}
