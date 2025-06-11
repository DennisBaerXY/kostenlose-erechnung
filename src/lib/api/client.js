import { session } from "$lib/stores/session";
import { authStore } from "$lib/stores/authStore";
import { goto } from "$app/navigation";
import { browser } from "$app/environment";

const API_BASE_URL =
	import.meta.env.VITE_API_URL || "https://your-api-gateway-url.com";

/**
 * Enhanced fetch wrapper that handles token refresh automatically
 */
async function fetchWithAuth(endpoint, options = {}, isRetry = false) {
	const tokens = session.getTokens();
	const headers = {
		"Content-Type": "application/json",
		...options.headers
	};

	if (tokens?.IdToken) {
		headers["Authorization"] = `Bearer ${tokens.IdToken}`;
	}

	const response = await fetch(`${API_BASE_URL}${endpoint}`, {
		...options,
		headers
	});

	// Handle token expiration
	if (response.status === 401 && !isRetry) {
		try {
			console.log("Access token expired. Attempting to refresh...");

			// Try to refresh token using the auth store
			const refreshResult = await authStore.refreshToken();

			if (refreshResult && refreshResult.success) {
				console.log(
					"Token refreshed successfully. Retrying original request..."
				);
				// Retry the original request with the new token
				return fetchWithAuth(endpoint, options, true);
			} else {
				// Refresh failed, force logout
				console.error("Token refresh failed. Logging out.");
				await authStore.logout();
				return response;
			}
		} catch (error) {
			console.error("An error occurred during token refresh:", error);
			await authStore.logout();
			throw error;
		}
	}

	return response;
}

/**
 * Your existing API client with enhanced error handling
 */
export const apiClient = {
	async get(endpoint) {
		const response = await fetchWithAuth(endpoint, { method: "GET" });
		if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
		return response.json();
	},

	async post(endpoint, body) {
		const response = await fetchWithAuth(endpoint, {
			method: "POST",
			body: JSON.stringify(body)
		});
		if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
		return response.json();
	},

	async put(endpoint, body) {
		const response = await fetchWithAuth(endpoint, {
			method: "PUT",
			body: JSON.stringify(body)
		});
		if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
		return response.json();
	},

	async delete(endpoint) {
		const response = await fetchWithAuth(endpoint, { method: "DELETE" });
		if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
		return response.json();
	}
};
