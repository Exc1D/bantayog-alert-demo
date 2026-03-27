import { httpsCallable, getFunctions } from 'firebase/functions';

let functionsInstance = null;

async function getFunctionsInstance() {
  if (!functionsInstance) {
    functionsInstance = getFunctions();
  }
  return functionsInstance;
}

export async function syncUserClaims() {
  const fns = await getFunctionsInstance();
  const syncClaims = httpsCallable(fns, 'syncUserClaims');
  return await syncClaims();
}
