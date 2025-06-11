import { apiClient } from "$lib/api/client";

/**
 * A collection of API calls related to the dashboard.
 * It uses the centralized apiClient, which handles authentication automatically.
 */
export const dashboardApi = {
	/**
	 * Fetches the main statistics for the dashboard.
	 * @returns {Promise<object>}
	 */
	getStats: () => {
		return apiClient.get("/dashboard/stats");
	},

	/**
	 * Fetches all contacts for the current user.
	 * @returns {Promise<Array<object>>}
	 */
	getContacts: () => {
		return apiClient.get("/contacts");
	},

	/**
	 * Creates a new contact.
	 * @param {object} contactData The data for the new contact.
	 * @returns {Promise<object>}
	 */
	createContact: (contactData) => {
		return apiClient.post("/contacts", contactData);
	},

	/**
	 * Deletes a contact by its ID.
	 * @param {string} contactId The ID of the contact to delete.
	 * @returns {Promise<object>}
	 */
	deleteContact: (contactId) => {
		return apiClient.delete(`/contacts/${contactId}`);
	}
};
