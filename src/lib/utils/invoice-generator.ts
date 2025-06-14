// src/lib/utils/invoice-generator.js - FIXED TAX CALCULATIONS

import { jsPDF } from "jspdf";
import type { CellConfig } from "jspdf";
import { PDFDocument } from "pdf-lib";
import type { Invoice } from "$lib/types/invoice";
import autoTable from "jspdf-autotable";

// Erweiterter Typ für Rechnungsdaten, der alle denkbaren Felder abdeckt.
type InvoiceData = Invoice & { [key: string]: any };

// Typ-Definition für eine PDF-Vorlagenfunktion.
type PdfTemplate = (doc: jsPDF, data: InvoiceData) => void;

/**
 * ==================================================================================
 * PDF-Vorlagen: Classic & Modern
 * ==================================================================================
 */
const templates: { [key: string]: PdfTemplate } = {
	classic: (doc, data) => {
		const { sender, recipient, metadata, items } = data;
		const totals = calculateTotals(data);
		const isKleinunternehmer = metadata.taxType === "KLEINUNTERNEHMER";

		const drawPageContent = (isFirstPage: boolean) => {
			// Header
			doc
				.setFontSize(9)
				.setFont("helvetica", "normal")
				.setTextColor(136, 136, 136);
			doc.text(
				`${sender.name} • ${sender.street} • ${sender.zip} ${sender.city}`,
				210 - 20,
				15,
				{ align: "right" }
			);

			if (isFirstPage) {
				// Adressblock
				doc.setFontSize(7).setTextColor(136, 136, 136);
				doc.text(
					`${sender.name} • ${sender.street} • ${sender.zip} ${sender.city}`,
					20,
					45
				);
				doc.setDrawColor(224, 224, 224).line(20, 47, 100, 47);

				doc.setFontSize(11).setTextColor(51, 51, 51);
				doc.setFont("helvetica", "bold");
				doc.text(recipient.name, 20, 55);
				doc.setFont("helvetica", "normal");
				doc.text(recipient.street, 20, 60);
				doc.text(`${recipient.zip} ${recipient.city}`, 20, 65);

				// Metadaten
				const metaX = 210 - 20;
				doc.setFontSize(9);
				doc.setFont("helvetica", "bold");
				doc.text("Rechnungs-Nr.:", metaX, 55, { align: "right" });
				doc.text("Datum:", metaX, 60, { align: "right" });
				if (metadata.deliveryDate)
					doc.text("Lieferdatum:", metaX, 65, { align: "right" });
				if (recipient.reference)
					doc.text("Ihre Referenz:", metaX, 70, { align: "right" });

				doc.setFont("helvetica", "normal");
				doc.text(metadata.invoiceNumber, metaX - 35, 55, { align: "right" });
				doc.text(formatDateDE(metadata.date), metaX - 35, 60, {
					align: "right"
				});
				if (metadata.deliveryDate)
					doc.text(formatDateDE(metadata.deliveryDate), metaX - 35, 65, {
						align: "right"
					});
				if (recipient.reference)
					doc.text(recipient.reference, metaX - 35, 70, { align: "right" });

				// Titel und Einleitung
				doc.setFontSize(18).setFont("helvetica", "bold");
				doc.text(metadata.documentTitle || "Rechnung", 20, 90);
				if (metadata.introductionText) {
					doc.setFontSize(9).setFont("helvetica", "normal");
					doc.text(metadata.introductionText, 20, 100, { maxWidth: 170 });
				}
			}
		};

		// Erste Seite zeichnen
		drawPageContent(true);

		const tableBody = items.map((item, i) => [
			i + 1,
			item.description,
			item.quantity,
			item.unit,
			formatCurrency(item.unitPrice),
			formatCurrency(item.quantity * item.unitPrice)
		]);

		autoTable(doc, {
			head: [
				["Pos.", "Bezeichnung", "Menge", "Einheit", "Einzelpreis", "Gesamt"]
			],
			body: tableBody,
			theme: "grid",
			startY: 110,
			headStyles: {
				fillColor: "#f8f8f8",
				textColor: "#333",
				fontStyle: "bold",
				fontSize: 8
			},

			styles: { fontSize: 9, cellPadding: 3, overflow: "linebreak" },
			columnStyles: {
				0: { halign: "center", cellWidth: 8 },
				1: { cellWidth: "auto" },
				2: { halign: "right", cellWidth: 10 },
				3: { halign: "left", cellWidth: 15 },
				4: { halign: "right", cellWidth: 15 },
				5: { halign: "right", cellWidth: 15 }
			},
			didDrawPage: (data) => {
				if (data.pageNumber > 1) {
					drawPageContent(false);
				}
			},
			margin: { top: 40, bottom: 40 }
		});

		let finalY = (doc as any).lastAutoTable.finalY;

		// Summenblock
		const drawTotals = (y: number) => {
			const totalsX = 120;
			const totalsWidth = 70;
			let currentY = y;
			if (isKleinunternehmer) {
				doc.setFontSize(11).setFont("helvetica", "bold");
				doc.text("Gesamtbetrag", totalsX, currentY);
				doc.text(
					formatCurrency(totals.total),
					totalsX + totalsWidth,
					currentY,
					{ align: "right" }
				);
				currentY += 10;
				doc.setFontSize(8).setFont("helvetica", "normal");
				doc.text(
					"Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.",
					totalsX,
					currentY,
					{ maxWidth: 70 }
				);
			} else {
				doc.setFontSize(9).setFont("helvetica", "normal");
				doc.text("Zwischensumme", totalsX, currentY);
				doc.text(
					formatCurrency(totals.subtotal),
					totalsX + totalsWidth,
					currentY,
					{ align: "right" }
				);
				currentY += 5;

				for (const group of Object.values(totals.taxGroups as any)) {
					doc.text(`+ ${group.rate}% MwSt.`, totalsX, currentY);
					doc.text(formatCurrency(group.tax), totalsX + totalsWidth, currentY, {
						align: "right"
					});
					currentY += 5;
				}

				doc
					.setDrawColor(51, 51, 51)
					.setLineWidth(0.3)
					.line(totalsX, currentY, totalsX + totalsWidth, currentY);
				currentY += 5;

				doc.setFontSize(11).setFont("helvetica", "bold");
				doc.text("Gesamtbetrag", totalsX, currentY);
				doc.text(
					formatCurrency(totals.total),
					totalsX + totalsWidth,
					currentY,
					{ align: "right" }
				);
			}
			return currentY;
		};

		let summaryY = finalY + 10;
		if (summaryY > 230) {
			doc.addPage();
			summaryY = 45;
		}

		finalY = drawTotals(summaryY);

		// Abschlusstexte
		let closingY = finalY + 20;
		if (closingY > 240) {
			doc.addPage();
			closingY = 45;
		}

		if (data.metadata.closingText) {
			doc.setFontSize(9).setFont("helvetica", "normal");
			doc.text(data.metadata.closingText, 20, closingY, { maxWidth: 170 });
			closingY += 10;
		}
		doc.setFont("helvetica", "bold");
		doc.text(getPaymentTermsText(data.metadata), 20, closingY);
	}
};
/**
 * ==================================================================================
 * Haupt-Orchestrierungsfunktion
 * ==================================================================================
 */
