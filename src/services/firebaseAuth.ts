import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
  Auth
} from 'firebase/auth';

// Embedded Firebase Client Configuration (ensures GitHub Actions builds without missing file)
const defaultFirebaseConfig = {
  projectId: "gen-lang-client-0983271088",
  appId: "1:379463732338:web:f26c262d7b2d9e1bda06eb",
  apiKey: "AIzaSyArdl2WIXn4GC_N5fJbkD3blsNUa5DcdaM",
  authDomain: "gen-lang-client-0983271088.firebaseapp.com",
  storageBucket: "gen-lang-client-0983271088.firebasestorage.app",
  messagingSenderId: "379463732338",
  oAuthClientId: "379463732338-qunsjojirlqncsq7ntk1kg8q9vcgl60r.apps.googleusercontent.com"
};

let auth: Auth | null = null;
let provider: GoogleAuthProvider | null = null;

try {
  const app = !getApps().length ? initializeApp(defaultFirebaseConfig) : getApp();
  auth = getAuth(app);
  provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/spreadsheets.readonly');
  provider.addScope('https://www.googleapis.com/auth/drive.readonly');
  provider.setCustomParameters({
    prompt: 'select_account',
  });
} catch (err) {
  console.warn('Firebase initialization notice:', err);
}

export { auth };

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  if (!auth) {
    if (onAuthFailure) onAuthFailure();
    return () => {};
  }

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  if (!auth || !provider) {
    throw new Error('Google 로그인 서비스를 초기화할 수 없습니다.');
  }

  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Google 계정 인증 토큰을 가져오지 못했습니다.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  if (auth) {
    await signOut(auth);
  }
  cachedAccessToken = null;
};
