// src/lib/utils/xml-parser.js

/**
 * Parse XRechnung/ZUGFeRD XML and extract invoice data
 */
export async function parseInvoiceXml(xmlString) {
	try {
		const parser = new DOMParser();
		const xmlDoc = parser.parseFromString(xmlString, "text/xml");

		// Check for parsing errors
		const parserError = xmlDoc.querySelector("parsererror");
		if (parserError) {
			throw new Error("Invalid XML format");
		}

		// Extract invoice data based on XRechnung structure
		const invoiceData = {
			metadata: extractMetadata(xmlDoc),
			sender: extractSender(xmlDoc),
			recipient: extractRecipient(xmlDoc),
			items: extractLineItems(xmlDoc),
			totals: extractTotals(xmlDoc),
			validation: validateInvoice(xmlDoc)
		};

		return invoiceData;
	} catch (error) {
		console.error("Error parsing XML:", error);
		throw new Error(`Failed to parse invoice: ${error.message}`);
	}
}

/**
 * Extract metadata from XML
 */
function extractMetadata(xmlDoc) {
	const ns = getNamespaces(xmlDoc);

	return {
		invoiceNumber: getTextContent(xmlDoc, "ExchangedDocument ID", ns),
		invoiceType: getTextContent(xmlDoc, "ExchangedDocument TypeCode", ns),
		date: parseDate(
			getTextContent(
				xmlDoc,
				"ExchangedDocument IssueDateTime DateTimeString",
				ns
			)
		),
		currency: getTextContent(xmlDoc, "InvoiceCurrencyCode", ns) || "EUR",
		notes: getAllTextContent(xmlDoc, "IncludedNote Content", ns),
		paymentTerms: getTextContent(
			xmlDoc,
			"SpecifiedTradePaymentTerms Description",
			ns
		),
		dueDate: parseDate(
			getTextContent(xmlDoc, "DueDateDateTime DateTimeString", ns)
		)
	};
}

/**
 * Extract sender information
 */
function extractSender(xmlDoc) {
	const ns = getNamespaces(xmlDoc);
	const seller = xmlDoc.querySelector("SellerTradeParty");

	if (!seller) return {};

	return {
		name: getTextContent(seller, "Name", ns),
		street: getTextContent(seller, "PostalTradeAddress LineOne", ns),
		zip: getTextContent(seller, "PostalTradeAddress PostcodeCode", ns),
		city: getTextContent(seller, "PostalTradeAddress CityName", ns),
		country: getTextContent(seller, "PostalTradeAddress CountryID", ns),
		email: getTextContent(
			seller,
			'URIUniversalCommunication URIID[schemeID="EM"]',
			ns
		),
		phone: getTextContent(
			seller,
			'URIUniversalCommunication URIID[schemeID="TE"]',
			ns
		),
		taxId: getTextContent(
			seller,
			'SpecifiedTaxRegistration ID[schemeID="FC"]',
			ns
		),
		ustId: getTextContent(
			seller,
			'SpecifiedTaxRegistration ID[schemeID="VA"]',
			ns
		),
		iban: getTextContent(
			seller,
			"PayeePartyCreditorFinancialAccount IBANID",
			ns
		),
		bic: getTextContent(
			seller,
			"PayeeSpecifiedCreditorFinancialInstitution BICID",
			ns
		)
	};
}

/**
 * Extract recipient information
 */
function extractRecipient(xmlDoc) {
	const ns = getNamespaces(xmlDoc);
	const buyer = xmlDoc.querySelector("BuyerTradeParty");

	if (!buyer) return {};

	return {
		name: getTextContent(buyer, "Name", ns),
		street: getTextContent(buyer, "PostalTradeAddress LineOne", ns),
		zip: getTextContent(buyer, "PostalTradeAddress PostcodeCode", ns),
		city: getTextContent(buyer, "PostalTradeAddress CityName", ns),
		country: getTextContent(buyer, "PostalTradeAddress CountryID", ns),
		email: getTextContent(
			buyer,
			'URIUniversalCommunication URIID[schemeID="EM"]',
			ns
		),
		reference: getTextContent(xmlDoc, "BuyerReference", ns)
	};
}

/**
 * Extract line items
 */
function extractLineItems(xmlDoc) {
	const ns = getNamespaces(xmlDoc);
	const lineItems = xmlDoc.querySelectorAll("IncludedSupplyChainTradeLineItem");

	return Array.from(lineItems).map((item) => {
		const quantity = parseFloat(
			getTextContent(item, "BilledQuantity", ns) || "0"
		);
		const unitPrice = parseFloat(
			getTextContent(item, "NetPriceProductTradePrice ChargeAmount", ns) || "0"
		);
		const taxRate = parseFloat(
			getTextContent(item, "ApplicableTradeTax RateApplicablePercent", ns) ||
				"0"
		);

		return {
			lineId: getTextContent(item, "AssociatedDocumentLineDocument LineID", ns),
			description: getTextContent(item, "SpecifiedTradeProduct Name", ns),
			quantity: quantity,
			unit: getAttribute(item, "BilledQuantity", "unitCode", ns) || "C62",
			unitPrice: unitPrice,
			taxRate: taxRate,
			lineTotal: parseFloat(
				getTextContent(item, "LineTotalAmount", ns) ||
					(quantity * unitPrice).toString()
			)
		};
	});
}

