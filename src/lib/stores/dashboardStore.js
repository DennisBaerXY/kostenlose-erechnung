import { writable, get } from "svelte/store";
import { dashboardApi } from "$lib/api/dashboard";

// --- Writable Stores for State Management ---

export const dashboardStats = writable({
	invoicesCount: 0,
	customersCount: 0,
	totalRevenue: 0,
	lastInvoiceDate: null
});

export const contacts = writable([]);
export const recentContacts = writable([]);
export const dashboardLoading = writable(true);
export const dashboardError = writable(null);

// --- Actions Object ---

export const dashboardActions = {
	/**
	 * Fetches all initial data for the dashboard.
	 */
	async initialize() {
		dashboardLoading.set(true);
		dashboardError.set(null);
		try {
			// Fetch stats and contacts in parallel for better performance
			const [statsData, contactsData] = await Promise.all([
				dashboardApi.getStats(),
				dashboardApi.getContacts()
			]);

			dashboardStats.set(statsData.stats);
			contacts.set(contactsData.contacts);

			// Derive recent contacts from the full list
			const sortedContacts = [...contactsData.contacts].sort(
				(a, b) => new Date(b.createdAt) - new Date(a.createdAt)
			);
			recentContacts.set(sortedContacts.slice(0, 3));
		} catch (err) {
			console.error("Dashboard initialization failed:", err);
			dashboardError.set(err.message || "Failed to load dashboard data.");
		} finally {
			dashboardLoading.set(false);
		}
	},

	/**
	 * Creates a new contact and updates the store.
	 * @param {object} newContactData
	 */
	async createContact(newContactData) {
		try {
			const createdContact = await dashboardApi.createContact(newContactData);
			contacts.update((current) => [createdContact, ...current]);
			// Also update stats if your API returns updated stats
			dashboardStats.update((stats) => ({
				...stats,
				customersCount: stats.customersCount + 1
			}));
			return { success: true };
		} catch (err) {
			console.error("Failed to create contact:", err);
			return { success: false, error: err.message };
		}
	},

	/**
	 * Deletes a contact and updates the store.
	 * @param {string} contactId
	 */
	async deleteContact(contactId) {
		try {
			await dashboardApi.deleteContact(contactId);
			contacts.update((current) =>
				current.filter((c) => c.contactId !== contactId)
			);
			dashboardStats.update((stats) => ({
				...stats,
				customersCount: stats.customersCount - 1
			}));
			return { success: true };
		} catch (err) {
			console.error("Failed to delete contact:", err);
			return { success: false, error: err.message };
		}
	}
};
