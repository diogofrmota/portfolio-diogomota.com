import { auth } from '../../auth';
import { safeAppPath } from '../../lib/app-navigation';
import AppsClient from './apps-client';

export const metadata = { title: 'Apps' };

export default async function Apps({ searchParams }) {
  const callbackUrl = safeAppPath((await searchParams).callbackUrl);
  const session = await auth();

  return (
    <AppsClient user={session?.user ?? null} callbackUrl={callbackUrl} />
  );
}
