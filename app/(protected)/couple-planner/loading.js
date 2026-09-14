import styles from './couple-planner.module.css';
export default function PlannerLoading() {
  return <div className={`${styles.app} ${styles.fallback}`}><div className={styles.content} role="status"><span className={styles.eyebrow}>Couple Planner</span><h1>Opening your shared space...</h1><p>Getting your plans ready.</p></div></div>;
}
