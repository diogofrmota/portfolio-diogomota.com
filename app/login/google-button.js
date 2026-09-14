'use client';

import { useFormStatus } from 'react-dom';
import styles from '../entry.module.css';

export default function GoogleButton() {
  const { pending } = useFormStatus();
  return (
    <button
      className={styles.googleButton}
      type="submit"
      disabled={pending}
      aria-busy={pending}
    >
      <svg aria-hidden="true" viewBox="0 0 18 18" width="20" height="20">
        <path
          fill="#4285F4"
          d="M17.64 9.2c0-.64-.06-1.26-.16-1.86H9v3.52h4.84a4.14 4.14 0 0 1-1.8 2.72v2.28h2.92c1.71-1.57 2.68-3.9 2.68-6.66Z"
        />
        <path
          fill="#34A853"
          d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.28c-.8.54-1.84.86-3.04.86-2.35 0-4.34-1.59-5.05-3.72H.93v2.35A9 9 0 0 0 9 18Z"
        />
        <path
          fill="#FBBC05"
          d="M3.95 10.68A5.42 5.42 0 0 1 3.67 9c0-.58.1-1.14.28-1.68V4.97H.93A9 9 0 0 0 0 9c0 1.45.35 2.82.93 4.03l3.02-2.35Z"
        />
        <path
          fill="#EA4335"
          d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58A8.65 8.65 0 0 0 9 0 9 9 0 0 0 .93 4.97l3.02 2.35C4.66 5.18 6.65 3.58 9 3.58Z"
        />
      </svg>
      <span>{pending ? 'Connecting to Google…' : 'Continue with Google'}</span>
    </button>
  );
}
