import { session } from "$lib/stores/session";
import { authStore } from "$lib/stores/authStore";
import { goto } from "$app/navigation";
import { browser } from "$app/environment";

const API_BASE_URL =
	import.meta.env.VITE_API_URL || "https://your-api-gateway-url.com";

/**
 * A collection of authentication-related API calls.
 * This does NOT use the authenticated client because these are public endpoints.
 */
async function postToAuth(endpoint, body) {
	const response = await fetch(`${API_BASE_URL}${endpoint}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body)
	});
	return await response.json();
}

export const auth = {
	/**
	 * Logs in the user.
	 * @param {string} email
	 * @param {string} password
	 */
	login: async (email, password) => {
		const result = await postToAuth("/auth/login", { email, password });
		if (result.success) {
			session.set(result.user, result.tokens);
			authStore.sync(); // Update the global state
		}
		return result;
	},

	/**
	 * Logs out the user.
	 */
	logout: async () => {
		const tokens = session.getTokens();
		if (tokens?.accessToken) {
			// We don't need to wait for this to complete.
			postToAuth("/auth/logout", { accessToken: tokens.accessToken });
		}
		session.clear();
		authStore.sync(); // Update the global state
		if (browser) goto("/login");
	},

	/**
	 * Refreshes the authentication tokens.
	 */
	refreshToken: async () => {
		const tokens = session.getTokens();
		if (!tokens?.refreshToken) {
			throw new Error("No refresh token available.");
		}

		const result = await postToAuth("/auth/refresh", {
			refreshToken: tokens.refreshToken
		});

		if (result.success) {
			session.set(session.getUser(), result.tokens); // Update tokens in storage
			authStore.sync(); // Update the global state
		}
		return result;
	},

	/**
	 * Registers a new user.
	 * @param {string} email
	 * @param {string} password
	 */
	register: (email, password) =>
		postToAuth("/auth/register", { email, password }),

	/**
	 * Confirms user registration.
	 * @param {string} email
	 * @param {string} confirmationCode
	 */
	confirm: (email, confirmationCode) =>
		postToAuth("/auth/confirm", { email, confirmationCode }),

	resendConfirmation: (email) =>
		postToAuth("/auth/resend-confirmation", { email }),
	forgotPassword: (email) => postToAuth("/auth/reset-password", { email })
};
