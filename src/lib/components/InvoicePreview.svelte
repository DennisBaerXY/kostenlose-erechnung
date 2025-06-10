<!-- src/lib/components/InvoicePreview.svelte (ENHANCED) -->
<script>
	export let data;

	// Hilfsfunktionen
	function formatDate(dateString) {
		if (!dateString) return "";
		return new Date(dateString + "T00:00:00").toLocaleDateString("de-DE");
	}

	function formatCurrency(amount) {
		if (isNaN(amount)) return "0,00 €";
		return amount.toFixed(2).replace(".", ",") + " €";
	}

	// Berechnete Werte
	$: items = data.items || [];
	$: subtotal = items.reduce(
		(sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
		0
	);

	$: taxGroups = items.reduce((groups, item) => {
		const rate = item.taxRate || 19;
		if (!groups[rate]) {
			groups[rate] = { rate, base: 0, tax: 0 };
		}
		const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
		groups[rate].base += itemTotal;
		groups[rate].tax += (itemTotal * rate) / 100;
		return groups;
	}, {});

	$: taxAmount = Object.values(taxGroups).reduce(
		(sum, group) => sum + group.tax,
		0
	);
	$: total = subtotal + taxAmount;

	// Paginierung für Items
	const ITEMS_PER_PAGE = 15; // Ungefähr 15 Positionen passen auf eine A4-Seite
	$: itemPages = [];
	$: {
		itemPages = [];
		for (let i = 0; i < items.length; i += ITEMS_PER_PAGE) {
			itemPages.push(items.slice(i, i + ITEMS_PER_PAGE));
		}
		if (itemPages.length === 0) {
			itemPages = [[]]; // Mindestens eine leere Seite
		}
	}
</script>

<div class="invoice-container">
	{#each itemPages as pageItems, pageIndex}
		<div class="invoice-page" class:page-break={pageIndex > 0}>
			<!-- Header - auf jeder Seite -->
			<header class="page-header">
				{#if data.sender.logo}
					<div class="logo-section">
						<img src={data.sender.logo} alt="Firmenlogo" class="company-logo" />
					</div>
				{/if}

				{#if pageIndex > 0}
					<div class="page-number">Seite {pageIndex + 1}</div>
				{/if}
			</header>

			<main class="page-content">
				{#if pageIndex === 0}
					<!-- Erste Seite: Vollständige Rechnungsinformationen -->
					<section class="address-block">
						<div class="recipient-address">
							<div class="address-window">
								<div class="sender-small">
									{data.sender.name || "Absender"} · {data.sender.street || ""} ·
									{data.sender.zip || ""}
									{data.sender.city || ""}
								</div>
								<div class="recipient-main">
									{#if data.recipient.companyName || data.recipient.name}
										<div class="company-name">
											{data.recipient.companyName || data.recipient.name}
										</div>
									{/if}
									{#if data.recipient.department}
										<div>{data.recipient.department}</div>
									{/if}
									{#if data.recipient.contactPerson}
										<div>{data.recipient.contactPerson}</div>
									{/if}
									<div>{data.recipient.street || "Straße des Empfängers"}</div>
									<div>
										{data.recipient.zip || "PLZ"}
										{data.recipient.city || "Stadt"}
									</div>
								</div>
							</div>
						</div>

						<div class="sender-details">
							<strong>{data.sender.name || "Ihre Firma"}</strong><br />

							{data.sender.street || "Ihre Straße"}<br />
							{data.sender.zip || "Ihre PLZ"}
							{data.sender.city || "Ihre Stadt"}<br />
							{#if data.sender.phone}Tel.: {data.sender.phone}<br />{/if}
							{#if data.sender.email}{data.sender.email}{/if}
						</div>
					</section>

					<section class="invoice-meta-block">
						<strong>Rechnungs-Nr.:</strong>
						{data.metadata.invoiceNumber || "RE-00001"}<br />
						<strong>Datum:</strong>
						{formatDate(data.metadata.date)}<br />
						{#if data.metadata.deliveryDate}
							<strong>Lieferdatum:</strong>
							{formatDate(data.metadata.deliveryDate)} <br />
						{/if}
						{#if data.recipient.customerNumber}
							<strong>Kunden-Nr.:</strong> {data.recipient.customerNumber}<br />
						{/if}
						{#if data.recipient.reference}
							<strong>Referenz:</strong> {data.recipient.reference}<br />
						{/if}
					</section>

					<h1 class="document-title">
						{data.metadata.documentTitle || "Rechnung"}
					</h1>

					{#if data.metadata.introductionText}
						<p class="introduction-text">{data.metadata.introductionText}</p>
					{/if}
				{:else}
					<!-- Folgeseiten: Vereinfachter Header -->
					<div class="continuation-header">
						<h2>
							Rechnung {data.metadata.invoiceNumber || "RE-00001"} (Fortsetzung)
						</h2>
					</div>
				{/if}

				<!-- Tabelle für aktuelle Seite -->
				<div class="table-container">
					<table class="items-table">
						<thead>
							<tr>
								<th class="pos">Pos.</th>
								<th class="description">Bezeichnung</th>
								<th class="quantity">Menge</th>
								<th class="unit">Einheit</th>
								<th class="price">Einzelpreis</th>
								<th class="total">Gesamtpreis</th>
							</tr>
						</thead>
						<tbody>
							{#each pageItems as item, index}
								<tr>
									<td class="pos">{pageIndex * ITEMS_PER_PAGE + index + 1}</td>
									<td class="description">
										<strong>{item.description || "Artikelbeschreibung"}</strong>
										{#if item.articleNumber}<br /><small
												>Art.-Nr.: {item.articleNumber}</small
											>{/if}
										{#if item.longDescription}
											<div class="long-desc">{item.longDescription}</div>
										{/if}
									</td>
									<td class="quantity">{item.quantity}</td>
									<td class="unit">{item.unit}</td>
									<td class="price">{formatCurrency(item.unitPrice)}</td>
									<td class="total"
										>{formatCurrency(item.quantity * item.unitPrice)}</td
									>
								</tr>
							{/each}

							<!-- Fülle leere Zeilen für konsistente Seitenhöhe auf der letzten Seite -->
						</tbody>
					</table>
				</div>

				{#if pageIndex === itemPages.length - 1}
					<!-- Summen nur auf der letzten Seite -->
					<div class="invoice-totals">
						<div class="totals-content">
							<div class="total-line">
								<span>Nettosumme</span>
								<span>{formatCurrency(subtotal)}</span>
							</div>
							{#each Object.values(taxGroups) as group}
								<div class="total-line">
									<span>zzgl. {group.rate}% MwSt.</span>
									<span>{formatCurrency(group.tax)}</span>
								</div>
							{/each}
							<div class="total-line grand-total">
								<span>Rechnungsbetrag</span>
								<span>{formatCurrency(total)}</span>
							</div>
						</div>
					</div>

					<div class="closing-text">
						<p>
							{data.metadata.customPaymentTerms ||
								"Zahlbar innerhalb 30 Tagen ohne Abzug."}
						</p>
					</div>

					{#if data.metadata.closingText}
						<div class="closing-text">
							<p>{data.metadata.closingText}</p>
						</div>
					{/if}
				{/if}
			</main>

			<!-- Footer - auf jeder Seite -->
			<footer class="page-footer">
				<div class="footer-column">
					<strong>Bankverbindung</strong><br />
					{data.sender.bankDetails?.bankName || "Name der Bank"}<br />
					IBAN: {data.sender.bankDetails?.iban || "-"}<br />
					BIC: {data.sender.bankDetails?.bic || "-"}
				</div>
				<div class="footer-column">
					<strong>Firma & Register</strong><br />
					{#if data.sender.companyInfo?.managingDirector}
						Geschäftsführer: {data.sender.companyInfo.managingDirector}<br />
					{/if}
					{#if data.sender.companyInfo?.commercialRegister}
						{data.sender.companyInfo.commercialRegister}<br />
						Registergericht: {data.sender.companyInfo.registerCourt}
					{/if}
				</div>
				<div class="footer-column">
					<strong>Kontakt & Steuern</strong><br />
					St-Nr.: {data.sender.taxId || "-"}<br />
					USt-IdNr.: {data.sender.ustId || "-"}
				</div>
			</footer>
		</div>
	{/each}
</div>

<style>
	/* A4-Format Container */
	.invoice-container {
		background: #f5f5f5;
		padding: 20px;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 20px;
	}

	/* Einzelne A4-Seite */
	.invoice-page {
		background: white;
		width: 210mm;
		min-height: 297mm;
		max-height: 297mm;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		font-size: 10pt;
		line-height: 1.4;
		color: #333;
		display: flex;
		flex-direction: column;
		position: relative;
		overflow: hidden;
	}

	.page-break {
		margin-top: 20px;
	}

	/* Header-Bereich */
	.page-header {
		padding: 15mm 20mm 5mm;

		min-height: 25mm;
		max-height: 25mm;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}

	.logo-section {
		flex: 1;
	}

	.company-logo {
		max-height: 20mm;
		max-width: 80mm;
		object-fit: contain;
	}

	.sender-letterhead {
		font-size: 8pt;
		color: #888;
		text-align: center;
		padding-top: 5mm;
	}

	.page-number {
		font-size: 9pt;
		color: #666;
		font-weight: 500;
	}

	/* Content-Bereich */
	.page-content {
		padding: 5mm 20mm;
		flex-grow: 1;
		display: flex;
		flex-direction: column;
	}

	/* Adressen-Block (nur erste Seite) */
	.address-block {
		display: flex;
		justify-content: space-between;
		margin-bottom: 10mm;
		min-height: 35mm;
	}

	.recipient-address {
		width: 85mm;
	}

	.address-window {
		padding: 5mm;
		min-height: 25mm;
	}

	.sender-small {
		font-size: 7pt;
		color: #666;
		border-bottom: 1px solid #ddd;
		padding-bottom: 2mm;
		margin-bottom: 3mm;
	}

	.recipient-main {
		line-height: 1.5;
	}

	.company-name {
		font-weight: bold;
		font-size: 11pt;
	}

	.sender-details {
		text-align: right;
		font-size: 9pt;
		width: 60mm;
	}

	/* Meta-Informationen */
	.invoice-meta-block {
		width: 100%;

		text-align: right;
		margin-bottom: 10mm;
		line-height: 1.6;
	}

	.continuation-header {
		margin-bottom: 5mm;
		padding-bottom: 3mm;
		border-bottom: 1px solid #ddd;
	}

	.continuation-header h2 {
		font-size: 14pt;
		margin: 0;
		color: #666;
	}

	/* Dokumenttitel */
	.document-title {
		font-size: 18pt;
		font-weight: bold;
		margin-bottom: 5mm;
	}

	.introduction-text {
		margin-bottom: 8mm;
		color: #666;
	}

	/* Tabellen-Container */
	.table-container {
		flex-grow: 1;
		margin-bottom: 5mm;
	}

	/* Tabellen-Styling */
	.items-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 9pt;
	}

	.items-table th {
		text-align: left;
		padding: 6px 4px;
		background: #f8f8f8;
		border-bottom: 2px solid #ddd;
		font-weight: bold;
		font-size: 8pt;
	}

	.items-table td {
		padding: 6px 4px;
		border-bottom: 1px solid #eee;
		vertical-align: top;
	}

	.items-table th.pos,
	.items-table td.pos {
		text-align: center;
		width: 8mm;
	}

	.items-table th.description,
	.items-table td.description {
		width: auto;
		min-width: 60mm;
	}

	.items-table th.quantity,
	.items-table td.quantity,
	.items-table th.unit,
	.items-table td.unit {
		text-align: center;
		width: 15mm;
	}

	.items-table th.price,
	.items-table td.price,
	.items-table th.total,
	.items-table td.total {
		text-align: right;
		width: 20mm;
	}

	.empty-row td {
		height: 8mm;
		border-bottom: none;
	}

	.long-desc {
		font-size: 8pt;
		color: #666;
		margin-top: 2mm;
		white-space: pre-wrap;
	}

	/* Summen-Bereich */
	.invoice-totals {
		display: flex;
		justify-content: flex-end;
		margin: 5mm 0;
	}

	.totals-content {
		width: 60mm;
		border-top: 1px solid #ddd;
		padding-top: 3mm;
	}

	.total-line {
		display: flex;
		justify-content: space-between;
		padding: 2mm 0;
		border-bottom: 1px solid #eee;
	}

	.total-line.grand-total {
		border-top: 2px solid #333;
		border-bottom: 2px solid #333;
		margin-top: 3mm;
		padding-top: 3mm;
		font-size: 11pt;
		font-weight: bold;
	}

	.closing-text {
		margin-top: 5mm;
		color: #666;
	}

	.closing-text p {
		white-space: pre-wrap;
		margin: 0;
	}

	/* Footer */
	.page-footer {
		padding: 5mm 20mm 10mm;
		border-top: 1px solid #ccc;
		font-size: 7pt;
		color: #555;
		display: flex;
		justify-content: space-between;
		gap: 15mm;
		margin-top: auto;
	}

	.footer-column {
		flex: 1;
		line-height: 1.5;
	}

	/* Print-Styles */
	@media print {
		.invoice-container {
			background: white;
			padding: 0;
		}

		.invoice-page {
			box-shadow: none;
			margin: 0;
			page-break-after: always;
			width: 100%;
			min-height: 100vh;
			max-height: none;
		}

		.page-break {
			margin-top: 0;
		}

		.invoice-page:last-child {
			page-break-after: auto;
		}

		/* Vermeide Seitenumbrüche in kritischen Bereichen */
		.address-block,
		.invoice-meta-block,
		.document-title,
		.invoice-totals {
			page-break-inside: avoid;
		}

		.items-table {
			page-break-inside: auto;
		}

		.items-table thead {
			display: table-header-group;
		}

		.items-table tr {
			page-break-inside: avoid;
		}
	}

	/* Responsive Anpassungen */
	@media (max-width: 768px) {
		.invoice-container {
			padding: 10px;
		}

		.invoice-page {
			width: 100%;
			min-height: auto;
			max-height: none;
		}

		.page-header {
			padding: 10mm 15mm 5mm;
		}

		.page-content {
			padding: 5mm 15mm;
		}

		.page-footer {
			padding: 5mm 15mm 10mm;
			flex-direction: column;
			gap: 5mm;
		}

		.address-block {
			flex-direction: column;
			gap: 5mm;
		}

		.sender-details {
			text-align: left;
			width: auto;
		}

		.items-table {
			font-size: 8pt;
		}

		.items-table th,
		.items-table td {
			padding: 4px 2px;
		}
	}

	/* Hochauflösende Displays */
	@media (min-resolution: 192dpi) {
		.company-logo {
			image-rendering: crisp-edges;
		}
	}
</style>
