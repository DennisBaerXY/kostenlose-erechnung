// src/lib/stores/dashboard.js
import { writable, derived, get } from "svelte/store";
import { dashboardAPI } from "$lib/api/dashboard.js";
import { authAPI } from "$lib/api/auth.js";
import { currentUser } from "./auth.js";

// Initialize dashboard API with auth API reference
dashboardAPI.setAuthAPI(authAPI);

// Dashboard state stores
export const dashboardLoading = writable(false);
export const dashboardError = writable(null);

// Stats
export const dashboardStats = writable({
	invoicesCount: 0,
	customersCount: 0,
	templatesCount: 0,
	lastInvoiceDate: null,
	totalRevenue: 0,
	pendingInvoices: 0
});

// Contacts
export const contacts = writable([]);
export const contactsLoading = writable(false);
export const contactsError = writable(null);

// Invoices
export const invoices = writable([]);
export const invoicesLoading = writable(false);
export const invoicesError = writable(null);

// Templates
export const templates = writable([]);
export const templatesLoading = writable(false);
export const templatesError = writable(null);

// User profile
export const userProfile = writable({});
export const profileLoading = writable(false);
export const profileError = writable(null);

// Derived stores
export const recentContacts = derived(contacts, ($contacts) =>
	$contacts.slice(0, 5)
);

export const recentInvoices = derived(invoices, ($invoices) =>
	$invoices
		.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
		.slice(0, 5)
);

