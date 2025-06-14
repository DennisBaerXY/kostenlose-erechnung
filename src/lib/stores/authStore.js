// src/lib/stores/authStore.js - FIXED for direct Cognito
import { writable, derived } from "svelte/store";
import { browser } from "$app/environment";

// --- Core Stores ---
const _user = writable(null);
const _tokens = writable(null);
export const isLoading = writable(true);

// --- Storage Keys ---
const USER_KEY = "session_user";
const TOKENS_KEY = "session_tokens";
const INVOICE_COUNT_KEY = "monthly_invoice_count";
const INVOICE_COUNT_RESET_KEY = "invoice_count_reset_date";

// --- Session Management ---
export const session = {
	set: (user, tokens) => {
		if (!browser) return;

		try {
			localStorage.setItem(USER_KEY, JSON.stringify(user));

			// Preserve existing refresh token if not provided
			const existingTokens = session.getTokens();
			const newTokens = {
				RefreshToken: existingTokens?.RefreshToken,
				...tokens
			};
			localStorage.setItem(TOKENS_KEY, JSON.stringify(newTokens));

			// Update stores
			_user.set(user);
			_tokens.set(newTokens);
		} catch (error) {
			console.error("Error saving session:", error);
		}
	},

	getUser: () => {
		if (!browser) return null;
		try {
			const user = localStorage.getItem(USER_KEY);
			return user ? JSON.parse(user) : null;
		} catch (error) {
			console.error("Error reading user from storage:", error);
			return null;
		}
	},

	getTokens: () => {
		if (!browser) return null;
		try {
			const tokens = localStorage.getItem(TOKENS_KEY);
			return tokens ? JSON.parse(tokens) : null;
		} catch (error) {
			console.error("Error reading tokens from storage:", error);
			return null;
		}
	},

	clear: () => {
		if (!browser) return;

		localStorage.removeItem(USER_KEY);
		localStorage.removeItem(TOKENS_KEY);
		_user.set(null);
		_tokens.set(null);
	}
};

// --- Token Validation ---
function isTokenExpired(token) {
	if (!token) return true;

	try {
		// Decode JWT payload
		const payload = JSON.parse(atob(token.split(".")[1]));
		const now = Math.floor(Date.now() / 1000);

		// Check if token expires within next 5 minutes

		return payload.exp && payload.exp < now + 300;
	} catch (error) {
		console.error("Error checking token expiration:", error);
		return true;
	}
}

// --- Invoice Count Management ---
function resetMonthlyCountIfNeeded() {
	if (!browser) return;

	const now = new Date();
	const currentMonth = `${now.getFullYear()}-${now.getMonth()}`;
	const lastResetMonth = localStorage.getItem(INVOICE_COUNT_RESET_KEY);

	if (lastResetMonth !== currentMonth) {
		localStorage.setItem(INVOICE_COUNT_KEY, "0");
		localStorage.setItem(INVOICE_COUNT_RESET_KEY, currentMonth);
	}
}

export function getInvoiceCount() {
	if (!browser) return 0;
	resetMonthlyCountIfNeeded();
	return parseInt(localStorage.getItem(INVOICE_COUNT_KEY) || "0", 10);
}

export function incrementInvoiceCount() {
	if (!browser) return;
	const current = getInvoiceCount();
	localStorage.setItem(INVOICE_COUNT_KEY, (current + 1).toString());
}

// --- Auth Initialization ---
async function initializeAuth() {
	if (!browser) {
		isLoading.set(false);
		return;
	}

	try {
		const user = session.getUser();
		const tokens = session.getTokens();

		if (user && tokens) {
			// Check if access token is expired
			if (isTokenExpired(tokens.AccessToken)) {
				if (tokens.RefreshToken && !isTokenExpired(tokens.RefreshToken)) {
					const refreshResult = await refreshToken();
					if (!refreshResult.success) {
						// Refresh failed, clear session
						session.clear();
					}
				} else {
					// No valid refresh token, clear session
					session.clear();
				}
			} else {
				// Valid session, restore state
				_user.set(user);
				_tokens.set(tokens);
			}
		} else {
			console.log("No stored session found");
		}
	} catch (error) {
		console.error("Error initializing auth:", error);
		session.clear();
	} finally {
		isLoading.set(false);
	}
}

