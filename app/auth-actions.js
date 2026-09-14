'use server';

import { signIn } from '../auth';
import { appSelectionUrl } from '../lib/app-navigation';

export async function continueWithGoogle(formData) {
  await signIn('google', { redirectTo: appSelectionUrl(formData.get('callbackUrl')) });
}