// Dashboard Actions
export const dashboardActions = {
	// Initialize dashboard data
	async initialize() {
		dashboardLoading.set(true);
		dashboardError.set(null);

		try {
			await Promise.all([
				this.loadStats(),
				this.loadContacts(),
				this.loadUserProfile()
			]);
		} catch (error) {
			console.error("Dashboard initialization failed:", error);
			dashboardError.set(error.message);
		} finally {
			dashboardLoading.set(false);
		}
	},

	// Load dashboard statistics
	async loadStats() {
		try {
			const stats = await dashboardAPI.getDashboardStats();
			dashboardStats.set(stats);
		} catch (error) {
			// If stats endpoint doesn't exist yet, calculate from existing data
			console.warn("Stats endpoint not available, calculating locally:", error);
			const $contacts = get(contacts);
			const $invoices = get(invoices);

			dashboardStats.set({
				invoicesCount: $invoices.length,
				customersCount: $contacts.length,
				templatesCount: 0,
				lastInvoiceDate:
					$invoices.length > 0
						? $invoices.sort(
								(a, b) => new Date(b.createdAt) - new Date(a.createdAt)
							)[0].createdAt
						: null,
				totalRevenue: $invoices.reduce((sum, inv) => sum + (inv.total || 0), 0),
				pendingInvoices: $invoices.filter((inv) => inv.status === "pending")
					.length
			});
		}
	},

	// User Profile Actions
	async loadUserProfile() {
		profileLoading.set(true);
		profileError.set(null);

		try {
			const profile = await dashboardAPI.getUserProfile();
			userProfile.set(profile);
		} catch (error) {
			console.error("Failed to load user profile:", error);
			profileError.set(error.message);
		} finally {
			profileLoading.set(false);
		}
	},

	async updateUserProfile(profileData) {
		profileLoading.set(true);
		profileError.set(null);

		try {
			const updatedProfile = await dashboardAPI.updateUserProfile(profileData);
			userProfile.set(updatedProfile);
			return { success: true };
		} catch (error) {
			console.error("Failed to update user profile:", error);
			profileError.set(error.message);
			return { success: false, error: error.message };
		} finally {
			profileLoading.set(false);
		}
	},

	// Contact Actions
	async loadContacts() {
		contactsLoading.set(true);
		contactsError.set(null);

		try {
			const response = await dashboardAPI.getContacts();
			contacts.set(response.contacts || []);
		} catch (error) {
			console.error("Failed to load contacts:", error);
			contactsError.set(error.message);
		} finally {
			contactsLoading.set(false);
		}
	},

	async createContact(contactData) {
		contactsError.set(null);

		try {
			const response = await dashboardAPI.createContact(contactData);

			// Add new contact to store
			contacts.update((currentContacts) => [
				...currentContacts,
				response.contact
			]);

			// Update stats
			await this.loadStats();

			return { success: true, contact: response.contact };
		} catch (error) {
			console.error("Failed to create contact:", error);
			contactsError.set(error.message);
			return { success: false, error: error.message };
		}
	},

	async updateContact(contactId, contactData) {
		contactsError.set(null);

		try {
			const response = await dashboardAPI.updateContact(contactId, contactData);

			// Update contact in store
			contacts.update((currentContacts) =>
				currentContacts.map((contact) =>
					contact.contactId === contactId ? response.contact : contact
				)
			);

			return { success: true, contact: response.contact };
		} catch (error) {
			console.error("Failed to update contact:", error);
			contactsError.set(error.message);
			return { success: false, error: error.message };
		}
	},

	async deleteContact(contactId) {
		contactsError.set(null);

		try {
			await dashboardAPI.deleteContact(contactId);

			// Remove contact from store
			contacts.update((currentContacts) =>
				currentContacts.filter((contact) => contact.contactId !== contactId)
			);

			// Update stats
			await this.loadStats();

			return { success: true };
		} catch (error) {
			console.error("Failed to delete contact:", error);
			contactsError.set(error.message);
			return { success: false, error: error.message };
		}
	},

	// Invoice Actions (for future implementation)
	async loadInvoices(filters = {}) {
		invoicesLoading.set(true);
		invoicesError.set(null);

		try {
			const response = await dashboardAPI.getInvoices(filters);
			invoices.set(response.invoices || []);
		} catch (error) {
			console.error("Failed to load invoices:", error);
			invoicesError.set(error.message);
		} finally {
			invoicesLoading.set(false);
		}
	},

	async createInvoice(invoiceData) {
		invoicesError.set(null);

		try {
			const response = await dashboardAPI.createInvoice(invoiceData);

			// Add new invoice to store
			invoices.update((currentInvoices) => [
				...currentInvoices,
				response.invoice
			]);

			// Update stats
			await this.loadStats();

			return { success: true, invoice: response.invoice };
		} catch (error) {
			console.error("Failed to create invoice:", error);
			invoicesError.set(error.message);
			return { success: false, error: error.message };
		}
	},

	// Template Actions (for future implementation)
	async loadTemplates() {
		templatesLoading.set(true);
		templatesError.set(null);

		try {
			const response = await dashboardAPI.getTemplates();
			templates.set(response.templates || []);
		} catch (error) {
			console.error("Failed to load templates:", error);
			templatesError.set(error.message);
		} finally {
			templatesLoading.set(false);
		}
	},

	async createTemplate(templateData) {
		templatesError.set(null);

		try {
			const response = await dashboardAPI.createTemplate(templateData);

			// Add new template to store
			templates.update((currentTemplates) => [
				...currentTemplates,
				response.template
			]);

			// Update stats
			await this.loadStats();

			return { success: true, template: response.template };
		} catch (error) {
			console.error("Failed to create template:", error);
			templatesError.set(error.message);
			return { success: false, error: error.message };
		}
	},

	// Utility actions
	clearErrors() {
		dashboardError.set(null);
		contactsError.set(null);
		invoicesError.set(null);
		templatesError.set(null);
		profileError.set(null);
	},

	reset() {
		dashboardStats.set({
			invoicesCount: 0,
			customersCount: 0,
			templatesCount: 0,
			lastInvoiceDate: null,
			totalRevenue: 0,
			pendingInvoices: 0
		});
		contacts.set([]);
		invoices.set([]);
		templates.set([]);
		userProfile.set({});
		this.clearErrors();
	}
};
