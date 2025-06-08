// /src/lib/utils/xml-parser.js

/**
 * Namespaces used in ZUGFeRD, UBL, and CII XML documents.
 */
const NS = {
	UBL_INVOICE: "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
	CAC: "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
	CBC: "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
	CII: "urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100",
	RAM: "urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100",
	UDT: "urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100"
};

/**
 * Main function to parse an XML string of an invoice.
 * @param {string} xmlString The XML content as a string.
 * @returns {Promise<object>} A structured object with the parsed invoice data.
 */
export async function parseInvoiceXml(xmlString) {
	try {
		const parser = new DOMParser();
		const xmlDoc = parser.parseFromString(xmlString, "text/xml");

		const parserError = xmlDoc.querySelector("parsererror");
		if (parserError) {
			console.error("XML Parsing Error:", parserError.textContent);
			throw new Error("Ungültiges XML-Format. Bitte prüfen Sie die Datei.");
		}

		const syntax = detectSyntax(xmlDoc);
		if (syntax === "Unknown") {
			throw new Error(
				"Rechnungssyntax (UBL oder CII) konnte nicht erkannt werden."
			);
		}

		const invoiceData = {
			syntax: syntax,
			profile: detectProfile(xmlDoc, syntax),
			metadata: extractMetadata(xmlDoc, syntax),
			sender: extractParty(xmlDoc, syntax, "sender"),
			recipient: extractParty(xmlDoc, syntax, "recipient"),
			items: extractLineItems(xmlDoc, syntax),
			totals: extractTotals(xmlDoc, syntax),
			rawXml: xmlString
		};

		console.log("Parsed invoice data:", invoiceData);
		return invoiceData;
	} catch (error) {
		console.error("Error parsing XML:", error);
		// Rethrow with a more user-friendly message
		throw new Error(`Fehler beim Parsen der Rechnung: ${error.message}`);
	}
}

/**
 * Helper to get text content from an XML node using an XPath expression.
 * @param {Element} contextNode The XML node to search within.
 * @param {string} xpath The XPath expression.
 * @param {(prefix: string) => string | null} nsResolver Namespace resolver function.
 * @returns {string} The trimmed text content or an empty string.
 */
function getText(contextNode, xpath, nsResolver) {
	if (!contextNode) return "";
	const doc = contextNode.ownerDocument || contextNode;
	try {
		const result = doc.evaluate(
			xpath,
			contextNode,
			nsResolver,
			XPathResult.STRING_TYPE,
			null
		);
		return result.stringValue.trim();
	} catch (e) {
		console.error(`XPath evaluation failed for: ${xpath}`, e);
		return "";
	}
}

/**
 * Creates a namespace resolver for XPath queries.
 */
function nsResolver(...prefixes) {
	const nsMap = {
		ubl: NS.UBL_INVOICE,
		cac: NS.CAC,
		cbc: NS.CBC,
		rsm: NS.CII,
		ram: NS.RAM,
		udt: NS.UDT
	};
	return (prefix) => nsMap[prefix] || null;
}

/**
 * Detects if the XML is UBL or CII syntax.
 */
function detectSyntax(xmlDoc) {
	if (xmlDoc.getElementsByTagNameNS(NS.UBL_INVOICE, "Invoice").length > 0)
		return "UBL";
	if (xmlDoc.getElementsByTagNameNS(NS.CII, "CrossIndustryInvoice").length > 0)
		return "CII";
	return "Unknown";
}

/**
 * Detects the profile of the invoice (e.g., ZUGFeRD BASIC, XRechnung).
 */
function detectProfile(xmlDoc, syntax) {
	let profileId = "";
	if (syntax === "UBL") {
		profileId = xmlDoc.evaluate(
			"normalize-space(//cbc:CustomizationID)",
			xmlDoc,
			nsResolver("cbc"),
			XPathResult.STRING_TYPE,
			null
		).stringValue;
	} else {
		// CII
		profileId = xmlDoc.evaluate(
			"normalize-space(//ram:GuidelineSpecifiedDocumentContextParameter/ram:ID)",
			xmlDoc,
			nsResolver("ram"),
			XPathResult.STRING_TYPE,
			null
		).stringValue;
	}

	if (!profileId) return "Unbekanntes Profil";
	if (profileId.includes("xrechnung")) return "XRechnung";
	if (profileId.includes("zugferd")) {
		if (profileId.includes("BASIC")) return "ZUGFeRD BASIC";
		if (profileId.includes("EN16931")) return "ZUGFeRD EN 16931";
		if (profileId.includes("EXTENDED")) return "ZUGFeRD EXTENDED";
		if (profileId.includes("MINIMUM")) return "ZUGFeRD MINIMUM";
		return "ZUGFeRD";
	}
	return "Standard";
}

/**
 * Extracts general metadata from the invoice.
 */
