'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import ProductHeader from './product-header';
import styles from '../(protected)/protected-layout.module.css';

export default function AppShell({ user, initialThemes, children }) {
  const app = usePathname().split('/')[1];
  const [themes, setThemes] = useState(initialThemes);
  const theme = themes[app] || (app === 'tvsync' ? 'dark' : 'light');
  function changeTheme(value) {
    document.cookie = `app-theme-${app}=${value}; Path=/; Max-Age=31536000; SameSite=Lax`;
    setThemes((current) => ({ ...current, [app]: value }));
  }
  return <div className={styles.shell} data-app={app} data-theme={theme}>
    <ProductHeader user={user} app={app} theme={theme} onThemeChange={changeTheme} />
    <main id="product-content" tabIndex={-1} className={styles.main}>{children}</main>
  </div>;
}
