<script>
	export let data;

	// Generate a simplified XML structure for preview
	function generateXmlPreview(data) {
		const subtotal = data.items.reduce(
			(sum, item) => sum + item.quantity * item.unitPrice,
			0
		);

		const taxAmount = data.items.reduce(
			(sum, item) =>
				sum + (item.quantity * item.unitPrice * item.taxRate) / 100,
			0
		);

		const total = subtotal + taxAmount;

		return `<?xml version="1.0" encoding="UTF-8"?>
  <rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
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
      <ram:ID>${data.metadata.invoiceNumber || "DRAFT"}</ram:ID>
      <ram:TypeCode>380</ram:TypeCode>
      <ram:IssueDateTime>
        <udt:DateTimeString format="102">${data.metadata.date || new Date().toISOString().split("T")[0]}</udt:DateTimeString>
      </ram:IssueDateTime>
    </rsm:ExchangedDocument>
    
    <rsm:SupplyChainTradeTransaction>
      <ram:ApplicableHeaderTradeAgreement>
        <ram:SellerTradeParty>
          <ram:Name>${escapeXml(data.sender.name || "Sender Name")}</ram:Name>
          <ram:PostalTradeAddress>
            <ram:LineOne>${escapeXml(data.sender.street || "Street")}</ram:LineOne>
            <ram:PostcodeCode>${escapeXml(data.sender.zip || "ZIP")}</ram:PostcodeCode>
            <ram:CityName>${escapeXml(data.sender.city || "City")}</ram:CityName>
            <ram:CountryID>DE</ram:CountryID>
          </ram:PostalTradeAddress>
          ${
						data.sender.taxId
							? `<ram:SpecifiedTaxRegistration>
            <ram:ID schemeID="FC">${escapeXml(data.sender.taxId)}</ram:ID>
          </ram:SpecifiedTaxRegistration>`
							: ""
					}
          ${
						data.sender.ustId
							? `<ram:SpecifiedTaxRegistration>
            <ram:ID schemeID="VA">${escapeXml(data.sender.ustId)}</ram:ID>
          </ram:SpecifiedTaxRegistration>`
							: ""
					}
        </ram:SellerTradeParty>
        
        <ram:BuyerTradeParty>
          <ram:Name>${escapeXml(data.recipient.name || "Recipient Name")}</ram:Name>
          <ram:PostalTradeAddress>
            <ram:LineOne>${escapeXml(data.recipient.street || "Street")}</ram:LineOne>
            <ram:PostcodeCode>${escapeXml(data.recipient.zip || "ZIP")}</ram:PostcodeCode>
            <ram:CityName>${escapeXml(data.recipient.city || "City")}</ram:CityName>
            <ram:CountryID>DE</ram:CountryID>
          </ram:PostalTradeAddress>
        </ram:BuyerTradeParty>
      </ram:ApplicableHeaderTradeAgreement>
      
      <ram:ApplicableHeaderTradeDelivery>
        ${
					data.metadata.deliveryDate
						? `<ram:ActualDeliverySupplyChainEvent>
          <ram:OccurrenceDateTime>
            <udt:DateTimeString format="102">${data.metadata.deliveryDate}</udt:DateTimeString>
          </ram:OccurrenceDateTime>
        </ram:ActualDeliverySupplyChainEvent>`
						: ""
				}
      </ram:ApplicableHeaderTradeDelivery>
      
      <ram:ApplicableHeaderTradeSettlement>
        <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
        
        ${data.items
					.map(
						(
							item,
							index
						) => `<ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${(item.quantity * item.unitPrice).toFixed(2)}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>`
					)
					.join("\n      ")}
        
        <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
          <ram:TaxBasisTotalAmount>${subtotal.toFixed(2)}</ram:TaxBasisTotalAmount>
          <ram:TaxTotalAmount currencyID="EUR">${taxAmount.toFixed(2)}</ram:TaxTotalAmount>
          <ram:GrandTotalAmount>${total.toFixed(2)}</ram:GrandTotalAmount>
          <ram:DuePayableAmount>${total.toFixed(2)}</ram:DuePayableAmount>
        </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
      </ram:ApplicableHeaderTradeSettlement>
      
      ${data.items
				.map(
					(item, index) => `<ram:IncludedSupplyChainTradeLineItem>
        <ram:AssociatedDocumentLineDocument>
          <ram:LineID>${index + 1}</ram:LineID>
        </ram:AssociatedDocumentLineDocument>
        <ram:SpecifiedTradeProduct>
          <ram:Name>${escapeXml(item.description || `Position ${index + 1}`)}</ram:Name>
        </ram:SpecifiedTradeProduct>
        <ram:SpecifiedLineTradeAgreement>
          <ram:NetPriceProductTradePrice>
            <ram:ChargeAmount>${item.unitPrice.toFixed(2)}</ram:ChargeAmount>
          </ram:NetPriceProductTradePrice>
        </ram:SpecifiedLineTradeAgreement>
        <ram:SpecifiedLineTradeDelivery>
          <ram:BilledQuantity unitCode="${escapeXml(item.unit)}">${item.quantity}</ram:BilledQuantity>
        </ram:SpecifiedLineTradeDelivery>
        <ram:SpecifiedLineTradeSettlement>
          <ram:ApplicableTradeTax>
            <ram:TypeCode>VAT</ram:TypeCode>
            <ram:CategoryCode>S</ram:CategoryCode>
            <ram:RateApplicablePercent>${item.taxRate}</ram:RateApplicablePercent>
          </ram:ApplicableTradeTax>
        </ram:SpecifiedLineTradeSettlement>
      </ram:IncludedSupplyChainTradeLineItem>`
				)
				.join("\n    ")}
    </rsm:SupplyChainTradeTransaction>
  </rsm:CrossIndustryInvoice>`;
	}

	function escapeXml(str) {
		if (!str) return "";
		return str
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&apos;");
	}

	$: xmlContent = generateXmlPreview(data);
