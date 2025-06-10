// src/lib/utils/invoice-validation.js

export function validateStep(stepId, invoiceData) {
	const errors = [];

	switch (stepId) {
		case 1: // Sender Info
			errors.push(...validateSenderInfo(invoiceData.sender));
			break;
		case 2: // Recipient Info
			errors.push(...validateRecipientInfo(invoiceData.recipient));
			break;
		case 3: // Invoice Details
			errors.push(...validateInvoiceDetails(invoiceData.metadata));
			break;
		case 4: // Items
			errors.push(...validateItems(invoiceData.items));
			break;
		case 5: // Final
			errors.push(...validateCompleteInvoice(invoiceData));
			break;
	}

	return {
		isValid: errors.length === 0,
		errors
	};
}

function validateSenderInfo(sender) {
	const errors = [];

	if (!sender.name?.trim()) {
		errors.push("Firmenname ist erforderlich");
	}

	if (!sender.street?.trim()) {
		errors.push("Straße ist erforderlich");
	}

	if (!sender.zip?.trim()) {
		errors.push("Postleitzahl ist erforderlich");
	}

	if (!sender.city?.trim()) {
		errors.push("Stadt ist erforderlich");
	}

	if (!sender.taxId?.trim() && !sender.ustId?.trim()) {
		errors.push("Steuernummer oder USt-IdNr. ist erforderlich");
	}

	return errors;
}

function validateRecipientInfo(recipient) {
	const errors = [];

	if (!recipient.name?.trim()) {
		errors.push("Empfängername ist erforderlich");
	}

	if (!recipient.street?.trim()) {
		errors.push("Empfängerstraße ist erforderlich");
	}

	if (!recipient.zip?.trim()) {
		errors.push("Empfänger-PLZ ist erforderlich");
	}

	if (!recipient.city?.trim()) {
		errors.push("Empfängerstadt ist erforderlich");
	}

	return errors;
}

function validateInvoiceDetails(metadata) {
	const errors = [];

	if (!metadata.invoiceNumber?.trim()) {
		errors.push("Rechnungsnummer ist erforderlich");
	}

	if (!metadata.date) {
		errors.push("Rechnungsdatum ist erforderlich");
	}

	return errors;
}

function validateItems(items) {
	const errors = [];

	if (!items || items.length === 0) {
		errors.push("Mindestens eine Position ist erforderlich");
		return errors;
	}

	items.forEach((item, index) => {
		if (!item.description?.trim()) {
			errors.push(`Position ${index + 1}: Beschreibung fehlt`);
		}
		if (item.quantity <= 0) {
			errors.push(`Position ${index + 1}: Menge muss größer als 0 sein`);
		}
		if (item.price <= 0) {
			errors.push(`Position ${index + 1}: Preis muss größer als 0 sein`);
		}
	});
	if (items.some((item) => item.quantity <= 0)) {
		errors.push("Alle Positionen müssen eine Menge größer als 0 haben");
	}
	if (items.some((item) => item.price <= 0)) {
		errors.push("Alle Positionen müssen einen Preis größer als 0 haben");
	}
	if (items.some((item) => !item.description?.trim())) {
		errors.push("Alle Positionen müssen eine Beschreibung haben");
	}
	if (items.some((item) => item.quantity < 0)) {
		errors.push("Menge darf nicht negativ sein");
	}

	return errors;
}

function validateCompleteInvoice(invoiceData) {
	const errors = [];

	// Aggregate all validations for final step
	errors.push(...validateSenderInfo(invoiceData.sender));
	errors.push(...validateRecipientInfo(invoiceData.recipient));
	errors.push(...validateInvoiceDetails(invoiceData.metadata));
	errors.push(...validateItems(invoiceData.items));

	return errors;
}

// Helper functions for specific validations
export function generateInvoiceNumber() {
	const year = new Date().getFullYear().toString().slice(-2);
	const month = String(new Date().getMonth() + 1).padStart(2, "0");
	const day = String(new Date().getDate()).padStart(2, "0");
	const time = Date.now().toString().slice(-4);
	return `${year}${month}${day}-${time}`;
}

export function calculateDueDate(issueDate, paymentTerms) {
	if (!issueDate || !paymentTerms) return "";

	const date = new Date(issueDate);
	let days = 30;

	switch (paymentTerms) {
		case "net14":
			days = 14;
			break;
		case "net30":
			days = 30;
			break;
		case "immediate":
			days = 0;
			break;
		default:
			days = 30;
	}

	date.setDate(date.getDate() + days);
	return date.toISOString().split("T")[0];
}