export async function generateInvoice(
	format: "UBL" | "CII" | "ZUGFeRD" | "PDF" | string = "ZUGFeRD",
	invoiceData: InvoiceData,
	templateId: string = "classic"
): Promise<Blob> {
	// Wähle die entsprechende Funktion basierend auf dem Format
	switch (format) {
		case "UBL":
			return new Blob([generateXRechnungUBL(invoiceData)], {
				type: "application/xml"
			});
		case "CII":
			return new Blob([generateXRechnungCII(invoiceData)], {
				type: "application/xml"
			});
		case "ZUGFeRD":
			return generateZUGFeRD(invoiceData, templateId);
		case "PDF":
			return generatePdfOnly(invoiceData, templateId);
		default:
			throw new Error("Unsupported invoice format");
	}
}

async function generatePdfOnly(
	invoiceData: InvoiceData,
	templateId: string
): Promise<Blob> {
	const template = templates[templateId];
	if (!template) throw new Error(`Template '${templateId}' not found.`);

	const doc = new jsPDF({ unit: "mm", format: "a4" });
	template(doc, invoiceData); // Template-Funktion aufrufen
	return doc.output("blob");
}

async function generateZUGFeRD(
	invoiceData: InvoiceData,
	templateId: string
): Promise<Blob> {
	const template = templates[templateId];
	if (!template) throw new Error(`Template '${templateId}' not found.`);

	// 1. Visuelles PDF mit jsPDF und dem gewählten Template erstellen
	const jspdfDoc = new jsPDF({ unit: "mm", format: "a4" });
	template(jspdfDoc, invoiceData);
	const pdfBytes = jspdfDoc.output("arraybuffer");

	// 2. CII XML für die Einbettung generieren
	const ciiXml = generateXRechnungCII(invoiceData);
	const xmlBytes = new TextEncoder().encode(ciiXml);

	// 3. XML mit pdf-lib in das PDF einbetten
	const pdfDoc = await PDFDocument.load(pdfBytes);
	await pdfDoc.attach(xmlBytes, "zugferd-invoice.xml", {
		mimeType: "application/xml",
		description: "ZUGFeRD-Rechnungsdaten im CII-XML-Format"
	});

	// 4. PDF mit eingebetteter Datei speichern und zurückgeben
	const finalPdfBytes = await pdfDoc.save();
	return new Blob([finalPdfBytes], { type: "application/pdf" });
}