</script>

<div class="xml-viewer">
	<div class="xml-header">
		<div class="xml-info">
			<span class="info-badge">XRechnung 3.0</span>
			<span class="info-text">Konforme E-Rechnung nach EN-16931</span>
		</div>
	</div>

	<pre class="xml-content"><code>{xmlContent}</code></pre>

	<div class="xml-footer">
		<p>
			Nur zur veranschaulichen Vorschau. Die tatsächliche XML kann je nach
			Eingabedaten abweichen.
		</p>
	</div>
</div>

<style>
	.xml-viewer {
		background: var(--bg-white);
		border-radius: var(--radius);
		overflow: hidden;
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.xml-header {
		background: var(--bg-light);
		padding: 1rem 1.5rem;
		border-bottom: 1px solid var(--border-color);
	}

	.xml-info {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.info-badge {
		background: var(--primary-color);
		color: var(--text-dark);
		padding: 0.25rem 0.75rem;
		border-radius: 50px;
		font-size: 0.875rem;
		font-weight: 600;
	}

	.info-text {
		color: var(--text-light);
		font-size: 0.875rem;
	}

	.xml-content {
		flex: 1;
		margin: 0;
		padding: 1.5rem;
		overflow: auto;
		background: #f8f9fa;
		font-family: "Courier New", Courier, monospace;
		font-size: 0.875rem;
		line-height: 1.6;
	}

	.xml-content code {
		color: #333;
	}

	.xml-footer {
		background: var(--bg-light);
		padding: 1rem 1.5rem;
		border-top: 1px solid var(--border-color);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.validation-status {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: #27ae60;
		font-size: 0.875rem;
	}

	.status-icon {
		font-size: 1.25rem;
	}

	.copy-btn {
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
	}

	/* Syntax highlighting */
	:global(.xml-content .tag) {
		color: #e74c3c;
	}

	:global(.xml-content .attr-name) {
		color: #f39c12;
	}

	:global(.xml-content .attr-value) {
		color: #27ae60;
	}

	:global(.xml-content .comment) {
		color: #95a5a6;
		font-style: italic;
	}

	@media (max-width: 768px) {
		.xml-footer {
			flex-direction: column;
			gap: 1rem;
		}

		.copy-btn {
			width: 100%;
		}
	}
</style>
