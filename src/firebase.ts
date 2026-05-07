import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';

// Default to env vars if available (useful for deployed environments like Vercel)
const configFromEnv = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID,
};

let firebaseConfig: any = configFromEnv;

// Fallback to dummy config so app at least builds in CI without env vars
if (!firebaseConfig.apiKey) {
  firebaseConfig = {
    apiKey: 'dummy-api-key',
    authDomain: 'dummy-auth-domain.firebaseapp.com',
    projectId: 'dummy-project-id',
    storageBucket: 'dummy-project-id.appspot.com',
    messagingSenderId: '123456789',
    appId: '1:123456789:web:abcdef123456',
    firestoreDatabaseId: 'dummy-database-id'
  };
}

console.log("Firebase config loaded:");
console.log("Project ID:", firebaseConfig.projectId);
console.log("Database ID:", firebaseConfig.firestoreDatabaseId);
console.log("API Key exists?", !!firebaseConfig.apiKey);

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = firebaseConfig.firestoreDatabaseId 
  ? initializeFirestore(app, { experimentalForceLongPolling: true }, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app); // Use default DB

// Prevent getAuth from crashing the module if no real API key is present
export const auth = (() => {
  try {
    return getAuth(app);
  } catch (e) {
    console.error("Firebase Auth failed to initialize. Are your VITE_FIREBASE_* secrets set?", e);
    return null as any; // Type casting to satisfy the project typings
  }
})();

export const googleProvider = new GoogleAuthProvider();
export { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut };

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
