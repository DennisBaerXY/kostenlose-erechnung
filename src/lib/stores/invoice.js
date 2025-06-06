import { writable } from "svelte/store";

// Default invoice data structure
const defaultInvoiceData = {
	sender: {
		name: "",
		street: "",
		zip: "",
		city: "",
		email: "",
		phone: "",
		taxId: "",
		ustId: "",
		bankName: "",
		iban: "",
		bic: ""
	},
	recipient: {
		name: "",
		street: "",
		zip: "",
		city: "",
		email: "",
		reference: "",
		customerNumber: ""
	},
	metadata: {
		invoiceNumber: "",
		date: new Date().toISOString().split("T")[0],
		deliveryDate: "",
		dueDate: "",
		paymentTerms: "net30",
		customPaymentTerms: "",
		currency: "EUR",
		invoiceType: "380" // 380 = Commercial Invoice
	},
	items: [],
	notes: {
		introText: "",
		outroText: ""
	}
};

// Create the invoice data store
export const invoiceData = writable(defaultInvoiceData);

// Create the current step store for the wizard
export const currentStep = writable(1);

// Helper functions
export function resetInvoice() {
	invoiceData.set(defaultInvoiceData);
	currentStep.set(1);
}

export function addInvoiceItem() {
	invoiceData.update((data) => ({
		...data,
		items: [
			...data.items,
			{
				id: Date.now(),
				description: "",
				quantity: 1,
				unit: "Stück",
				unitPrice: 0,
				taxRate: 19,
				discount: 0
			}
		]
	}));
}

export function removeInvoiceItem(id) {
	invoiceData.update((data) => ({
		...data,
		items: data.items.filter((item) => item.id !== id)
	}));
}

export function updateInvoiceItem(id, updates) {
	invoiceData.update((data) => ({
		...data,
		items: data.items.map((item) =>
			item.id === id ? { ...item, ...updates } : item
		)
	}));
}

// Calculation helpers
export function calculateInvoiceTotals(items) {
	const subtotal = items.reduce((sum, item) => {
		const itemTotal = item.quantity * item.unitPrice;
		const discount = itemTotal * (item.discount / 100);
		return sum + (itemTotal - discount);
	}, 0);

	const taxGroups = items.reduce((groups, item) => {
		const rate = item.taxRate;
		if (!groups[rate]) {
			groups[rate] = { rate, base: 0, tax: 0 };
		}
		const itemTotal = item.quantity * item.unitPrice;
		const discount = itemTotal * (item.discount / 100);
		const netAmount = itemTotal - discount;
		groups[rate].base += netAmount;
		groups[rate].tax += netAmount * (rate / 100);
		return groups;
	}, {});

	const totalTax = Object.values(taxGroups).reduce(
		(sum, group) => sum + group.tax,
		0
	);
	const total = subtotal + totalTax;

	return {
		subtotal,
		taxGroups,
		totalTax,
		total
	};
}

// Validation helpers
export function validateInvoiceData(data) {
	const errors = [];

	// Sender validation
	if (!data.sender.name) errors.push("Firmenname ist erforderlich");
	if (!data.sender.street) errors.push("Straße ist erforderlich");
	if (!data.sender.zip) errors.push("Postleitzahl ist erforderlich");
	if (!data.sender.city) errors.push("Stadt ist erforderlich");
	if (!data.sender.taxId && !data.sender.ustId) {
		errors.push("Steuernummer oder USt-IdNr. ist erforderlich");
	}

	// Recipient validation
	if (!data.recipient.name) errors.push("Empfängername ist erforderlich");
	if (!data.recipient.street) errors.push("Empfängerstraße ist erforderlich");
	if (!data.recipient.zip) errors.push("Empfänger-PLZ ist erforderlich");
	if (!data.recipient.city) errors.push("Empfängerstadt ist erforderlich");

	// Metadata validation
	if (!data.metadata.invoiceNumber)
		errors.push("Rechnungsnummer ist erforderlich");
	if (!data.metadata.date) errors.push("Rechnungsdatum ist erforderlich");

	// Items validation
	if (data.items.length === 0) {
		errors.push("Mindestens eine Position ist erforderlich");
	} else {
		data.items.forEach((item, index) => {
			if (!item.description) {
				errors.push(`Position ${index + 1}: Beschreibung fehlt`);
			}
			if (item.quantity <= 0) {
				errors.push(`Position ${index + 1}: Menge muss größer als 0 sein`);
			}
			if (item.unitPrice < 0) {
				errors.push(`Position ${index + 1}: Preis darf nicht negativ sein`);
			}
		});
	}

	return errors;
}

// Local storage persistence
export function saveInvoiceToLocalStorage(data) {
	if (typeof window !== "undefined") {
		localStorage.setItem("invoice_draft", JSON.stringify(data));
	}
}

export function loadInvoiceFromLocalStorage() {
	if (typeof window !== "undefined") {
		const saved = localStorage.getItem("invoice_draft");
		if (saved) {
			try {
				return JSON.parse(saved);
			} catch (e) {
				console.error("Failed to load saved invoice:", e);
			}
		}
	}
	return null;
}

export function clearInvoiceFromLocalStorage() {
	if (typeof window !== "undefined") {
		localStorage.removeItem("invoice_draft");
	}
}
