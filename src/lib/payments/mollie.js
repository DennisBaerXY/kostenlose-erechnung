// src/lib/payments/mollie.js
import { getAccessToken } from "$lib/auth/auth0.js";

const API_URL = import.meta.env.VITE_API_URL;

// Subscription plans
export const PLANS = {
	monthly: {
		id: "premium_monthly",
		name: "Premium Monatlich",
		price: 4.99,
		interval: "monthly",
		features: [
			"Unbegrenzte E-Rechnungen",
			"Cloud-Speicherung",
			"Rechnungsvorlagen",
			"Kundenverwaltung"
		]
	},
	yearly: {
		id: "premium_yearly",
		name: "Premium Jährlich",
		price: 49.99,
		interval: "yearly",
		features: ["Alle Premium-Features", "2 Monate gratis"]
	}
};

// Create subscription
export async function createSubscription(planId) {
	try {
		const token = await getAccessToken();
		const response = await fetch(`${API_URL}/subscription/create`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify({ planId })
		});

		if (!response.ok) {
			throw new Error("Failed to create subscription");
		}

		const data = await response.json();

		// Redirect to Mollie checkout
		if (data.checkoutUrl) {
			window.location.href = data.checkoutUrl;
		}

		return data;
	} catch (error) {
		console.error("Subscription error:", error);
		throw error;
	}
}

// Cancel subscription
export async function cancelSubscription() {
	try {
		const token = await getAccessToken();
		const response = await fetch(`${API_URL}/subscription/cancel`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

		if (!response.ok) {
			throw new Error("Failed to cancel subscription");
		}

		return await response.json();
	} catch (error) {
		console.error("Cancel subscription error:", error);
		throw error;
	}
}

// Get subscription status
export async function getSubscriptionStatus() {
	try {
		const token = await getAccessToken();
		const response = await fetch(`${API_URL}/subscription`, {
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

		if (!response.ok) {
			throw new Error("Failed to get subscription status");
		}

		return await response.json();
	} catch (error) {
		console.error("Get subscription error:", error);
		return null;
	}
}

// Get payment history
export async function getPaymentHistory() {
	try {
		const token = await getAccessToken();
		const response = await fetch(`${API_URL}/payments`, {
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

		if (!response.ok) {
			throw new Error("Failed to get payment history");
		}

		return await response.json();
	} catch (error) {
		console.error("Get payment history error:", error);
		return [];
	}
}

// Update payment method
export async function updatePaymentMethod() {
	try {
		const token = await getAccessToken();
		const response = await fetch(`${API_URL}/subscription/payment-method`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

		if (!response.ok) {
			throw new Error("Failed to update payment method");
		}

		const data = await response.json();

		// Redirect to Mollie payment method update
		if (data.updateUrl) {
			window.location.href = data.updateUrl;
		}

		return data;
	} catch (error) {
		console.error("Update payment method error:", error);
		throw error;
	}
}

// Webhook handler for subscription updates
export async function handleWebhook(event) {
	// This would be called from the backend when Mollie sends webhook events
	switch (event.type) {
		case "subscription.created":
			// Handle new subscription
			break;
		case "subscription.updated":
			// Handle subscription update
			break;
		case "subscription.cancelled":
			// Handle subscription cancellation
			break;
		case "payment.paid":
			// Handle successful payment
			break;
		case "payment.failed":
			// Handle failed payment
			break;
	}
}
