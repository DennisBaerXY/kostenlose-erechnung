import { writable, get } from "svelte/store";
import { dashboardApi } from "$lib/api/dashboard";
import { invoiceApi } from "$lib/api/invoice.js";

// --- Writable Stores for State Management ---

export const dashboardStats = writable({
	customersCount: 0,
	invoicesCount: 0,
	lastInvoiceDate: null,
	pendingInvoices: 0,
	templatesCount: 0,
	totalRevenue: 0
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
			const [statsData, contactsData, invoicesData] = await Promise.all([
				dashboardApi.getStats(),
				dashboardApi.getContacts(),
				invoiceApi.getInvoices() // Fetch invoices
			]);

			// Update the stats store
			dashboardStats.set({
				customersCount: statsData.customersCount || 0,
				invoicesCount: statsData.invoicesCount || 0,
				lastInvoiceDate: statsData.lastInvoiceDate || null,
				pendingInvoices: statsData.pendingInvoices || 0,
				templatesCount: statsData.templatesCount || 0,
				totalRevenue: statsData.totalRevenue || 0
			});

			// Update the contacts store
			contacts.set(contactsData.contacts || []);
			const sortedContacts = [...(contactsData.contacts || [])].sort(
				(a, b) => new Date(b.createdAt) - new Date(a.createdAt)
			);
			recentContacts.set(sortedContacts.slice(0, 3));

			// Update the invoices store
			invoices.set(invoicesData.invoices || []);
		} catch (err) {
			console.error("Dashboard initialization failed:", err);
			dashboardError.set(err.message || "Failed to load dashboard data.");
		} finally {
			dashboardLoading.set(false);
		}
	},

	/**
	 * Handles the download of an invoice file.
	 * @param {string} invoiceId
	 * @param {'pdf' | 'xml'} format
	 */
	async downloadInvoice(invoiceId, format) {
		try {
			const result = await invoiceApi.getDownloadUrl(invoiceId, format);
			if (result.success && result.downloadUrl) {
				// Open the secure link in a new tab to trigger download
				window.open(result.downloadUrl, "_blank");
			} else {
				throw new Error("Could not retrieve download link.");
			}
		} catch (err) {
			console.error(
				`Failed to download ${format} for invoice ${invoiceId}:`,
				err
			);
			// Optionally: show an error message to the user
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
