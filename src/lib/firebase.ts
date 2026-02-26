// Firebase integration - available for paid customers
// To enable: install firebase package and configure with your project credentials

export const FIREBASE_ENABLED = false;

export interface FirebaseConfig {
	apiKey: string;
	authDomain: string;
	projectId: string;
	storageBucket: string;
	messagingSenderId: string;
	appId: string;
}

// Stub functions - replace with actual Firebase calls when enabling
export async function saveSession(_items: unknown[]): Promise<string> {
	throw new Error('Firebase integration is not enabled. This feature is for paid customers.');
}

export async function loadSession(_sessionId: string): Promise<unknown[]> {
	throw new Error('Firebase integration is not enabled. This feature is for paid customers.');
}
