// src/lib/stores/invoice.js (REVERTED - NO RUNES)
import {
	generateInvoice,
	generateXRechnungCII
} from "$lib/utils/invoice-generator";
import { writable, derived } from "svelte/store";

const initialData = {
	sender: {
		name: "Musterfirma GmbH",
		contactName: "Muster Kontakt",
		street: "Musterstraße 1",
		zip: "12345",
		city: "Musterstadt",
		phone: "+49 6151 123456",
		email: "info@musterfirma.de",
		taxId: "12/345/67890",
		ustId: "DE123456789",
		logo: null,
		bankDetails: {
			accountHolder: "Musterfirma GmbH",
			bankName: "Musterbank",
			iban: "DE12345678901234567890",
			bic: "MUSTBICXXX"
		},
		companyInfo: {
			managingDirector: "Max Mustermann",
			commercialRegister: "HRB 12345",
			registerCourt: "Amtsgericht Musterstadt"
		}
	},
	recipient: {
		name: "Kunde GmbH",
		street: "Musterstraße 1",
		zip: "12345",
		city: "Musterstadt",
		email: "kunde@muster.de",
		reference: "Bestellung 123",
		customerNumber: "K-123456",
		department: "Einkauf",
		contactPerson: "Max Mustermann"
	},
	metadata: {
		invoiceNumber: "",
		date: new Date().toISOString().split("T")[0],
		deliveryDate: new Date().toISOString().split("T")[0],
		dueDate: new Date(new Date().setDate(new Date().getDate() + 30))
			.toISOString()
			.split("T")[0],
		paymentTerms: "net30",

		customPaymentTerms: "",
		documentTitle: "Rechnung",
		introductionText:
			"Unsere Lieferungen/Leistungen stellen wir Ihnen wie folgt in Rechnung.",
		closingText: `Vielen Dank für Ihren Auftrag.`,
		customizationId:
			"urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0",
		profileId: "urn:fdc:peppol.eu:2017:poacc:billing:01:1.0",
		invoiceTypeCode: "380",
		currency: "EUR"
	},
	items: [
		{
			id: crypto.randomUUID(),
			description: "",
			quantity: 1,
			unit: "Stück",
			unitPrice: 0,
			taxRate: 19,
			longDescription: "",
			articleNumber: ""
		}
	]
};

// Main invoice store
export const invoiceData = writable(JSON.parse(JSON.stringify(initialData)));

/**
 * Saves the current invoice data to the backend, including uploading generated files.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function saveInvoice() {
	const data = get(invoiceData);
	const invoiceId = crypto.randomUUID(); // Generate a unique ID for the invoice

	try {
		// 1. Generate Files
		const xmlString = generateXRechnungCII(data);

		const xmlBlob = new Blob([xmlString], { type: "application/xml" });
		const pdfBlob = await generateInvoice(data, "ZUGFeRD");

		// 2. Upload Files to S3
		const pdfS3Key = `invoices/${invoiceId}/rechnung-${invoiceId}.pdf`;
		const xmlS3Key = `invoices/${invoiceId}/rechnung-${invoiceId}.xml`;

		await uploadFile(pdfS3Key, "application/pdf", pdfBlob);
		await uploadFile(xmlS3Key, "application/xml", xmlBlob);

		// 3. Save Invoice Metadata to DB
		const payload = {
			...data,
			invoiceId,
			files: {
				pdf_s3_key: pdfS3Key,
				xml_s3_key: xmlS3Key
			}
		};

		const result = await invoiceApi.createInvoice(payload);
		if (!result.success) {
			throw new Error(result.message || "Failed to save invoice metadata.");
		}

		return { success: true };
	} catch (error) {
		console.error("Failed to save invoice:", error);
		return { success: false, error: error.message };
	}
}

/**
 * Helper function to upload a file to S3 via a pre-signed URL.
 * @param {string} key - The S3 key for the file.
 * @param {string} type - The MIME type of the file.
 * @param {Blob} blob - The file content as a Blob.
 */
async function uploadFile(key, type, blob) {
	// Get a pre-signed URL from our backend
	const { success, url } = await invoiceApi.getUploadUrl(key, type);
	if (!success) {
		throw new Error(`Could not get an upload URL for ${key}`);
	}

	// Upload the file to S3
	const uploadResponse = await fetch(url, {
		method: "PUT",
		headers: {
			"Content-Type": type
		},
		body: blob
	});

	if (!uploadResponse.ok) {
		throw new Error(`S3 upload failed for ${key}`);
	}
}

// Derived calculations
export const subtotal = derived(invoiceData, ($data) =>
	$data.items.reduce(
		(sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
		0
	)
);

export const taxGroups = derived(invoiceData, ($data) =>
	$data.items.reduce((groups, item) => {
		const rate = item.taxRate || 19;
		if (!groups[rate]) {
			groups[rate] = { rate, base: 0, tax: 0 };
		}
		const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
		groups[rate].base += itemTotal;
		groups[rate].tax += (itemTotal * rate) / 100;
		return groups;
	}, {})
);

export const taxAmount = derived(taxGroups, ($groups) =>
	Object.values($groups).reduce((sum, group) => sum + group.tax, 0)
);

export const total = derived(
	[subtotal, taxAmount],
	([$subtotal, $taxAmount]) => $subtotal + $taxAmount
);

export function calculateInvoiceTotals(invoiceData) {
	return {
		subtotal,
		taxGroups,
		total
	};
}
// Action functions
export function addInvoiceItem() {
	invoiceData.update((data) => {
		data.items.push({
			id: crypto.randomUUID(),
			description: "",
			longDescription: "",
			articleNumber: "",
			quantity: 1,
			unit: "Stück",
			unitPrice: 0,
			taxRate: 19 // Default to 19% MwSt
		});
		return data;
	});
}

export function removeInvoiceItem(id) {
	invoiceData.update((data) => {
		data.items = data.items.filter((item) => item.id !== id);
		return data;
	});
}

export function updateInvoiceItem(id, updates) {
	invoiceData.update((data) => {
		const index = data.items.findIndex((item) => item.id === id);
		if (index !== -1) {
			data.items[index] = { ...data.items[index], ...updates };
		}
		return data;
	});
}

// Helper functions
export function generateInvoiceNumber() {
	const year = new Date().getFullYear();
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

	return {
		isValid: errors.length === 0,
		errors
	};
}