/**
 * Extract totals
 */
function extractTotals(xmlDoc) {
	const ns = getNamespaces(xmlDoc);

	return {
		subtotal: parseFloat(getTextContent(xmlDoc, "LineTotalAmount", ns) || "0"),
		taxBasis: parseFloat(
			getTextContent(xmlDoc, "TaxBasisTotalAmount", ns) || "0"
		),
		taxAmount: parseFloat(getTextContent(xmlDoc, "TaxTotalAmount", ns) || "0"),
		total: parseFloat(getTextContent(xmlDoc, "GrandTotalAmount", ns) || "0"),
		dueAmount: parseFloat(getTextContent(xmlDoc, "DuePayableAmount", ns) || "0")
	};
}

/**
 * Validate invoice structure
 */
function validateInvoice(xmlDoc) {
	const errors = [];
	const warnings = [];

	// Check required fields
	const requiredFields = [
		{ path: "ExchangedDocument ID", name: "Invoice Number" },
		{ path: "SellerTradeParty Name", name: "Seller Name" },
		{ path: "BuyerTradeParty Name", name: "Buyer Name" },
		{ path: "GrandTotalAmount", name: "Total Amount" }
	];

	const ns = getNamespaces(xmlDoc);

	requiredFields.forEach((field) => {
		if (!getTextContent(xmlDoc, field.path, ns)) {
			errors.push(`Missing required field: ${field.name}`);
		}
	});

	// Check for at least one line item
	const lineItems = xmlDoc.querySelectorAll("IncludedSupplyChainTradeLineItem");
	if (lineItems.length === 0) {
		errors.push("Invoice must contain at least one line item");
	}

	// Validate tax information
	const taxElements = xmlDoc.querySelectorAll("ApplicableTradeTax");
	if (taxElements.length === 0) {
		warnings.push("No tax information found");
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings,
		format: detectFormat(xmlDoc)
	};
}

/**
 * Helper functions
 */
function getNamespaces(xmlDoc) {
	// Common namespaces used in XRechnung/ZUGFeRD
	return {
		rsm: "urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100",
		ram: "urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100",
		udt: "urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100"
	};
}

function getTextContent(node, path, namespaces) {
	if (!node) return "";

	const parts = path.split(" ");
	let current = node;

	for (const part of parts) {
		if (part.includes("[")) {
			// Handle attribute selectors
			const [tagName, attrSelector] = part.split("[");
			const [attrName, attrValue] = attrSelector.replace("]", "").split("=");

			const elements = current.getElementsByTagName(tagName);
			current = Array.from(elements).find(
				(el) => el.getAttribute(attrName) === attrValue.replace(/"/g, "")
			);
		} else {
			// Regular tag name
			const elements = current.getElementsByTagName(part);
			current = elements[0];
		}

		if (!current) return "";
	}

	return current.textContent || "";
}

function getAllTextContent(node, path, namespaces) {
	if (!node) return [];

	const parts = path.split(" ");
	const tagName = parts[parts.length - 1];
	const elements = node.getElementsByTagName(tagName);

	return Array.from(elements)
		.map((el) => el.textContent)
		.filter(Boolean);
}

function getAttribute(node, elementName, attrName, namespaces) {
	const element = node.getElementsByTagName(elementName)[0];
	return element ? element.getAttribute(attrName) : "";
}

function parseDate(dateString) {
	if (!dateString || dateString.length !== 8) return "";

	// Convert YYYYMMDD to YYYY-MM-DD
	return `${dateString.substr(0, 4)}-${dateString.substr(
		4,
		2
	)}-${dateString.substr(6, 2)}`;
}

function detectFormat(xmlDoc) {
	const contextId = getTextContent(
		xmlDoc,
		"GuidelineSpecifiedDocumentContextParameter ID"
	);

	if (contextId.includes("xrechnung")) {
		return "XRechnung";
	} else if (contextId.includes("zugferd")) {
		return "ZUGFeRD";
	}

	return "Unknown";
}

/**
 * Format currency values for display
 */
export function formatCurrency(amount, currency = "EUR") {
	return new Intl.NumberFormat("de-DE", {
		style: "currency",
		currency: currency
	}).format(amount);
}

/**
 * Format date for display
 */
export function formatDate(dateString) {
	if (!dateString) return "";

	return new Date(dateString).toLocaleDateString("de-DE", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit"
	});
}
