import { writable, derived } from "svelte/store";
import { session } from "$lib/stores/session";
import { browser } from "$app/environment";

// --- Writable Stores ---

/**
 * Writable store for the user object.
 * Private to this module to control updates via sync().
 */
const _user = writable(null);

/**
 * Writable store to track if the initial auth check is complete.
 */
export const isLoading = writable(true);

// --- Logic ---

/**
 * Synchronizes the auth store with the session data from localStorage.
 * This is the single source of truth for updating the user state.
 */
function sync() {
	if (!browser) return;

	const user = session.getUser();
	_user.set(user);
	isLoading.set(false);
}

// --- Public Interface ---

export const authStore = {
	/**
	 * Subscribe to the user store.
	 */
	subscribe: _user.subscribe,

	/**
	 * Initialize the auth state from the session on app load.
	 */
	init: () => {
		sync();
	},

	/**
	 * Syncs the store with the latest session data.
	 */
	sync
};

/**
 * A derived store that provides a boolean indicating if the user is authenticated.
 */
export const isAuthenticated = derived(_user, ($user) => !!$user);
