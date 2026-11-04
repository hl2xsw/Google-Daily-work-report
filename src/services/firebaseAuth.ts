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
    console.error('Google Sign-in error details:', error);
    if (error.code === 'auth/popup-blocked') {
      throw new Error('브라우저에서 로그인 팝업이 차단되었습니다. 브라우저 주소창 맨 우측의 팝업 차단 아이콘(🚫)을 클릭하여 [항상 허용]을 선택해 주세요.');
    }
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('로그인 팝업 창이 닫혔습니다. 다시 로그인 버튼을 눌러주세요.');
    }
    if (error.code === 'auth/unauthorized-domain') {
      throw new Error('Firebase 콘솔의 승인된 도메인(Authorized Domains)에 현재 도메인이 등록되지 않았습니다.');
    }
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
