import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, type Firestore } from 'firebase/firestore';

interface FirebaseAppletConfig {
  projectId?: string;
  appId?: string;
  apiKey?: string;
  authDomain?: string;
  firestoreDatabaseId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  measurementId?: string;
}

const localConfigModules = import.meta.glob<{ default?: FirebaseAppletConfig }>(
  '../../firebase-applet-config.json',
  { eager: true }
);

function isUsableValue(val?: string): val is string {
  return Boolean(val && val.trim() && !val.trim().startsWith('YOUR_'));
}

function resolveFirebaseConfig(): FirebaseAppletConfig | null {
  const envApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const envProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  if (isUsableValue(envApiKey) && isUsableValue(envProjectId)) {
    return {
      apiKey: envApiKey,
      projectId: envProjectId,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${envProjectId}.firebaseapp.com`,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${envProjectId}.firebasestorage.app`,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID,
    };
  }

  const moduleEntry = Object.values(localConfigModules)[0];
  const fileConfig = moduleEntry?.default;
  if (fileConfig && isUsableValue(fileConfig.apiKey) && isUsableValue(fileConfig.projectId)) {
    return fileConfig;
  }

  return null;
}

const firebaseConfig = resolveFirebaseConfig();

export const isFirebaseConfigured = Boolean(firebaseConfig);

const app = firebaseConfig ? initializeApp(firebaseConfig) : null;

export const auth: Auth | null = app ? getAuth(app) : null;
export const db: Firestore | null =
  app && firebaseConfig
    ? firebaseConfig.firestoreDatabaseId
      ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
      : getFirestore(app)
    : null;
export const googleProvider: GoogleAuthProvider | null = app ? new GoogleAuthProvider() : null;

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
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const user = auth?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: user?.uid,
      email: user?.email,
      emailVerified: user?.emailVerified,
      isAnonymous: user?.isAnonymous,
      tenantId: user?.tenantId,
      providerInfo:
        user?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// On-demand connection diagnostic (not called on cold boot to preserve 0-read free tier)
export async function testFirestoreConnection(): Promise<boolean> {
  if (!db) return false;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline. Verify configuration.');
    }
    return false;
  }
}
