const API_BASE_URL =
	import.meta.env.VITE_API_URL || "https://your-api-gateway-url.com";

class AuthAPI {
	async register(email, password, givenName, familyName) {
		const response = await fetch(`${API_BASE_URL}/auth/register`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, password, givenName, familyName })
		});

		return await response.json();
	}

	async login(email, password) {
		const response = await fetch(`${API_BASE_URL}/auth/login`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, password })
		});

		const result = await response.json();

		if (result.success) {
			// Store tokens in localStorage (or secure storage)
			localStorage.setItem("tokens", JSON.stringify(result.tokens));
			localStorage.setItem("user", JSON.stringify(result.user));
		}

		return result;
	}

	async confirm(email, confirmationCode) {
		const response = await fetch(`${API_BASE_URL}/auth/confirm`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, confirmationCode })
		});

		return await response.json();
	}

	async logout() {
		const tokens = JSON.parse(localStorage.getItem("tokens") || "{}");

		if (tokens.accessToken) {
			await fetch(`${API_BASE_URL}/auth/logout`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${tokens.accessToken}`
				},
				body: JSON.stringify({ accessToken: tokens.accessToken })
			});
		}

		localStorage.removeItem("tokens");
		localStorage.removeItem("user");
	}

	async refreshToken() {
		const tokens = JSON.parse(localStorage.getItem("tokens") || "{}");

		if (!tokens.refreshToken) {
			throw new Error("No refresh token available");
		}

		const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ refreshToken: tokens.refreshToken })
		});

		const result = await response.json();

		if (result.success) {
			const newTokens = { ...tokens, ...result.tokens };
			localStorage.setItem("tokens", JSON.stringify(newTokens));
		}

		return result;
	}

	getCurrentUser() {
		return JSON.parse(localStorage.getItem("user") || "null");
	}

	getAccessToken() {
		const tokens = JSON.parse(localStorage.getItem("tokens") || "{}");
		return tokens.accessToken;
	}

	isAuthenticated() {
		return !!this.getAccessToken();
	}
}

export const authAPI = new AuthAPI();
