import { apiClient } from "$lib/api/client";

/**
 * A collection of API calls related to invoices.
 */
export const invoiceApi = {
	/**
	 * Saves a new invoice. The body should contain all invoice data.
	 * @param {object} invoiceData - The complete invoice data object.
	 */
	createInvoice: (invoiceData) => {
		return apiClient.post("/invoices", invoiceData);
	},

	/**
	 * Fetches all invoices for the current user.
	 */
	getInvoices: () => {
		return apiClient.get("/invoices");
	},

	/**
	 * Fetches a single invoice by its ID.
	 * @param {string} invoiceId - The ID of the invoice.
	 */
	getInvoice: (invoiceId) => {
		return apiClient.get(`/invoices/${invoiceId}`);
	},

	/**
	 * Gets a secure, temporary download URL for an invoice file (PDF or XML).
	 * @param {string} invoiceId - The ID of the invoice.
	 * @param {'pdf' | 'xml'} format - The desired file format.
	 */
	getDownloadUrl: (invoiceId, format) => {
		return apiClient.get(
			`/invoices/${invoiceId}/download-url?format=${format}`
		);
	},

	/**
	 * Gets a pre-signed URL for uploading an invoice file.
	 * @param {string} fileName - The name of the file to be uploaded.
	 * @param {string} fileType - The MIME type of the file.
	 */
	getUploadUrl: (fileName, fileType) => {
		return apiClient.post("/invoices/upload-url", { fileName, fileType });
	}
};
