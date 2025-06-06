// src/lib/stores/premium.js
import { writable, derived, get } from "svelte/store";
import { getAccessToken } from "$lib/auth/auth0.js";

const API_URL = import.meta.env.VITE_API_URL;

// Premium data stores
export const savedInvoices = writable([]);
export const templates = writable([]);
export const customers = writable([]);
export const apiKeys = writable([]);
export const loading = writable(false);

// Cloud Storage Functions
export async function saveInvoice(invoiceData) {
	loading.set(true);
	try {
		const token = await getAccessToken();
		const response = await fetch(`${API_URL}/invoices`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify({
				...invoiceData,
				createdAt: new Date().toISOString()
			})
		});

		if (!response.ok) throw new Error("Failed to save invoice");

		const saved = await response.json();
		savedInvoices.update((invoices) => [...invoices, saved]);
		return saved;
	} catch (error) {
		console.error("Save invoice error:", error);
		throw error;
	} finally {
		loading.set(false);
	}
}

export async function loadInvoices() {
	loading.set(true);
	try {
		const token = await getAccessToken();
		const response = await fetch(`${API_URL}/invoices`, {
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

		if (!response.ok) throw new Error("Failed to load invoices");

		const invoices = await response.json();
		savedInvoices.set(invoices);
		return invoices;
	} catch (error) {
		console.error("Load invoices error:", error);
		throw error;
	} finally {
		loading.set(false);
	}
}

export async function deleteInvoice(invoiceId) {
	try {
		const token = await getAccessToken();
		const response = await fetch(`${API_URL}/invoices/${invoiceId}`, {
			method: "DELETE",
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

		if (!response.ok) throw new Error("Failed to delete invoice");

		savedInvoices.update((invoices) =>
			invoices.filter((inv) => inv.id !== invoiceId)
		);
	} catch (error) {
		console.error("Delete invoice error:", error);
		throw error;
	}
}

// Template Management
export async function saveTemplate(templateData) {
	loading.set(true);
	try {
		const token = await getAccessToken();
		const response = await fetch(`${API_URL}/templates`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify(templateData)
		});

		if (!response.ok) throw new Error("Failed to save template");

		const saved = await response.json();
		templates.update((temps) => [...temps, saved]);
		return saved;
	} catch (error) {
		console.error("Save template error:", error);
		throw error;
	} finally {
		loading.set(false);
	}
}

export async function loadTemplates() {
	loading.set(true);
	try {
		const token = await getAccessToken();
		const response = await fetch(`${API_URL}/templates`, {
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

		if (!response.ok) throw new Error("Failed to load templates");

		const templateList = await response.json();
		templates.set(templateList);
		return templateList;
	} catch (error) {
		console.error("Load templates error:", error);
		throw error;
	} finally {
		loading.set(false);
	}
}

export async function deleteTemplate(templateId) {
	try {
		const token = await getAccessToken();
		const response = await fetch(`${API_URL}/templates/${templateId}`, {
			method: "DELETE",
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

		if (!response.ok) throw new Error("Failed to delete template");

		templates.update((temps) => temps.filter((temp) => temp.id !== templateId));
	} catch (error) {
		console.error("Delete template error:", error);
		throw error;
	}
}

// Customer Management
export async function saveCustomer(customerData) {
	loading.set(true);
	try {
		const token = await getAccessToken();
		const response = await fetch(`${API_URL}/customers`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify(customerData)
		});

		if (!response.ok) throw new Error("Failed to save customer");

		const saved = await response.json();
		customers.update((custs) => [...custs, saved]);
		return saved;
	} catch (error) {
		console.error("Save customer error:", error);
		throw error;
	} finally {
		loading.set(false);
	}
}

export async function updateCustomer(customerId, customerData) {
	loading.set(true);
	try {
		const token = await getAccessToken();
		const response = await fetch(`${API_URL}/customers/${customerId}`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify(customerData)
		});

		if (!response.ok) throw new Error("Failed to update customer");

		const updated = await response.json();
		customers.update((custs) =>
			custs.map((cust) => (cust.id === customerId ? updated : cust))
		);
		return updated;
	} catch (error) {
		console.error("Update customer error:", error);
		throw error;
	} finally {
		loading.set(false);
	}
}

export async function loadCustomers() {
	loading.set(true);
	try {
		const token = await getAccessToken();
		const response = await fetch(`${API_URL}/customers`, {
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

		if (!response.ok) throw new Error("Failed to load customers");

		const customerList = await response.json();
		customers.set(customerList);
		return customerList;
	} catch (error) {
		console.error("Load customers error:", error);
		throw error;
	} finally {
		loading.set(false);
	}
}

export async function deleteCustomer(customerId) {
	try {
		const token = await getAccessToken();
		const response = await fetch(`${API_URL}/customers/${customerId}`, {
			method: "DELETE",
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

		if (!response.ok) throw new Error("Failed to delete customer");

		customers.update((custs) => custs.filter((cust) => cust.id !== customerId));
	} catch (error) {
		console.error("Delete customer error:", error);
		throw error;
	}
}

// API Key Management
export async function generateApiKey(name) {
	loading.set(true);
	try {
		const token = await getAccessToken();
		const response = await fetch(`${API_URL}/api-keys`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify({ name })
		});

		if (!response.ok) throw new Error("Failed to generate API key");

		const apiKey = await response.json();
		apiKeys.update((keys) => [...keys, apiKey]);
		return apiKey;
	} catch (error) {
		console.error("Generate API key error:", error);
		throw error;
	} finally {
		loading.set(false);
	}
}

export async function loadApiKeys() {
	loading.set(true);
	try {
		const token = await getAccessToken();
		const response = await fetch(`${API_URL}/api-keys`, {
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

		if (!response.ok) throw new Error("Failed to load API keys");

		const keys = await response.json();
		apiKeys.set(keys);
		return keys;
	} catch (error) {
		console.error("Load API keys error:", error);
		throw error;
	} finally {
		loading.set(false);
	}
}

export async function revokeApiKey(keyId) {
	try {
		const token = await getAccessToken();
		const response = await fetch(`${API_URL}/api-keys/${keyId}`, {
			method: "DELETE",
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

		if (!response.ok) throw new Error("Failed to revoke API key");

		apiKeys.update((keys) => keys.filter((key) => key.id !== keyId));
	} catch (error) {
		console.error("Revoke API key error:", error);
		throw error;
	}
}

// User Profile Management
export async function getUserProfile() {
	try {
		const token = await getAccessToken();
		const response = await fetch(`${API_URL}/profile`, {
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

		if (!response.ok) throw new Error("Failed to load profile");

		return await response.json();
	} catch (error) {
		console.error("Load profile error:", error);
		throw error;
	}
}

export async function updateUserProfile(profileData) {
	try {
		const token = await getAccessToken();
		const response = await fetch(`${API_URL}/profile`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify(profileData)
		});

		if (!response.ok) throw new Error("Failed to update profile");

		return await response.json();
	} catch (error) {
		console.error("Update profile error:", error);
		throw error;
	}
}

// Data Export (GDPR compliance)
export async function exportUserData() {
	try {
		const token = await getAccessToken();
		const response = await fetch(`${API_URL}/export-data`, {
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

		if (!response.ok) throw new Error("Failed to export data");

		const blob = await response.blob();
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "meine-daten.zip";
		a.click();
		window.URL.revokeObjectURL(url);
	} catch (error) {
		console.error("Export data error:", error);
		throw error;
	}
}

// Delete all user data (GDPR compliance)
export async function deleteAllUserData() {
	try {
		const token = await getAccessToken();
		const response = await fetch(`${API_URL}/delete-account`, {
			method: "DELETE",
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

		if (!response.ok) throw new Error("Failed to delete account");

		// Clear all local stores
		savedInvoices.set([]);
		templates.set([]);
		customers.set([]);
		apiKeys.set([]);

		return true;
	} catch (error) {
		console.error("Delete account error:", error);
		throw error;
	}
}
