import type { User, Session } from 'better-auth';
import type { AccessLevel } from '$lib/server/access';
import type { MediaType } from '$lib/types';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Error {
			message: string;
			errorId?: string;
		}

		interface Locals {
			user?: User;
			session?: Session;
			/** Whether user has paid-level access (subscription, freeAccess, or active trial). */
			subscribed: boolean;
			/** Three-level access: 'none' (deleted/unauthed), 'free', or 'paid'. */
			accessLevel: AccessLevel;
			trialEndsAt: Date | null;
			/**
			 * Media types the user can actively manage on the free tier.
			 * Set from `freeBoards` (if chosen) or `interests` (fallback).
			 * Null for unauthenticated users. Irrelevant for paid users (all types allowed).
			 */
			freeBoards: MediaType[] | null;
		}

		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