function extractMetadata(xmlDoc, syntax) {
	const root = xmlDoc.documentElement;

	if (syntax === "UBL") {
		const ns = nsResolver("cbc");
		return {
			invoiceNumber: getText(root, ".//cbc:ID", ns),
			date: getText(root, ".//cbc:IssueDate", ns),
			dueDate:
				getText(root, ".//cbc:DueDate", ns) ||
				getText(root, ".//cbc:InvoiceDueDate", ns),
			currency:
				root.getElementsByTagNameNS(NS.CBC, "DocumentCurrencyCode")[0]
					?.textContent || "EUR"
		};
	} else {
		// CII
		const ns = nsResolver("ram", "udt");
		const issueDateTime = getText(
			root,
			".//ram:ExchangedDocument/ram:IssueDateTime/udt:DateTimeString",
			ns
		);
		const dueDate = getText(
			root,
			".//ram:ApplicableHeaderTradeSettlement/ram:SpecifiedTradePaymentTerms/ram:DueDateDateTime/udt:DateTimeString",
			ns
		);
		return {
			invoiceNumber: getText(root, ".//ram:ExchangedDocument/ram:ID", ns),
			date: issueDateTime ? formatDate(issueDateTime) : "",
			dueDate: dueDate ? formatDate(dueDate) : "",
			currency:
				getText(
					root,
					".//ram:ApplicableHeaderTradeSettlement/ram:InvoiceCurrencyCode",
					ns
				) || "EUR"
		};
	}
}

/**
 * Extracts sender or recipient data.
 */
function extractParty(xmlDoc, syntax, type) {
	const root = xmlDoc.documentElement;
	if (syntax === "UBL") {
		const partySelector =
			type === "sender" ? "AccountingSupplierParty" : "AccountingCustomerParty";
		const partyNode = root.getElementsByTagNameNS(NS.CAC, partySelector)[0];
		if (!partyNode) return {};

		const ns = nsResolver("cac", "cbc");
		return {
			name: getText(partyNode, ".//cac:Party/cac:PartyName/cbc:Name", ns),
			street: getText(partyNode, ".//cac:PostalAddress/cbc:StreetName", ns),
			city: getText(partyNode, ".//cac:PostalAddress/cbc:CityName", ns),
			zip: getText(partyNode, ".//cac:PostalAddress/cbc:PostalZone", ns),
			country: getText(
				partyNode,
				".//cac:PostalAddress/cac:Country/cbc:IdentificationCode",
				ns
			),
			ustId: getText(
				partyNode,
				".//cac:Party/cac:PartyTaxScheme[cac:TaxScheme/cbc:ID='VAT']/cbc:CompanyID",
				ns
			),
			personalTAXID: getText(
				partyNode,
				".//cac:Party/cac:PartyTaxScheme[cac:TaxScheme/cbc:ID='FC']/cbc:CompanyID",
				ns
			),
			contact: {
				name: getText(partyNode, ".//cac:Party/cac:Contact/cbc:Name", ns),
				phone: getText(partyNode, ".//cac:Party/cac:Contact/cbc:Telephone", ns),
				email: getText(
					partyNode,
					".//cac:Party/cac:Contact/cbc:ElectronicMail",
					ns
				)
			}
		};
	} else {
		// CII
		const partySelector =
			type === "sender" ? "SellerTradeParty" : "BuyerTradeParty";
		const partyNode = root.getElementsByTagNameNS(NS.RAM, partySelector)[0];
		if (!partyNode) return {};

		const ns = nsResolver("ram");
		return {
			name: getText(partyNode, ".//ram:Name", ns),
			street: getText(partyNode, ".//ram:PostalTradeAddress/ram:LineOne", ns),
			city: getText(partyNode, ".//ram:PostalTradeAddress/ram:CityName", ns),
			zip: getText(partyNode, ".//ram:PostalTradeAddress/ram:PostcodeCode", ns),
			country: getText(
				partyNode,
				".//ram:PostalTradeAddress/ram:CountryID",
				ns
			),
			ustId: getText(
				partyNode,
				".//ram:SpecifiedTaxRegistration[ram:ID/@schemeID='VA']/ram:ID",
				ns
			),
			personalTAXID: getText(
				partyNode,
				".//ram:SpecifiedTaxRegistration[ram:ID/@schemeID='FC']/ram:ID",
				ns
			),
			contact: {
				name: getText(
					partyNode,
					".//ram:DefinedTradeContact/ram:PersonName",
					ns
				),
				phone: getText(
					partyNode,
					".//ram:DefinedTradeContact/ram:TelephoneUniversalCommunication/ram:CompleteNumber",
					ns
				),
				email: getText(
					partyNode,
					".//ram:DefinedTradeContact/ram:EmailURIUniversalCommunication/ram:URIID",
					ns
				)
			}
		};
	}
}

/**
 * Extracts line items from the invoice.
 */
