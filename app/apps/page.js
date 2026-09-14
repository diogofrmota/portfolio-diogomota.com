import { auth } from '../../auth';
import { redirect } from 'next/navigation';
import AppsClient from './apps-client';

export const metadata = { title: 'Apps' };

export default async function Apps() {
  const session = await auth();
  if (session?.user) redirect('/select-app');

  return (
    <main>
      <div className="content">
        <AppsClient />
      </div>
    </main>
  );
}
