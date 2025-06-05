// src/lib/utils/invoice-generator.js

import { calculateInvoiceTotals } from "$lib/stores/invoice.js";

/**
 * Generate XRechnung 3.0 compliant XML
 */
export function generateXRechnung(invoiceData) {
	const { subtotal, taxGroups, total } = calculateInvoiceTotals(
		invoiceData.items
	);

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice 
    xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
    xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100"
    xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  
  <rsm:ExchangedDocument>
    <ram:ID>${escapeXml(invoiceData.metadata.invoiceNumber)}</ram:ID>
    <ram:TypeCode>${invoiceData.metadata.invoiceType}</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${formatDate(
				invoiceData.metadata.date
			)}</udt:DateTimeString>
    </ram:IssueDateTime>
    ${
			invoiceData.notes.introText
				? `<ram:IncludedNote>
      <ram:Content>${escapeXml(invoiceData.notes.introText)}</ram:Content>
    </ram:IncludedNote>`
				: ""
		}
  </rsm:ExchangedDocument>
  
  <rsm:SupplyChainTradeTransaction>
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>${escapeXml(invoiceData.sender.name)}</ram:Name>
        <ram:PostalTradeAddress>
          <ram:LineOne>${escapeXml(invoiceData.sender.street)}</ram:LineOne>
          <ram:PostcodeCode>${escapeXml(
						invoiceData.sender.zip
					)}</ram:PostcodeCode>
          <ram:CityName>${escapeXml(invoiceData.sender.city)}</ram:CityName>
          <ram:CountryID>DE</ram:CountryID>
        </ram:PostalTradeAddress>
        ${
					invoiceData.sender.email
						? `<ram:URIUniversalCommunication>
          <ram:URIID schemeID="EM">${escapeXml(
						invoiceData.sender.email
					)}</ram:URIID>
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
          <ram:LineOne>${escapeXml(invoiceData.recipient.street)}</ram:LineOne>
          <ram:PostcodeCode>${escapeXml(
						invoiceData.recipient.zip
					)}</ram:PostcodeCode>
          <ram:CityName>${escapeXml(invoiceData.recipient.city)}</ram:CityName>
          <ram:CountryID>DE</ram:CountryID>
        </ram:PostalTradeAddress>
        ${
					invoiceData.recipient.email
						? `<ram:URIUniversalCommunication>
          <ram:URIID schemeID="EM">${escapeXml(
						invoiceData.recipient.email
					)}</ram:URIID>
        </ram:URIUniversalCommunication>`
						: ""
				}
        ${
					invoiceData.recipient.reference
						? `<ram:BuyerReference>${escapeXml(
								invoiceData.recipient.reference
						  )}</ram:BuyerReference>`
						: ""
				}
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    
    <ram:ApplicableHeaderTradeDelivery>
      ${
				invoiceData.metadata.deliveryDate
					? `<ram:ActualDeliverySupplyChainEvent>
        <ram:OccurrenceDateTime>
          <udt:DateTimeString format="102">${formatDate(
						invoiceData.metadata.deliveryDate
					)}</udt:DateTimeString>
        </ram:OccurrenceDateTime>
      </ram:ActualDeliverySupplyChainEvent>`
					: ""
			}
    </ram:ApplicableHeaderTradeDelivery>
    
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>${
				invoiceData.metadata.currency
			}</ram:InvoiceCurrencyCode>
      
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
        <ram:Description>${getPaymentTermsText(
					invoiceData.metadata
				)}</ram:Description>
        ${
					invoiceData.metadata.dueDate
						? `<ram:DueDateDateTime>
          <udt:DateTimeString format="102">${formatDate(
						invoiceData.metadata.dueDate
					)}</udt:DateTimeString>
        </ram:DueDateDateTime>`
						: ""
				}
      </ram:SpecifiedTradePaymentTerms>
      
      ${
				invoiceData.sender.iban
					? `<ram:SpecifiedTradeSettlementPaymentMeans>
        <ram:TypeCode>58</ram:TypeCode>
        <ram:PayeePartyCreditorFinancialAccount>
          <ram:IBANID>${escapeXml(invoiceData.sender.iban)}</ram:IBANID>
        </ram:PayeePartyCreditorFinancialAccount>
        ${
					invoiceData.sender.bic
						? `<ram:PayeeSpecifiedCreditorFinancialInstitution>
          <ram:BICID>${escapeXml(invoiceData.sender.bic)}</ram:BICID>
        </ram:PayeeSpecifiedCreditorFinancialInstitution>`
						: ""
				}
      </ram:SpecifiedTradeSettlementPaymentMeans>`
					: ""
			}
      
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${subtotal.toFixed(2)}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>${subtotal.toFixed(
					2
				)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="${
					invoiceData.metadata.currency
				}">${Object.values(taxGroups)
		.reduce((sum, g) => sum + g.tax, 0)
		.toFixed(2)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${total.toFixed(2)}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${total.toFixed(2)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
    
    ${invoiceData.items
			.map((item, index) => generateLineItem(item, index + 1))
			.join("\n    ")}
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;

	return xml;
}

/**
 * Generate a single line item for the invoice
 */
function generateLineItem(item, lineNumber) {
	const lineTotal = item.quantity * item.unitPrice * (1 - item.discount / 100);

	return `<ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>${lineNumber}</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      
      <ram:SpecifiedTradeProduct>
        <ram:Name>${escapeXml(item.description)}</ram:Name>
      </ram:SpecifiedTradeProduct>
      
      <ram:SpecifiedLineTradeAgreement>
        <ram:GrossPriceProductTradePrice>
          <ram:ChargeAmount>${item.unitPrice.toFixed(2)}</ram:ChargeAmount>
          ${
						item.discount > 0
							? `<ram:AppliedTradeAllowanceCharge>
            <ram:ChargeIndicator>false</ram:ChargeIndicator>
            <ram:CalculationPercent>${item.discount}</ram:CalculationPercent>
            <ram:ActualAmount>${(
							(item.unitPrice * item.discount) /
							100
						).toFixed(2)}</ram:ActualAmount>
          </ram:AppliedTradeAllowanceCharge>`
							: ""
					}
        </ram:GrossPriceProductTradePrice>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>${(
						item.unitPrice *
						(1 - item.discount / 100)
					).toFixed(2)}</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="${getUnitCode(item.unit)}">${
		item.quantity
	}</ram:BilledQuantity>
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

/**
 * Generate ZUGFeRD XML (embedded in PDF)
 * ZUGFeRD uses the same structure as XRechnung but with different namespace
 */
export function generateZugferd(invoiceData) {
	// ZUGFeRD 2.1 is compatible with XRechnung
	return generateXRechnung(invoiceData);
}

/**
 * Helper functions
 */
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
		"m²": "MTK"
	};

	return unitCodes[unit] || "C62";
}

/**
 * Download XML file
 */
export function downloadXml(content, filename) {
	const blob = new Blob([content], { type: "application/xml" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

/**
 * Generate PDF with embedded XML (ZUGFeRD)
 * Note: This requires a PDF library that supports PDF/A-3 and embedded files
 */
export async function generatePdfWithXml(invoiceData, xmlContent) {
	// This is a placeholder - in production you would use a library like
	// pdf-lib or similar that supports PDF/A-3 format
	console.log("PDF generation with embedded XML not yet implemented");

	// For now, just download the XML
	const filename = `Rechnung_${invoiceData.metadata.invoiceNumber}.xml`;
	downloadXml(xmlContent, filename);
}