function renderTotals(doc: jsPDF, data: InvoiceData, x: number, y: number) {
	const totals = calculateTotals(data);
	doc.setFont("helvetica", "normal");

	if (data.metadata.taxType === "KLEINUNTERNEHMER") {
		doc.setFontSize(10);
		doc.text("Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.", 15, y);
		y += 15;
		doc.setFontSize(14).setFont("helvetica", "bold");
		doc.text("Gesamtbetrag:", x, y, { align: "right" });
		doc.text(formatCurrency(totals.total), 200, y, { align: "right" });
	} else {
		doc.setFontSize(11);
		doc.text("Zwischensumme:", x, y, { align: "right" });
		doc.text(formatCurrency(totals.subtotal), 200, y, { align: "right" });

		let i = 1;
		for (const group of Object.values(totals.taxGroups)) {
			doc.text(`+ ${group.rate}% MwSt.:`, x, y + 7 * i, { align: "right" });
			doc.text(formatCurrency(group.tax), 200, y + 7 * i, { align: "right" });
			i++;
		}

		y += 7 * i + 3;
		doc.setFontSize(14).setFont("helvetica", "bold");
		doc.text("Gesamtbetrag:", x, y, { align: "right" });
		doc.text(formatCurrency(totals.total), 200, y, { align: "right" });
	}
}

function renderFooter(doc: jsPDF, data: InvoiceData, y: number) {
	const { sender } = data;
	const { companyInfo, bankDetails } = sender;
	doc.setFontSize(9).setTextColor("#333");

	const leftCol = [
		`${sender.name}`,
		`${sender.street}, ${sender.zip} ${sender.city}`,
		`Telefon: ${sender.phone}`,
		`E-Mail: ${sender.email}`
	];
	const middleCol = [
		`Bank: ${bankDetails.bankName}`,
		`IBAN: ${bankDetails.iban}`,
		`BIC: ${bankDetails.bic}`,
		`Kontoinhaber: ${bankDetails.accountHolder}`
	];
	const rightCol = [
		// Dynamische Anzeige basierend auf Unternehmensform
		...(companyInfo.managingDirector
			? [`Geschäftsführer: ${companyInfo.managingDirector}`]
			: []),
		...(companyInfo.commercialRegister
			? [`${companyInfo.registerCourt}, ${companyInfo.commercialRegister}`]
			: []),
		`Steuernummer: ${sender.taxId}`,
		`USt-IdNr.: ${sender.ustId}`
	];

	doc.text(leftCol.join("\n"), 15, y);
	doc.text(middleCol.join("\n"), 80, y);
	doc.text(rightCol.join("\n"), 200, y, { align: "right" });
}

