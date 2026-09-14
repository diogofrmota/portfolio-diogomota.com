'use server';

import { signIn, signOut } from '../auth';
import { appSelectionUrl } from '../lib/app-navigation';

export async function continueWithGoogle(formData) {
  await signIn('google', { redirectTo: appSelectionUrl(formData.get('callbackUrl')) });
}

export async function signOutAccount() {
  await signOut({ redirectTo: '/apps' });
}
