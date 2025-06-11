import { browser } from "$app/environment";

const USER_KEY = "session_user";
const TOKENS_KEY = "session_tokens";

/**
 * Manages storing and retrieving session data (user and tokens) from localStorage.
 */
export const session = {
	/**
	 * Saves the user object and tokens to localStorage.
	 * @param {object} user The user data object.
	 * @param {object} tokens The authentication tokens.
	 */
	set: (user, tokens) => {
		if (!browser) return;
		localStorage.setItem(USER_KEY, JSON.stringify(user));
		// Ensure we preserve the refresh token if the new tokens object doesn't have one
		const existingTokens = session.getTokens();
		const newTokens = {
			refreshToken: existingTokens?.refreshToken,
			...tokens
		};
		localStorage.setItem(TOKENS_KEY, JSON.stringify(newTokens));
	},

	/**
	 * Retrieves the user object from localStorage.
	 * @returns {object|null} The user object or null if not found.
	 */
	getUser: () => {
		if (!browser) return null;
		const user = localStorage.getItem(USER_KEY);
		return user ? JSON.parse(user) : null;
	},

	/**
	 * Retrieves the tokens object from localStorage.
	 * @returns {object|null} The tokens object or null if not found.
	 */
	getTokens: () => {
		if (!browser) return null;
		const tokens = localStorage.getItem(TOKENS_KEY);
		return tokens ? JSON.parse(tokens) : null;
	},

	/**
	 * Clears all session data from localStorage.
	 */
	clear: () => {
		if (!browser) return;
		localStorage.removeItem(USER_KEY);
		localStorage.removeItem(TOKENS_KEY);
	}
};