const calculateTotals = (data: InvoiceData) => {
	const items = data.items || [];
	const isKleinunternehmer = data.metadata.taxType === "KLEINUNTERNEHMER";

	const subtotal = items.reduce(
		(sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
		0
	);

	if (isKleinunternehmer) {
		return { subtotal, taxAmount: 0, total: subtotal, taxGroups: {} };
	}

	const taxGroups = items.reduce((groups, item) => {
		const rate = item.taxRate || 19;
		if (!groups[rate]) groups[rate] = { rate, base: 0, tax: 0 };
		const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
		groups[rate].base += itemTotal;
		groups[rate].tax += (itemTotal * rate) / 100;
		return groups;
	}, {} as { [key: number]: { rate: number; base: number; tax: number } });

	const taxAmount = Object.values(taxGroups).reduce(
		(sum, group) => sum + group.tax,
		0
	);
	const total = subtotal + taxAmount;
	return { subtotal, taxGroups, taxAmount, total };
};

/**
 * Generiert XRechnung 3.0.2 konforme XML in CII-Syntax
 * (Standard für ZUGFeRD und XRechnung)
 */
export function generateXRechnungCII(invoiceData) {
	const { subtotal, taxGroups, taxAmount, total } =
		calculateTotals(invoiceData);

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
      <ram:ID>${
				invoiceData.metadata.customizationId ||
				"urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0"
			}</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
 
  <rsm:ExchangedDocument>
    <ram:ID>${escapeXml(invoiceData.metadata.invoiceNumber)}</ram:ID>
    <ram:TypeCode>${
			invoiceData.metadata.invoiceTypeCode || "380"
		}</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${formatDate(
				invoiceData.metadata.date
			)}</udt:DateTimeString>
    </ram:IssueDateTime>
    ${
			invoiceData.metadata.introductionText
				? `<ram:IncludedNote>
        <ram:Content>${escapeXml(
					invoiceData.metadata.introductionText
				)}</ram:Content>
      </ram:IncludedNote>`
				: ""
		}
  </rsm:ExchangedDocument>
 
  <rsm:SupplyChainTradeTransaction>
    ${invoiceData.items
			.map((item, index) => generateCIILineItem(item, index + 1))
			.join("\n    ")}
    
    <ram:ApplicableHeaderTradeAgreement>
      <ram:BuyerReference>${escapeXml(
				invoiceData.recipient.reference || "N/A"
			)}</ram:BuyerReference>
      
      <ram:SellerTradeParty>
        <ram:Name>${escapeXml(invoiceData.sender.name)}</ram:Name>
        <ram:DefinedTradeContact>
          <ram:PersonName>${escapeXml(
						invoiceData.sender.contactName || invoiceData.sender.name
					)}</ram:PersonName>
          <ram:TelephoneUniversalCommunication>
            <ram:CompleteNumber>${escapeXml(
							invoiceData.sender.phone || "N/A"
						)}</ram:CompleteNumber>
          </ram:TelephoneUniversalCommunication>
          <ram:EmailURIUniversalCommunication>
            <ram:URIID>${escapeXml(
							invoiceData.sender.email || "N/A"
						)}</ram:URIID>
          </ram:EmailURIUniversalCommunication>
        </ram:DefinedTradeContact>
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${escapeXml(
						invoiceData.sender.zip
					)}</ram:PostcodeCode>
          <ram:LineOne>${escapeXml(invoiceData.sender.street)}</ram:LineOne>
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
            <ram:ID schemeID="FC">${escapeXml(
							invoiceData.sender.taxId
						)}</ram:ID>
          </ram:SpecifiedTaxRegistration>`
						: ""
				}
        ${
					invoiceData.sender.ustId
						? `<ram:SpecifiedTaxRegistration>
            <ram:ID schemeID="VA">${escapeXml(
							invoiceData.sender.ustId
						)}</ram:ID>
          </ram:SpecifiedTaxRegistration>`
						: ""
				}
      </ram:SellerTradeParty>
      
      <ram:BuyerTradeParty>
        <ram:Name>${escapeXml(invoiceData.recipient.name)}</ram:Name>
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${escapeXml(
						invoiceData.recipient.zip
					)}</ram:PostcodeCode>
          <ram:LineOne>${escapeXml(invoiceData.recipient.street)}</ram:LineOne>
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
				invoiceData.metadata.currency || "EUR"
			}</ram:InvoiceCurrencyCode>

      <ram:SpecifiedTradeSettlementPaymentMeans>
        <ram:TypeCode>${
					invoiceData.sender.bankDetails?.iban ? "58" : "1"
				}</ram:TypeCode>
        ${
					invoiceData.sender.bankDetails?.iban
						? `<ram:PayeePartyCreditorFinancialAccount>
              <ram:IBANID>${escapeXml(
								invoiceData.sender.bankDetails.iban
							)}</ram:IBANID>
            </ram:PayeePartyCreditorFinancialAccount>
            ${
							invoiceData.sender.bankDetails?.bic
								? `<ram:PayeeSpecifiedCreditorFinancialInstitution>
                  <ram:BICID>${escapeXml(
										invoiceData.sender.bankDetails.bic
									)}</ram:BICID>
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

      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${subtotal.toFixed(2)}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>${subtotal.toFixed(
					2
				)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="${
					invoiceData.metadata.currency || "EUR"
				}">${taxAmount.toFixed(2)}</ram:TaxTotalAmount>
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
	const { subtotal, taxGroups, taxAmount, total } =
		calculateTotals(invoiceData);

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ubl:Invoice 
    xmlns:ubl="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
    xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
    xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
 
  <cbc:CustomizationID>${
		invoiceData.metadata.customizationId ||
		"urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0"
	}</cbc:CustomizationID>
  <cbc:ProfileID>${
		invoiceData.metadata.profileId ||
		"urn:fdc:peppol.eu:2017:poacc:billing:01:1.0"
	}</cbc:ProfileID>
  <cbc:ID>${escapeXml(invoiceData.metadata.invoiceNumber)}</cbc:ID>
  <cbc:IssueDate>${invoiceData.metadata.date}</cbc:IssueDate>
  ${
		invoiceData.metadata.dueDate
			? `<cbc:DueDate>${invoiceData.metadata.dueDate}</cbc:DueDate>`
			: ""
	}
  <cbc:InvoiceTypeCode>${
		invoiceData.metadata.invoiceTypeCode || "380"
	}</cbc:InvoiceTypeCode>
  ${
		invoiceData.metadata.introductionText
			? `<cbc:Note>${escapeXml(
					invoiceData.metadata.introductionText
			  )}</cbc:Note>`
			: ""
	}
  <cbc:DocumentCurrencyCode>${
		invoiceData.metadata.currency || "EUR"
	}</cbc:DocumentCurrencyCode>
  <cbc:BuyerReference>${escapeXml(
		invoiceData.recipient.reference || "N/A"
	)}</cbc:BuyerReference>
 
  <cac:AccountingSupplierParty>
    <cac:Party>
      ${
				invoiceData.sender.email
					? `<cbc:EndpointID schemeID="EM">${escapeXml(
							invoiceData.sender.email
					  )}</cbc:EndpointID>`
					: ""
			}
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
        <cbc:RegistrationName>${escapeXml(
					invoiceData.sender.name
				)}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
      <cac:Contact>
        <cbc:Name>${escapeXml(
					invoiceData.sender.contactName || invoiceData.sender.name
				)}</cbc:Name>
        <cbc:Telephone>${escapeXml(
					invoiceData.sender.phone || "N/A"
				)}</cbc:Telephone>
        <cbc:ElectronicMail>${escapeXml(
					invoiceData.sender.email || "N/A"
				)}</cbc:ElectronicMail>
      </cac:Contact>
    </cac:Party>
  </cac:AccountingSupplierParty>
 
  <cac:AccountingCustomerParty>
    <cac:Party>
      ${
				invoiceData.recipient.email
					? `<cbc:EndpointID schemeID="EM">${escapeXml(
							invoiceData.recipient.email
					  )}</cbc:EndpointID>`
					: ""
			}
      <cac:PartyName>
        <cbc:Name>${escapeXml(invoiceData.recipient.name)}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${escapeXml(
					invoiceData.recipient.street
				)}</cbc:StreetName>
        <cbc:CityName>${escapeXml(invoiceData.recipient.city)}</cbc:CityName>
        <cbc:PostalZone>${escapeXml(invoiceData.recipient.zip)}</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>DE</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${escapeXml(
					invoiceData.recipient.name
				)}</cbc:RegistrationName>
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
    <cbc:PaymentMeansCode>${
			invoiceData.sender.bankDetails?.iban ? "58" : "1"
		}</cbc:PaymentMeansCode>
    ${
			invoiceData.sender.bankDetails?.iban
				? `<cac:PayeeFinancialAccount>
        <cbc:ID>${escapeXml(invoiceData.sender.bankDetails.iban)}</cbc:ID>
        ${
					invoiceData.sender.bankDetails?.bic
						? `<cac:FinancialInstitutionBranch>
            <cbc:ID>${escapeXml(invoiceData.sender.bankDetails.bic)}</cbc:ID>
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
    <cbc:TaxAmount currencyID="${
			invoiceData.metadata.currency || "EUR"
		}">${taxAmount.toFixed(2)}</cbc:TaxAmount>
    ${Object.values(taxGroups)
			.map(
				(group) => `<cac:TaxSubtotal>
        <cbc:TaxableAmount currencyID="${
					invoiceData.metadata.currency || "EUR"
				}">${group.base.toFixed(2)}</cbc:TaxableAmount>
        <cbc:TaxAmount currencyID="${
					invoiceData.metadata.currency || "EUR"
				}">${group.tax.toFixed(2)}</cbc:TaxAmount>
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
    <cbc:LineExtensionAmount currencyID="${
			invoiceData.metadata.currency || "EUR"
		}">${subtotal.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${
			invoiceData.metadata.currency || "EUR"
		}">${subtotal.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${
			invoiceData.metadata.currency || "EUR"
		}">${total.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${
			invoiceData.metadata.currency || "EUR"
		}">${total.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
 
  ${invoiceData.items
		.map((item, index) => generateUBLLineItem(item, index + 1))
		.join("\n  ")}
