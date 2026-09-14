import { redirect } from 'next/navigation';
import { auth } from '../../auth';
import ProductHeader from '../components/product-header';
import styles from './protected-layout.module.css';

export default async function ProtectedLayout({ children }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <div className={styles.shell}>
      <ProductHeader user={{ name: session.user.name, email: session.user.email }} />
      <main id="product-content" tabIndex={-1} className={styles.main}>{children}</main>
    </div>
  );
}
