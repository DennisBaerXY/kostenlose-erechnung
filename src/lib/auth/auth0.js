// src/lib/auth/auth0.js
import { createAuth0Client } from "@auth0/auth0-spa-js";
import { writable, derived } from "svelte/store";
import { browser } from "$app/environment";
import { goto } from "$app/navigation";

// Auth0 configuration
const config = {
	domain: import.meta.env.VITE_AUTH0_DOMAIN,
	clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
	redirectUri: browser ? window.location.origin + "/auth/callback" : "",
	audience: import.meta.env.VITE_AUTH0_AUDIENCE,
	scope: "openid profile email offline_access",
	useRefreshTokens: true,
	cacheLocation: "localstorage"
};

// Stores
export const isAuthenticated = writable(false);
export const user = writable(null);
export const auth0Client = writable(null);
export const loading = writable(true);
export const subscription = writable(null);

// Derived stores
export const isPremium = derived(
	subscription,
	($subscription) =>
		$subscription?.status === "active" || $subscription?.status === "trialing"
);

// Initialize Auth0
export async function initAuth0() {
	if (!browser) return;

	try {
		const client = await createAuth0Client(config);
		auth0Client.set(client);

		// Check if user is returning from redirect
		if (window.location.search.includes("code=")) {
			await handleRedirectCallback(client);
		}

		// Check if user is logged in
		const authenticated = await client.isAuthenticated();
		isAuthenticated.set(authenticated);

		if (authenticated) {
			const userProfile = await client.getUser();
			user.set(userProfile);

			// Fetch subscription status
			await fetchSubscription(client);
		}

		loading.set(false);
	} catch (error) {
		console.error("Auth0 initialization error:", error);
		loading.set(false);
	}
}

// Handle redirect callback
async function handleRedirectCallback(client) {
	try {
		await client.handleRedirectCallback();
		window.history.replaceState({}, document.title, window.location.pathname);
	} catch (error) {
		console.error("Callback error:", error);
	}
}

// Login function
export async function login(redirectPath = "/dashboard") {
	const client = await auth0Client.get();
	if (!client) return;

	await client.loginWithRedirect({
		appState: { redirectPath }
	});
}

// Logout function
export async function logout() {
	const client = await auth0Client.get();
	if (!client) return;

	await client.logout({
		returnTo: window.location.origin
	});
}

// Get access token
export async function getAccessToken() {
	const client = await auth0Client.get();
	if (!client) return null;

	try {
		return await client.getTokenSilently();
	} catch (error) {
		console.error("Error getting access token:", error);
		return null;
	}
}

// Fetch subscription status
async function fetchSubscription(client) {
	try {
		const token = await client.getTokenSilently();
		const response = await fetch(
			`${import.meta.env.VITE_API_URL}/subscription`,
			{
				headers: {
					Authorization: `Bearer ${token}`
				}
			}
		);

		if (response.ok) {
			const data = await response.json();
			subscription.set(data);
		}
	} catch (error) {
		console.error("Error fetching subscription:", error);
	}
}

// Protected route guard
export function requireAuth(callback) {
	return async () => {
		const $isAuthenticated = await isAuthenticated.get();
		if (!$isAuthenticated) {
			await login(window.location.pathname);
			return;
		}
		callback();
	};
}

// Premium feature guard
export function requirePremium(callback) {
	return async () => {
		const $isPremium = await isPremium.get();
		if (!$isPremium) {
			goto("/pricing");
			return;
		}
		callback();
	};
}
