// src/lib/stores/profileStore.js
import { writable, derived } from "svelte/store";
import { browser } from "$app/environment";
import { authStore, isAuthenticated } from "./authStore.js";

// Profile Store
export const profileData = writable({
	loading: false,
	error: null,
	profile: null
});

// Default sender data structure
const defaultSenderData = {
	name: "",
	contactName: "",
	street: "",
	zip: "",
	city: "",
	phone: "",
	email: "",
	taxId: "",
	ustId: "",
	logo: null,
	bankDetails: {
		accountHolder: "",
		bankName: "",
		iban: "",
		bic: ""
	},
	companyInfo: {
		managingDirector: "",
		commercialRegister: "",
		registerCourt: ""
	}
};

// API Base URL
const API_BASE_URL =
	import.meta.env.VITE_API_URL || "https://your-api-gateway-url.com";

// Helper to get auth headers
function getAuthHeaders() {
	const tokens = authStore.getTokens?.() || {};
	return {
		"Content-Type": "application/json",
		Authorization: `Bearer ${tokens.IdToken}`
	};
}

// Profile Actions
export const profileActions = {
	/**
	 * Load user profile from backend
	 */
	async loadProfile() {
		if (!browser || !isAuthenticated) return;

		profileData.update((state) => ({ ...state, loading: true, error: null }));

		try {
			const response = await fetch(`${API_BASE_URL}/profile`, {
				headers: getAuthHeaders()
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}

			const data = await response.json();

			profileData.update((state) => ({
				...state,
				loading: false,
				profile: data.profile || { defaultSender: defaultSenderData }
			}));

			return { success: true };
		} catch (error) {
			console.error("Profile load error:", error);
			profileData.update((state) => ({
				...state,
				loading: false,
				error: "Fehler beim Laden des Profils",
				profile: { defaultSender: defaultSenderData } // Fallback to defaults
			}));
			return { success: false, error: error.message };
		}
	},

	/**
	 * Save sender data to backend
	 */
	async saveSenderData(senderData) {
		if (!browser || !isAuthenticated)
			return { success: false, error: "Not authenticated" };

		profileData.update((state) => ({ ...state, loading: true, error: null }));

		try {
			const response = await fetch(`${API_BASE_URL}/profile/sender`, {
				method: "PUT",
				headers: getAuthHeaders(),
				body: JSON.stringify(senderData)
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}

			const result = await response.json();

			// Update local profile
			profileData.update((state) => ({
				...state,
				loading: false,
				profile: {
					...state.profile,
					defaultSender: senderData
				}
			}));

			return { success: true };
		} catch (error) {
			console.error("Save sender data error:", error);
			profileData.update((state) => ({
				...state,
				loading: false,
				error: "Fehler beim Speichern der Firmendaten"
			}));
			return { success: false, error: error.message };
		}
	},

	/**
	 * Get default sender data for new invoices
	 */
	getDefaultSenderData() {
		const profile = profileData.get?.()?.profile;
		return profile?.defaultSender || defaultSenderData;
	}
};

// Derived store for easy access to sender data
export const defaultSenderData$ = derived(
	profileData,
	($profileData) => $profileData.profile?.defaultSender || defaultSenderData
);

// Auto-load profile when authenticated
if (browser) {
	// Watch authentication state
	isAuthenticated.subscribe((authenticated) => {
		if (authenticated) {
			profileActions.loadProfile();
		} else {
			// Clear profile when logged out
			profileData.set({
				loading: false,
				error: null,
				profile: null
			});
		}
	});
}