</ubl:Invoice>`;

	return xml;
}

// Helper functions
function generateCIILineItem(item, lineNumber) {
	const lineTotal = (item.quantity || 0) * (item.unitPrice || 0);

	return `<ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>${lineNumber}</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      
      <ram:SpecifiedTradeProduct>
        <ram:Name>${escapeXml(item.description)}</ram:Name>
        ${
					item.articleNumber
						? `<ram:SellerAssignedID>${escapeXml(
								item.articleNumber
						  )}</ram:SellerAssignedID>`
						: ""
				}
      </ram:SpecifiedTradeProduct>
      
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>${(item.unitPrice || 0).toFixed(
						2
					)}</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="${getUnitCode(item.unit)}">${
		item.quantity || 0
	}</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>${
						(item.taxRate || 0) === 0 ? "Z" : "S"
					}</ram:CategoryCode>
          <ram:RateApplicablePercent>${
						item.taxRate || 0
					}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${lineTotal.toFixed(2)}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`;
}

function generateUBLLineItem(item, lineNumber) {
	const lineTotal = (item.quantity || 0) * (item.unitPrice || 0);

	return `<cac:InvoiceLine>
    <cbc:ID>${lineNumber}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="${getUnitCode(item.unit)}">${
		item.quantity || 0
	}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="EUR">${lineTotal.toFixed(
			2
		)}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>${escapeXml(item.description)}</cbc:Name>
      ${
				item.articleNumber
					? `<cac:SellersItemIdentification><cbc:ID>${escapeXml(
							item.articleNumber
					  )}</cbc:ID></cac:SellersItemIdentification>`
					: ""
			}
      <cac:ClassifiedTaxCategory>
        <cbc:ID>${(item.taxRate || 0) === 0 ? "Z" : "S"}</cbc:ID>
        <cbc:Percent>${item.taxRate || 0}</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="EUR">${(item.unitPrice || 0).toFixed(
				2
			)}</cbc:PriceAmount>
      <cbc:BaseQuantity unitCode="${getUnitCode(
				item.unit
			)}">1</cbc:BaseQuantity>
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

