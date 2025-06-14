/**
 * ==================================================================================
 * TypeScript-Typdefinitionen für Rechnungsdaten (Svelte Frontend)
 * ==================================================================================
 * Diese Datei definiert die Datenstrukturen für die Svelte-Anwendung.
 * Sie ist eine Entsprechung zu den Typen im Backend, um eine konsistente
 * Datenverarbeitung zwischen Frontend und Backend zu gewährleisten.
 */

/**
 * Definiert die Struktur für die Bankverbindung des Absenders.
 */
export interface BankDetails {
	accountHolder: string;
	bankName: string;
	iban: string;
	bic: string;
}

/**
 * Definiert die Struktur für rechtliche Unternehmensinformationen.
 */
export interface CompanyInfo {
	managingDirector?: string;
	commercialRegister?: string;
	registerCourt?: string;
}

/**
 * Definiert die Struktur für den Absender der Rechnung (Rechnungssteller).
 */
export interface Sender {
	name: string;
	street: string;
	zip: string;
	city: string;
	phone?: string;
	email?: string;
	logo?: string;
	taxId: string;
	ustId?: string;
	bankDetails: BankDetails;
	companyInfo: CompanyInfo;
}

/**
 * Definiert die Struktur für den Empfänger der Rechnung.
 */
export interface Recipient {
	name: string;
	street: string;
	zip: string;
	city: string;
	reference?: string;
}

/**
 * Definiert die Struktur für die allgemeinen Metadaten der Rechnung.
 */
export interface InvoiceMetadata {
	invoiceNumber: string;
	date: string;
	deliveryDate?: string;
	documentTitle?: string;
	introductionText?: string;
	closingText?: string;
	paymentTerms: "net14" | "net30" | "immediate";
	customPaymentTerms?: string;
	taxType: "REGULAR" | "KLEINUNTERNEHMER";
}

/**
 * Definiert die Struktur für eine einzelne Rechnungsposition.
 */
export interface InvoiceItem {
	description: string;
	quantity: number;
	unit:
		| "Stück"
		| "Stunden"
		| "Tage"
		| "Pauschal"
		| "km"
		| "kg"
		| "m²"
		| "Liter"
		| "Meter";
	unitPrice: number;
	taxRate: number;
}

/**
 * Die Haupt-Interface, das die gesamte Rechnungsdatenstruktur zusammenfasst.
 */
export interface Invoice {
	sender: Sender;
	recipient: Recipient;
	metadata: InvoiceMetadata;
	items: InvoiceItem[];

	// Felder, die vom Backend hinzugefügt werden (optional im Frontend)
	userId?: string;
	invoiceId?: string;
	status?: "draft" | "sent" | "paid";
	createdAt?: string;
	files?: {
		pdf_s3_key?: string;
		xml_s3_key?: string;
	};
}