function extractLineItems(xmlDoc, syntax) {
	const root = xmlDoc.documentElement;
	if (syntax === "UBL") {
		const itemNodes = root.getElementsByTagNameNS(NS.CAC, "InvoiceLine");
		const ns = nsResolver("cac", "cbc");
		return Array.from(itemNodes).map((item) => ({
			id: getText(item, ".//cbc:ID", ns),
			description: getText(item, ".//cac:Item/cbc:Name", ns),
			quantity: parseFloat(getText(item, ".//cbc:InvoicedQuantity", ns) || "0"),
			unit:
				item
					.getElementsByTagNameNS(NS.CBC, "InvoicedQuantity")[0]
					?.getAttribute("unitCode") || "C62",
			unitPrice: parseFloat(
				getText(item, ".//cac:Price/cbc:PriceAmount", ns) || "0"
			),
			taxRate: parseFloat(
				getText(
					item,
					".//cac:Item/cac:ClassifiedTaxCategory/cbc:Percent",
					ns
				) || "0"
			),
			lineTotal: parseFloat(
				getText(item, ".//cbc:LineExtensionAmount", ns) || "0"
			)
		}));
	} else {
		// CII
		const itemNodes = root.getElementsByTagNameNS(
			NS.RAM,
			"IncludedSupplyChainTradeLineItem"
		);
		const ns = nsResolver("ram");
		return Array.from(itemNodes).map((item) => ({
			id: getText(item, ".//ram:AssociatedDocumentLineDocument/ram:LineID", ns),
			description: getText(item, ".//ram:TradeProduct/ram:Name", ns),
			quantity: parseFloat(
				getText(
					item,
					".//ram:SpecifiedLineTradeDelivery/ram:BilledQuantity",
					ns
				) || "0"
			),
			unit:
				item
					.getElementsByTagNameNS(NS.RAM, "BilledQuantity")[0]
					?.getAttribute("unitCode") || "C62",
			unitPrice: parseFloat(
				getText(
					item,
					".//ram:SpecifiedLineTradeAgreement/ram:NetPriceProductTradePrice/ram:ChargeAmount",
					ns
				) || "0"
			),
			taxRate: parseFloat(
				getText(
					item,
					".//ram:SpecifiedLineTradeSettlement/ram:ApplicableTradeTax/ram:RateApplicablePercent",
					ns
				) || "0"
			),
			lineTotal: parseFloat(
				getText(
					item,
					".//ram:SpecifiedLineTradeSettlement/ram:SpecifiedTradeSettlementLineMonetarySummation/ram:LineTotalAmount",
					ns
				) || "0"
			)
		}));
	}
}

/**
 * **KORRIGIERTE FUNKTION**
 * Extracts the grand totals from the invoice.
 */
function extractTotals(xmlDoc, syntax) {
	const root = xmlDoc.documentElement;
	if (syntax === "UBL") {
		const legalMonetaryTotalNode = root.getElementsByTagNameNS(
			NS.CAC,
			"LegalMonetaryTotal"
		)[0];
		// The total tax amount is in a separate `TaxTotal` element
		const taxTotalNode = root.getElementsByTagNameNS(NS.CAC, "TaxTotal")[0];

		if (!legalMonetaryTotalNode) return {};

		const ns = nsResolver("cbc");

		// Correctly extract the tax amount from cac:TaxTotal/cbc:TaxAmount
		const taxTotal = taxTotalNode
			? parseFloat(getText(taxTotalNode, ".//cbc:TaxAmount", ns) || "0")
			: 0;

		return {
			netTotal: parseFloat(
				getText(legalMonetaryTotalNode, ".//cbc:LineExtensionAmount", ns) || "0"
			),
			taxTotal: taxTotal, // Corrected value
			grossTotal: parseFloat(
				getText(legalMonetaryTotalNode, ".//cbc:TaxInclusiveAmount", ns) || "0"
			),
			payableAmount: parseFloat(
				getText(legalMonetaryTotalNode, ".//cbc:PayableAmount", ns) || "0"
			)
		};
	} else {
		// CII
		const totalsNode = root.getElementsByTagNameNS(
			NS.RAM,
			"SpecifiedTradeSettlementHeaderMonetarySummation"
		)[0];
		if (!totalsNode) return {};
		const ns = nsResolver("ram");
		return {
			netTotal: parseFloat(
				getText(totalsNode, ".//ram:LineTotalAmount", ns) || "0"
			),
			taxTotal: parseFloat(
				getText(totalsNode, ".//ram:TaxTotalAmount", ns) || "0"
			), // This is correct for CII
			grossTotal: parseFloat(
				getText(totalsNode, ".//ram:GrandTotalAmount", ns) || "0"
			),
			payableAmount: parseFloat(
				getText(totalsNode, ".//ram:DuePayableAmount", ns) || "0"
			)
		};
	}
}

/**
 * Formats a date string from YYYYMMDD to YYYY-MM-DD.
 */
function formatDate(dateStr) {
	if (!dateStr || !/^\d{8}$/.test(dateStr)) return dateStr;
	return `${dateStr.substring(0, 4)}-${dateStr.substring(
		4,
		6
	)}-${dateStr.substring(6, 8)}`;
}