function formatDateDE(dateString?: string): string {
	if (!dateString) return "";
	const [year, month, day] = dateString.split("T")[0].split("-");
	return `${day}.${month}.${year}`;
}
function formatCurrency(amount: number): string {
	return new Intl.NumberFormat("de-DE", {
		style: "currency",
		currency: "EUR"
	}).format(amount);
}

function getPaymentTermsText(metadata: any): string {
	if (metadata.customPaymentTerms) return metadata.customPaymentTerms;
	const days =
		{ net14: 14, net30: 30, immediate: 0 }[metadata.paymentTerms] ?? 30;
	if (days === 0) return "Zahlbar sofort ohne Abzug.";
	const dueDate = new Date(metadata.date);
	dueDate.setDate(dueDate.getDate() + days);
	return `Zahlbar ohne Abzug bis zum ${formatDateDE(dueDate.toISOString())}.`;
}

function getUnitCode(unit: string): string {
	const unitCodes: { [key: string]: string } = {
		Stück: "C62",
		Stunden: "HUR",
		Tage: "DAY",
		Pauschal: "LS", // Lot (Pauschale)
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
		const isCII = root && root.tagName === "rsm:CrossIndustryInvoice";
		const isUBL = root && root.tagName === "ubl:Invoice";

		if (!isCII && !isUBL) {
			return {
				isValid: false,
				error:
					"Kein gültiges CrossIndustryInvoice oder UBL Invoice Root-Element"
			};
		}

		return { isValid: true };
	} catch (error) {
		return { isValid: false, error: error.message };
	}
}

/**
 * Download-Funktionalität mit Validierung
 */
export async function downloadXRechnung(invoiceData, syntax = "ZUGFeRD") {
	try {
		const blob = await generateInvoice(syntax, invoiceData);
		const blobFormat = blob.type;
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		let fileName = "Kostenlose-Erechnung-";

		if (syntax === "ZUGFeRD" || syntax === "PDF") {
			fileName += `${invoiceData.metadata.invoiceNumber}_${syntax}.pdf`;
		} else if (syntax === "CII" || syntax === "UBL") {
			fileName += `${invoiceData.metadata.invoiceNumber}_${syntax}.xml`;
		} else {
			throw new Error("Unsupported syntax for download");
		}
		a.download = fileName;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);

		return {
			success: true,
			filename: fileName
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
				`Position ${
					index + 1
				}: Einzelpreis ist erforderlich und darf nicht negativ sein`
			);
		}
	});

	return {
		isValid: errors.length === 0,
		errors
	};
}
