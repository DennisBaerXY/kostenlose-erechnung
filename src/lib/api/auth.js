// src/lib/api/auth.js - UPDATED to use new auth store
import { authStore } from "$lib/stores/authStore";

const API_BASE_URL =
	import.meta.env.VITE_API_URL || "https://your-api-gateway-url.com";

/**
 * Authentication API functions - now delegates to the auth store
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
	 */
	login: (email, password) => authStore.login(email, password),

	/**
	 * Logs out the user.
	 */
	logout: () => authStore.logout(),

	/**
	 * Refreshes the authentication tokens.
	 */
	refreshToken: () => authStore.refreshToken(),

	/**
	 * Registers a new user.
	 */
	register: (email, password) =>
		postToAuth("/auth/register", { email, password }),

	/**
	 * Confirms user registration.
	 */
	confirm: (email, confirmationCode) =>
		postToAuth("/auth/confirm", { email, confirmationCode }),

	resendConfirmation: (email) =>
		postToAuth("/auth/resend-confirmation", { email }),

	forgotPassword: (email) => postToAuth("/auth/reset-password", { email })
};
