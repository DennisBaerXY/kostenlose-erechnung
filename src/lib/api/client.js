import { session } from "$lib/stores/session";
import { auth } from "$lib/api/auth";
import { goto } from "$app/navigation";
import { browser } from "$app/environment";

const API_BASE_URL =
	import.meta.env.VITE_API_URL || "https://your-api-gateway-url.com";

/**
 * A wrapper for the fetch API that handles authentication and token refreshing.
 * @param {string} endpoint The API endpoint to call (e.g., '/dashboard/stats').
 * @param {RequestInit} options The options for the fetch call.
 * @param {boolean} isRetry A flag to prevent infinite refresh loops.
 * @returns {Promise<Response>} The raw fetch response.
 */
async function fetchWithAuth(endpoint, options = {}, isRetry = false) {
	const tokens = session.getTokens();
	const headers = {
		"Content-Type": "application/json",
		...options.headers
	};

	if (tokens?.accessToken) {
		headers["Authorization"] = `Bearer ${tokens.accessToken}`;
	}

	const response = await fetch(`${API_BASE_URL}${endpoint}`, {
		...options,
		headers
	});

	// If unauthorized and it's not a retry attempt, try to refresh the token.
	if (response.status === 401 && !isRetry) {
		try {
			console.log("Access token expired. Attempting to refresh...");
			const refreshResult = await auth.refreshToken();

			if (refreshResult.success) {
				console.log(
					"Token refreshed successfully. Retrying original request..."
				);
				// Retry the original request with the new token.
				return fetchWithAuth(endpoint, options, true);
			} else {
				// Refresh failed, force logout.
				console.error("Token refresh failed. Logging out.");
				auth.logout();
				if (browser) goto("/login");
				// Return the original failed response to stop the chain.
				return response;
			}
		} catch (error) {
			console.error("An error occurred during token refresh:", error);
			auth.logout();
			if (browser) goto("/login");
			// Re-throw the error to be caught by the calling function.
			throw error;
		}
	}

	return response;
}

/**
 * A simplified API client for making authenticated requests.
 */
export const apiClient = {
	get: async (endpoint) => {
		const response = await fetchWithAuth(endpoint, { method: "GET" });
		if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
		return response.json();
	},
	post: async (endpoint, body) => {
		const response = await fetchWithAuth(endpoint, {
			method: "POST",
			body: JSON.stringify(body)
		});
		if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
		return response.json();
	},
	put: async (endpoint, body) => {
		const response = await fetchWithAuth(endpoint, {
			method: "PUT",
			body: JSON.stringify(body)
		});
		if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
		return response.json();
	},
	delete: async (endpoint) => {
		const response = await fetchWithAuth(endpoint, { method: "DELETE" });
		if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
		return response.json();
	}
};
