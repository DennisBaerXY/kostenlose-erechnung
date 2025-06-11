// src/lib/stores/auth.js (Updated)
import { writable, derived } from "svelte/store";
import { browser } from "$app/environment";
import { authAPI } from "$lib/api/auth.js";

// User authentication state
export const currentUser = writable(null);
export const isAuthenticated = derived(currentUser, ($user) => !!$user);
export const isLoading = writable(true);

export async function initializeAuth() {
	if (!browser) return;

	try {
		isLoading.set(true);
		const user = authAPI.getCurrentUser();

		if (user && authAPI.isAuthenticated()) {
			currentUser.set(user);

			// Try to refresh token to ensure it's still valid
			try {
				await authAPI.refreshToken();
			} catch (error) {
				console.log("Token refresh failed, user needs to login again");
				currentUser.set(null);
				authAPI.logout();
			}
		}
	} catch (error) {
		console.log("Auth initialization failed:", error);
		currentUser.set(null);
	} finally {
		isLoading.set(false);
	}
}

export async function signUpUser(email, password) {
	const result = await authAPI.register(email, password);
	return result;
}

export async function signInUser(email, password) {
	const result = await authAPI.login(email, password);

	if (result.success) {
		console.log("User signed in successfully:", result.user);
		currentUser.set(result.user);

		// Initialize dashboard data after successful login
		if (browser) {
			try {
				const { dashboardActions } = await import("./dashboard.js");
				dashboardActions.initialize();
			} catch (error) {
				console.warn("Dashboard initialization failed:", error);
			}
		}
	}

	return result;
}

export async function signOutUser() {
	await authAPI.logout();
	currentUser.set(null);

	// Clear dashboard data on logout
	if (browser) {
		try {
			const { dashboardActions } = await import("./dashboard.js");
			dashboardActions.reset();
		} catch (error) {
			console.warn("Dashboard reset failed:", error);
		}
	}

	return { success: true };
}

export async function confirmSignUpUser(email, confirmationCode) {
	return await authAPI.confirm(email, confirmationCode);
}

// Freemium tracking
function getMonthKey() {
	const now = new Date();
	return `${now.getFullYear()}-${now.getMonth() + 1}`;
}

export function getInvoiceCount() {
	if (!browser) return 0;
	const monthKey = getMonthKey();
	const count = localStorage.getItem(`invoices_${monthKey}`);
	return parseInt(count || "0");
}

export function incrementInvoiceCount() {
	if (!browser) return;
	const monthKey = getMonthKey();
	const currentCount = getInvoiceCount();
	localStorage.setItem(`invoices_${monthKey}`, String(currentCount + 1));
	return currentCount + 1;
}

export function canCreateInvoice() {
	const user = get(currentUser);
	if (user?.tier === "premium") return true;
	return getInvoiceCount() < 5;
}
