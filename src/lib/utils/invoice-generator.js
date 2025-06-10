// src/lib/utils/invoice-generator.js - XRechnung 3.0.1 konforme Generierung

import {
	total,
	subtotal,
	taxGroups,
	calculateInvoiceTotals
} from "$lib/stores/invoice.js";

/**
 * Generiert XRechnung 3.0.2 konforme XML in CII-Syntax
 * (Standard für ZUGFeRD und XRechnung)
 */
export function generateXRechnungCII(invoiceData) {
	const { subtotal, taxGroups, total } = calculateInvoiceTotals();

	// Der Anfang der XML-Datei bis <rsm:SupplyChainTradeTransaction> bleibt gleich...
	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice 
    xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
    xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100"
    xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
 
  <rsm:ExchangedDocumentContext>
  <ram:BusinessProcessSpecifiedDocumentContextParameter>
        <ram:ID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</ram:ID>
    </ram:BusinessProcessSpecifiedDocumentContextParameter>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>${invoiceData.metadata.customizationId || "urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0"}</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
 
  <rsm:ExchangedDocument>
    <ram:ID>${escapeXml(invoiceData.metadata.invoiceNumber)}</ram:ID>
    <ram:TypeCode>${invoiceData.metadata.invoiceTypeCode || "380"}</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${formatDate(invoiceData.metadata.date)}</udt:DateTimeString>
    </ram:IssueDateTime>
    ${
			invoiceData.notes?.introText
				? `<ram:IncludedNote>
    <ram:Content>${escapeXml(invoiceData.notes.introText)}</ram:Content>
    </ram:IncludedNote>`
				: ""
		}
  </rsm:ExchangedDocument>
 
  <rsm:SupplyChainTradeTransaction>
    ${invoiceData.items.map((item, index) => generateCIILineItem(item, index + 1)).join("\n    ")}
    
    <ram:ApplicableHeaderTradeAgreement>
      <ram:BuyerReference>${escapeXml(invoiceData.recipient.reference || "N/A")}</ram:BuyerReference>
      
      <ram:SellerTradeParty>
        <ram:Name>${escapeXml(invoiceData.sender.name)}</ram:Name>
		 <ram:DefinedTradeContact>
            <ram:PersonName>${escapeXml(invoiceData.sender.contactName || invoiceData.sender.name)}</ram:PersonName>
            <ram:TelephoneUniversalCommunication>
                <ram:CompleteNumber>${escapeXml(invoiceData.sender.phone || "N/A")}</ram:CompleteNumber>
            </ram:TelephoneUniversalCommunication>
            <ram:EmailURIUniversalCommunication>
                <ram:URIID>${escapeXml(invoiceData.sender.email || "N/A")}</ram:URIID>
            </ram:EmailURIUniversalCommunication>
        </ram:DefinedTradeContact>
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${escapeXml(invoiceData.sender.zip)}</ram:PostcodeCode>
          <ram:LineOne>${escapeXml(invoiceData.sender.street)}</ram:LineOne>
          <ram:CityName>${escapeXml(invoiceData.sender.city)}</ram:CityName>
          <ram:CountryID>DE</ram:CountryID>
        </ram:PostalTradeAddress>
        ${
					invoiceData.sender.email
						? `<ram:URIUniversalCommunication>
                    <ram:URIID schemeID="EM">${escapeXml(invoiceData.sender.email)}</ram:URIID>
                </ram:URIUniversalCommunication>`
						: ""
				}
        ${
					invoiceData.sender.taxId
						? `<ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="FC">${escapeXml(invoiceData.sender.taxId)}</ram:ID>
        </ram:SpecifiedTaxRegistration>`
						: ""
				}
        ${
					invoiceData.sender.ustId
						? `<ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">${escapeXml(invoiceData.sender.ustId)}</ram:ID>
        </ram:SpecifiedTaxRegistration>`
						: ""
				}
       
      </ram:SellerTradeParty>
      
      <ram:BuyerTradeParty>
        <ram:Name>${escapeXml(invoiceData.recipient.name)}</ram:Name>
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${escapeXml(invoiceData.recipient.zip)}</ram:PostcodeCode>
          <ram:LineOne>${escapeXml(invoiceData.recipient.street)}</ram:LineOne>
          <ram:CityName>${escapeXml(invoiceData.recipient.city)}</ram:CityName>
          <ram:CountryID>DE</ram:CountryID>
        </ram:PostalTradeAddress>
        ${
					invoiceData.recipient.email
						? `<ram:URIUniversalCommunication>
          <ram:URIID schemeID="EM">${escapeXml(invoiceData.recipient.email)}</ram:URIID>
        </ram:URIUniversalCommunication>`
						: ""
				}
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    
    <ram:ApplicableHeaderTradeDelivery>
      ${
				invoiceData.metadata.deliveryDate
					? `<ram:ActualDeliverySupplyChainEvent>
      <ram:OccurrenceDateTime>
        <udt:DateTimeString format="102">${formatDate(invoiceData.metadata.deliveryDate)}</udt:DateTimeString>
      </ram:OccurrenceDateTime>
    </ram:ActualDeliverySupplyChainEvent>`
					: ""
			}
    </ram:ApplicableHeaderTradeDelivery>
    
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>${invoiceData.metadata.currency || "EUR"}</ram:InvoiceCurrencyCode>

      <ram:SpecifiedTradeSettlementPaymentMeans>
          <ram:TypeCode>${invoiceData.sender.iban ? "58" : "1"}</ram:TypeCode>
          ${
						invoiceData.sender.iban
							? `<ram:PayeePartyCreditorFinancialAccount>
                      <ram:IBANID>${escapeXml(invoiceData.sender.iban)}</ram:IBANID>
                  </ram:PayeePartyCreditorFinancialAccount>
                  ${
										invoiceData.sender.bic
											? `<ram:PayeeSpecifiedCreditorFinancialInstitution>
                              <ram:BICID>${escapeXml(invoiceData.sender.bic)}</ram:BICID>
                          </ram:PayeeSpecifiedCreditorFinancialInstitution>`
											: ""
									}`
							: ""
					}
      </ram:SpecifiedTradeSettlementPaymentMeans>

      ${Object.values(taxGroups)
				.map(
					(group) => `<ram:ApplicableTradeTax>
                  <ram:CalculatedAmount>${group.tax.toFixed(2)}</ram:CalculatedAmount>
                  <ram:TypeCode>VAT</ram:TypeCode>
                  <ram:BasisAmount>${group.base.toFixed(2)}</ram:BasisAmount>
                  <ram:CategoryCode>${group.rate === 0 ? "Z" : "S"}</ram:CategoryCode>
                  <ram:RateApplicablePercent>${group.rate}</ram:RateApplicablePercent>
              </ram:ApplicableTradeTax>`
				)
				.join("\n      ")}

      <ram:SpecifiedTradePaymentTerms>
          <ram:Description>${getPaymentTermsText(invoiceData.metadata)}</ram:Description>
          ${
						invoiceData.metadata.dueDate
							? `<ram:DueDateDateTime>
                      <udt:DateTimeString format="102">${formatDate(invoiceData.metadata.dueDate)}</udt:DateTimeString>
                  </ram:DueDateDateTime>`
							: ""
					}
      </ram:SpecifiedTradePaymentTerms>

      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
          <ram:LineTotalAmount>${subtotal.toFixed(2)}</ram:LineTotalAmount>
          <ram:TaxBasisTotalAmount>${subtotal.toFixed(2)}</ram:TaxBasisTotalAmount>
          <ram:TaxTotalAmount currencyID="${invoiceData.metadata.currency || "EUR"}">${Object.values(
						taxGroups
					)
						.reduce((sum, g) => sum + g.tax, 0)
						.toFixed(2)}</ram:TaxTotalAmount>
          <ram:GrandTotalAmount>${total.toFixed(2)}</ram:GrandTotalAmount>
          <ram:DuePayableAmount>${total.toFixed(2)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
      </ram:ApplicableHeaderTradeSettlement>
    
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;

	return xml;
}

/**
 * Generiert XRechnung 3.0.1 konforme XML in UBL-Syntax
 * (Alternative Syntax, kompatibel mit PEPPOL)
 */
export function generateXRechnungUBL(invoiceData) {
	const { subtotal, taxGroups, total } = calculateInvoiceTotals();

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ubl:Invoice 
    xmlns:ubl="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
    xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
    xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
 
  <cbc:CustomizationID>${invoiceData.metadata.customizationId || "urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0"}</cbc:CustomizationID>
  <cbc:ProfileID>${invoiceData.metadata.profileId || "urn:fdc:peppol.eu:2017:poacc:billing:01:1.0"}</cbc:ProfileID>
  <cbc:ID>${escapeXml(invoiceData.metadata.invoiceNumber)}</cbc:ID>
  <cbc:IssueDate>${invoiceData.metadata.date}</cbc:IssueDate>
  ${invoiceData.metadata.dueDate ? `<cbc:DueDate>${invoiceData.metadata.dueDate}</cbc:DueDate>` : ""}
  <cbc:InvoiceTypeCode>${invoiceData.metadata.invoiceTypeCode || "380"}</cbc:InvoiceTypeCode>
  ${invoiceData.notes?.introText ? `<cbc:Note>${escapeXml(invoiceData.notes.introText)}</cbc:Note>` : ""}
  <cbc:DocumentCurrencyCode>${invoiceData.metadata.currency || "EUR"}</cbc:DocumentCurrencyCode>
  <cbc:BuyerReference>${escapeXml(invoiceData.recipient.reference || "N/A")}</cbc:BuyerReference> <cac:AccountingSupplierParty>
    <cac:Party>
      ${invoiceData.sender.email ? `<cbc:EndpointID schemeID="EM">${escapeXml(invoiceData.sender.email)}</cbc:EndpointID>` : ""}
      <cac:PartyName>
        <cbc:Name>${escapeXml(invoiceData.sender.name)}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${escapeXml(invoiceData.sender.street)}</cbc:StreetName>
        <cbc:CityName>${escapeXml(invoiceData.sender.city)}</cbc:CityName>
        <cbc:PostalZone>${escapeXml(invoiceData.sender.zip)}</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>DE</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      ${
				invoiceData.sender.taxId
					? `<cac:PartyTaxScheme>
        <cbc:CompanyID>${escapeXml(invoiceData.sender.taxId)}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>FC</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>`
					: ""
			}
      ${
				invoiceData.sender.ustId
					? `<cac:PartyTaxScheme>
        <cbc:CompanyID>${escapeXml(invoiceData.sender.ustId)}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>`
					: ""
			}
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${escapeXml(invoiceData.sender.name)}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
      <cac:Contact>
        <cbc:Name>${escapeXml(invoiceData.sender.contactName || invoiceData.sender.name)}</cbc:Name>
        <cbc:Telephone>${escapeXml(invoiceData.sender.phone || "N/A")}</cbc:Telephone>
        <cbc:ElectronicMail>${escapeXml(invoiceData.sender.email || "N/A")}</cbc:ElectronicMail>
      </cac:Contact>
    </cac:Party>
  </cac:AccountingSupplierParty>
 
  <cac:AccountingCustomerParty>
    <cac:Party>
      ${invoiceData.recipient.email ? `<cbc:EndpointID schemeID="EM">${escapeXml(invoiceData.recipient.email)}</cbc:EndpointID>` : ""}
      <cac:PartyName>
        <cbc:Name>${escapeXml(invoiceData.recipient.name)}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${escapeXml(invoiceData.recipient.street)}</cbc:StreetName>
        <cbc:CityName>${escapeXml(invoiceData.recipient.city)}</cbc:CityName>
        <cbc:PostalZone>${escapeXml(invoiceData.recipient.zip)}</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>DE</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${escapeXml(invoiceData.recipient.name)}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>
 
  ${
		invoiceData.metadata.deliveryDate
			? `<cac:Delivery>
    <cbc:ActualDeliveryDate>${invoiceData.metadata.deliveryDate}</cbc:ActualDeliveryDate>
  </cac:Delivery>`
			: ""
	}
 
  <cac:PaymentMeans>
    <cbc:PaymentMeansCode>${invoiceData.sender.iban ? "58" : "1"}</cbc:PaymentMeansCode>
    ${
			invoiceData.sender.iban
				? `<cac:PayeeFinancialAccount>
      <cbc:ID>${escapeXml(invoiceData.sender.iban)}</cbc:ID>
      ${
				invoiceData.sender.bic
					? `<cac:FinancialInstitutionBranch>
        <cbc:ID>${escapeXml(invoiceData.sender.bic)}</cbc:ID>
      </cac:FinancialInstitutionBranch>`
					: ""
			}
    </cac:PayeeFinancialAccount>`
				: ""
		}
  </cac:PaymentMeans>
 
  ${
		invoiceData.metadata.paymentTerms
			? `<cac:PaymentTerms>
    <cbc:Note>${getPaymentTermsText(invoiceData.metadata)}</cbc:Note>
  </cac:PaymentTerms>`
			: ""
	}
 
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${invoiceData.metadata.currency || "EUR"}">${Object.values(
			taxGroups
		)
			.reduce((sum, g) => sum + g.tax, 0)
			.toFixed(2)}</cbc:TaxAmount>
    ${Object.values(taxGroups)
			.map(
				(group) => `<cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${invoiceData.metadata.currency || "EUR"}">${group.base.toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${invoiceData.metadata.currency || "EUR"}">${group.tax.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>${group.rate === 0 ? "Z" : "S"}</cbc:ID>
        <cbc:Percent>${group.rate}</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>`
			)
			.join("\n    ")}
  </cac:TaxTotal>
 
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${invoiceData.metadata.currency || "EUR"}">${subtotal.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${invoiceData.metadata.currency || "EUR"}">${subtotal.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${invoiceData.metadata.currency || "EUR"}">${total.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${invoiceData.metadata.currency || "EUR"}">${total.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
 
  ${invoiceData.items.map((item, index) => generateUBLLineItem(item, index + 1)).join("\n ")}
</ubl:Invoice>`;

	return xml;
}

// Helper functions
function generateCIILineItem(item, lineNumber) {
	const lineTotal =
		item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100);

	return `<ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>${lineNumber}</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      
      <ram:SpecifiedTradeProduct>
        <ram:Name>${escapeXml(item.description)}</ram:Name>
      </ram:SpecifiedTradeProduct>
      
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>${item.unitPrice.toFixed(2)}</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="${getUnitCode(item.unit)}">${item.quantity}</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>${item.taxRate === 0 ? "Z" : "S"}</ram:CategoryCode>
          <ram:RateApplicablePercent>${item.taxRate}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${lineTotal.toFixed(2)}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`;
}

function generateUBLLineItem(item, lineNumber) {
	const lineTotal =
		item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100);

	return `<cac:InvoiceLine>
    <cbc:ID>${lineNumber}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="${getUnitCode(item.unit)}">${item.quantity}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="EUR">${lineTotal.toFixed(2)}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>${escapeXml(item.description)}</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>${item.taxRate === 0 ? "Z" : "S"}</cbc:ID>
        <cbc:Percent>${item.taxRate}</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="EUR">${item.unitPrice.toFixed(2)}</cbc:PriceAmount>
      <cbc:BaseQuantity unitCode="${getUnitCode(item.unit)}">1</cbc:BaseQuantity>
    </cac:Price>
  </cac:InvoiceLine>`;
}

// Helper functions
function escapeXml(str) {
	if (!str) return "";
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

function formatDate(dateString) {
	if (!dateString) return "";
	return dateString.replace(/-/g, "");
}

function getPaymentTermsText(metadata) {
	const terms = {
		net14: "Zahlbar innerhalb von 14 Tagen netto ohne Abzug",
		net30: "Zahlbar innerhalb von 30 Tagen netto ohne Abzug",
		immediate: "Zahlbar sofort ohne Abzug"
	};

	if (metadata.paymentTerms === "custom" && metadata.customPaymentTerms) {
		return metadata.customPaymentTerms;
	}

	return terms[metadata.paymentTerms] || terms["net30"];
}

function getUnitCode(unit) {
	const unitCodes = {
		Stück: "C62",
		Stunden: "HUR",
		Tage: "DAY",
		Pauschal: "C62",
		km: "KMT",
		kg: "KGM",
		"m²": "MTK",
		Liter: "LTR",
		Meter: "MTR"
	};

	return unitCodes[unit] || "C62";
}

/**
 * Hauptfunktion - wählt automatisch CII (Standard für ZUGFeRD)
 */
export function generateXRechnung(invoiceData, syntax = "CII") {
	if (syntax === "UBL") {
		return generateXRechnungUBL(invoiceData);
	}
	return generateXRechnungCII(invoiceData);
}

/**
 * Einfache XML-Strukturvalidierung
 */
export function validateXMLStructure(xmlString) {
	try {
		const parser = new DOMParser();
		const xmlDoc = parser.parseFromString(xmlString, "text/xml");

		// Prüfe auf Parser-Fehler
		const parserError = xmlDoc.querySelector("parsererror");
		if (parserError) {
			return {
				isValid: false,
				error: "XML Parser Error: " + parserError.textContent
			};
		}

		// Prüfe grundlegende XRechnung-Struktur
		const root = xmlDoc.documentElement;
		if (!root || root.tagName !== "rsm:CrossIndustryInvoice") {
			return {
				isValid: false,
				error: "Kein gültiges CrossIndustryInvoice Root-Element"
			};
		}

		// Prüfe erforderliche Elemente
		const requiredElements = [
			"rsm:ExchangedDocumentContext",
			"rsm:ExchangedDocument",
			"rsm:SupplyChainTradeTransaction"
		];

		for (const element of requiredElements) {
			if (!xmlDoc.querySelector(element)) {
				return { isValid: false, error: `Fehlendes Element: ${element}` };
			}
		}

		return { isValid: true };
	} catch (error) {
		return { isValid: false, error: error.message };
	}
}

/**
 * Download-Funktionalität mit Validierung
 */
export function downloadXRechnung(invoiceData, syntax = "CII") {
	try {
		const xml = generateXRechnung(invoiceData, syntax);

		// // Validiere XML vor Download
		// const validation = validateXMLStructure(xml);
		// if (!validation.isValid) {
		// 	throw new Error(`XML-Validierung fehlgeschlagen: ${validation.error}`);
		// }

		const blob = new Blob([xml], { type: "application/xml; charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `XRechnung_${invoiceData.metadata.invoiceNumber}_${syntax}.xml`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);

		return {
			success: true,
			filename: `XRechnung_${invoiceData.metadata.invoiceNumber}_${syntax}.xml`
		};
	} catch (error) {
		console.error("Download error:", error);
		return { success: false, error: error.message };
	}
}

/**
 * Validierung der XRechnung-Daten
 */
export function validateXRechnungData(invoiceData) {
	const errors = [];

	// Pflichtfelder prüfen
	if (!invoiceData.metadata.invoiceNumber?.trim()) {
		errors.push("Rechnungsnummer ist erforderlich");
	}

	if (!invoiceData.metadata.date) {
		errors.push("Rechnungsdatum ist erforderlich");
	}

	if (!invoiceData.sender.name?.trim()) {
		errors.push("Firmenname (Rechnungssteller) ist erforderlich");
	}

	if (
		!invoiceData.sender.street?.trim() ||
		!invoiceData.sender.zip?.trim() ||
		!invoiceData.sender.city?.trim()
	) {
		errors.push("Vollständige Adresse des Rechnungsstellers ist erforderlich");
	}

	if (!invoiceData.sender.taxId?.trim() && !invoiceData.sender.ustId?.trim()) {
		errors.push("Steuernummer oder USt-IdNr. ist erforderlich");
	}

	if (!invoiceData.recipient.name?.trim()) {
		errors.push("Name des Rechnungsempfängers ist erforderlich");
	}

	if (
		!invoiceData.recipient.street?.trim() ||
		!invoiceData.recipient.zip?.trim() ||
		!invoiceData.recipient.city?.trim()
	) {
		errors.push(
			"Vollständige Adresse des Rechnungsempfängers ist erforderlich"
		);
	}

	if (!invoiceData.items || invoiceData.items.length === 0) {
		errors.push("Mindestens eine Rechnungsposition ist erforderlich");
	}

	// Positionen validieren
	invoiceData.items?.forEach((item, index) => {
		if (!item.description?.trim()) {
			errors.push(`Position ${index + 1}: Beschreibung ist erforderlich`);
		}
		if (!item.quantity || item.quantity <= 0) {
			errors.push(`Position ${index + 1}: Menge muss größer als 0 sein`);
		}
		if (item.unitPrice === undefined || item.unitPrice < 0) {
			errors.push(
				`Position ${index + 1}: Einzelpreis ist erforderlich und darf nicht negativ sein`
			);
		}
	});

	return {
		isValid: errors.length === 0,
		errors
	};
}
