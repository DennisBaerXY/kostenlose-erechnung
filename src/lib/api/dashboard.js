// src/lib/api/dashboard.js
const API_BASE_URL =
	import.meta.env.VITE_API_URL || "https://your-api-gateway-url.com";

class DashboardAPI {
	constructor() {
		this.authAPI = null;
	}

	// Set auth API reference for token management
	setAuthAPI(authAPI) {
		this.authAPI = authAPI;
	}

	// Helper to get authorization headers
	getAuthHeaders() {
		const token = this.authAPI?.getAccessToken();
		return {
			"Content-Type": "application/json",
			...(token && { Authorization: `Bearer ${token}` })
		};
	}

	// Handle API errors and token refresh
	async handleApiRequest(url, options = {}) {
		const headers = this.getAuthHeaders();

		try {
			const response = await fetch(url, {
				...options,
				headers: { ...headers, ...options.headers }
			});

			// Handle 401 - try to refresh token
			if (response.status === 401 && this.authAPI) {
				try {
					await this.authAPI.refreshToken();
					const newHeaders = this.getAuthHeaders();
					const retryResponse = await fetch(url, {
						...options,
						headers: { ...newHeaders, ...options.headers }
					});
					return await retryResponse.json();
				} catch (refreshError) {
					// Refresh failed, redirect to login
					localStorage.removeItem("tokens");
					localStorage.removeItem("user");
					window.location.href = "/login";
					throw new Error("Session expired");
				}
			}

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || `HTTP ${response.status}`);
			}

			return await response.json();
		} catch (error) {
			console.error("API Request failed:", error);
			throw error;
		}
	}

	// CONTACTS API
	async getContacts() {
		return this.handleApiRequest(`${API_BASE_URL}/contacts`, {
			method: "GET"
		});
	}

	async createContact(contactData) {
		return this.handleApiRequest(`${API_BASE_URL}/contacts`, {
			method: "POST",
			body: JSON.stringify(contactData)
		});
	}

	async updateContact(contactId, contactData) {
		return this.handleApiRequest(`${API_BASE_URL}/contacts/${contactId}`, {
			method: "PUT",
			body: JSON.stringify(contactData)
		});
	}

	async deleteContact(contactId) {
		return this.handleApiRequest(`${API_BASE_URL}/contacts/${contactId}`, {
			method: "DELETE"
		});
	}

	async getContact(contactId) {
		return this.handleApiRequest(`${API_BASE_URL}/contacts/${contactId}`, {
			method: "GET"
		});
	}

	// USER PROFILE API
	async getUserProfile() {
		return this.handleApiRequest(`${API_BASE_URL}/user/profile`, {
			method: "GET"
		});
	}

	async updateUserProfile(profileData) {
		return this.handleApiRequest(`${API_BASE_URL}/user/profile`, {
			method: "PUT",
			body: JSON.stringify(profileData)
		});
	}

	// INVOICES API (for future use)
	async getInvoices(filters = {}) {
		const params = new URLSearchParams(filters);
		return this.handleApiRequest(`${API_BASE_URL}/invoices?${params}`, {
			method: "GET"
		});
	}

	async getInvoice(invoiceId) {
		return this.handleApiRequest(`${API_BASE_URL}/invoices/${invoiceId}`, {
			method: "GET"
		});
	}

	async createInvoice(invoiceData) {
		return this.handleApiRequest(`${API_BASE_URL}/invoices`, {
			method: "POST",
			body: JSON.stringify(invoiceData)
		});
	}

	async updateInvoice(invoiceId, invoiceData) {
		return this.handleApiRequest(`${API_BASE_URL}/invoices/${invoiceId}`, {
			method: "PUT",
			body: JSON.stringify(invoiceData)
		});
	}

	async deleteInvoice(invoiceId) {
		return this.handleApiRequest(`${API_BASE_URL}/invoices/${invoiceId}`, {
			method: "DELETE"
		});
	}

	// DASHBOARD STATS API
	async getDashboardStats() {
		return this.handleApiRequest(`${API_BASE_URL}/dashboard/stats`, {
			method: "GET"
		});
	}

	// TEMPLATES API (for future use)
	async getTemplates() {
		return this.handleApiRequest(`${API_BASE_URL}/templates`, {
			method: "GET"
		});
	}

	async createTemplate(templateData) {
		return this.handleApiRequest(`${API_BASE_URL}/templates`, {
			method: "POST",
			body: JSON.stringify(templateData)
		});
	}

	async updateTemplate(templateId, templateData) {
		return this.handleApiRequest(`${API_BASE_URL}/templates/${templateId}`, {
			method: "PUT",
			body: JSON.stringify(templateData)
		});
	}

	async deleteTemplate(templateId) {
		return this.handleApiRequest(`${API_BASE_URL}/templates/${templateId}`, {
			method: "DELETE"
		});
	}
}

export const dashboardAPI = new DashboardAPI();
