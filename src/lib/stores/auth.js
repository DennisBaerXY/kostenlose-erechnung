import { writable, derived } from "svelte/store";
import { browser } from "$app/environment";

// User authentication state
export const currentUser = writable(null);
export const isAuthenticated = derived(currentUser, ($user) => !!$user);

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