// --- Token Refresh ---
async function refreshToken() {
	const tokens = session.getTokens();

	if (!tokens?.RefreshToken) {
		return { success: false, message: "No refresh token available" };
	}

	try {
		const API_BASE_URL =
			import.meta.env.VITE_API_URL || "https://your-api-gateway-url.com";

		const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ refreshToken: tokens.RefreshToken })
		});

		const result = await response.json();

		if (result.success && result.tokens) {
			// Update session with new tokens
			const user = session.getUser();
			session.set(user, result.tokens);
			return { success: true };
		} else {
			console.error("Token refresh failed:", result.message);
			return { success: false, message: result.message };
		}
	} catch (error) {
		console.error("Token refresh error:", error);
		return { success: false, message: error.message };
	}
}

// --- Auth Store Interface ---
export const authStore = {
	subscribe: _user.subscribe,

	init: initializeAuth,

	sync: () => {
		const user = session.getUser();
		const tokens = session.getTokens();
		_user.set(user);
		_tokens.set(tokens);
	},

	refreshToken: refreshToken,

	async login(email, password) {
		try {
			const API_BASE_URL =
				import.meta.env.VITE_API_URL || "https://your-api-gateway-url.com";

			const response = await fetch(`${API_BASE_URL}/auth/login`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password })
			});

			const result = await response.json();

			if (result.success && result.user && result.tokens) {
				session.set(result.user, result.tokens);
				console.log("Login successful");
				return { success: true };
			} else {
				return {
					success: false,
					message: result.message || "Login failed"
				};
			}
		} catch (error) {
			console.error("Login error:", error);
			return {
				success: false,
				message: "Network error. Please try again."
			};
		}
	},

	async logout() {
		const tokens = session.getTokens();

		// Optional: Call logout endpoint
		if (tokens?.AccessToken) {
			try {
				const API_BASE_URL =
					import.meta.env.VITE_API_URL || "https://your-api-gateway-url.com";

				await fetch(`${API_BASE_URL}/auth/logout`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ accessToken: tokens.AccessToken })
				});
			} catch (error) {
				console.error("Logout API call failed:", error);
			}
		}

		session.clear();

		if (browser) {
			window.location.href = "/login";
		}
	},

	async forgotPassword(email) {
		try {
			const API_BASE_URL =
				import.meta.env.VITE_API_URL || "https://your-api-gateway-url.com";

			const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email })
			});

			return await { ...(await response.json()), success: true };
		} catch (error) {
			console.error("Forgot password error:", error);
			return { success: false, message: "Forgot password request failed" };
		}
	},

	async resetPassword(email, code, newPassword) {
		try {
			const API_BASE_URL =
				import.meta.env.VITE_API_URL || "https://your-api-gateway-url.com";

			const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, code, newPassword })
			});

			return await { ...(await response.json()), success: true };
		} catch (error) {
			console.error("Reset password error:", error);
			return { success: false, message: "Reset password request failed" };
		}
	}
};

// --- Derived Stores ---
export const isAuthenticated = derived(_user, ($user) => !!$user);
export const currentUser = derived(_user, ($user) => $user);
export const authTokens = derived(_tokens, ($tokens) => $tokens);
export const isPremiumUser = derived(
	_user,
	($user) => $user?.isPremium || false
);

// --- Legacy Functions (for backward compatibility) ---
export async function signUpUser(email, password) {
	try {
		const API_BASE_URL =
			import.meta.env.VITE_API_URL || "https://your-api-gateway-url.com";

		const response = await fetch(`${API_BASE_URL}/auth/register`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, password })
		});

		return await response.json();
	} catch (error) {
		console.error("Registration error:", error);
		return { success: false, message: "Registration failed" };
	}
}

export async function confirmSignUpUser(email, confirmationCode) {
	try {
		const API_BASE_URL =
			import.meta.env.VITE_API_URL || "https://your-api-gateway-url.com";

		const response = await fetch(`${API_BASE_URL}/auth/confirm`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, confirmationCode })
		});

		return await response.json();
	} catch (error) {
		console.error("Confirmation error:", error);
		return { success: false, message: "Confirmation failed" };
	}
}

// --- Auto-initialize when module loads ---
if (browser) {
	initializeAuth();
}
