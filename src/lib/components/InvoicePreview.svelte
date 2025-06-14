<script lang="ts">
	import type { Invoice, InvoiceItem } from "$lib/types/invoice";

	export let data: Invoice;

	// --- Hilfsfunktionen, identisch zum PDF-Generator für Konsistenz ---
	function formatDateDE(dateString?: string): string {
		if (!dateString) return "";
		const [year, month, day] = dateString.split("T")[0].split("-");
		return `${day}.${month}.${year}`;
	}

	function formatCurrency(amount: number): string {
		if (isNaN(amount)) return "0,00 €";
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

	// --- Berechnete Werte ---
	$: items = data.items || [];
	$: isKleinunternehmer = data.metadata.taxType === "KLEINUNTERNEHMER";

	$: totals = (() => {
		const subtotal = items.reduce(
			(sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
			0
		);
		if (isKleinunternehmer) {
			return { subtotal, taxAmount: 0, total: subtotal, taxGroups: {} };
		}
		const taxGroups = items.reduce(
			(groups, item) => {
				const rate = item.taxRate || 19;
				if (!groups[rate]) groups[rate] = { rate, base: 0, tax: 0 };
				const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
				groups[rate].base += itemTotal;
				groups[rate].tax += (itemTotal * rate) / 100;
				return groups;
			},
			{} as { [key: number]: { rate: number; base: number; tax: number } }
		);
		const taxAmount = Object.values(taxGroups).reduce(
			(sum, group) => sum + group.tax,
			0
		);
		const total = subtotal + taxAmount;
		return { subtotal, taxGroups, taxAmount, total };
	})();

	// --- Paginierungslogik ---
	const ITEMS_PER_FIRST_PAGE = 8;
	const ITEMS_PER_SUBSEQUENT_PAGE = 20;
	let paginatedItems: InvoiceItem[][] = [];

	$: {
		paginatedItems = [];
		if (items.length > 0) {
			let currentItemIndex = 0;
			// Erste Seite
			const firstPageCount = Math.min(items.length, ITEMS_PER_FIRST_PAGE);
			paginatedItems.push(items.slice(currentItemIndex, firstPageCount));
			currentItemIndex += firstPageCount;

			// Folgeseiten
			while (currentItemIndex < items.length) {
				const nextPageCount = Math.min(
					items.length - currentItemIndex,
					ITEMS_PER_SUBSEQUENT_PAGE
				);
				paginatedItems.push(
					items.slice(currentItemIndex, currentItemIndex + nextPageCount)
				);
				currentItemIndex += nextPageCount;
			}
		} else {
			paginatedItems = [[]]; // Immer mindestens eine Seite anzeigen
		}
	}
</script>

<div class="invoice-container">
	{#each paginatedItems as pageItems, pageIndex}
		<div class="invoice-page" class:page-break={pageIndex > 0}>
			<!-- ================= 1. HEADER (auf jeder Seite) ================= -->
			<header class="page-header">
				{#if data.sender?.logo}
					<img src={data.sender.logo} alt="Firmenlogo" class="company-logo" />
				{/if}
				<div class="sender-short-info">
					{data.sender?.name} • {data.sender?.street} • {data.sender?.zip}
					{data.sender?.city}
				</div>
			</header>

			<!-- ================= 2. CONTENT ================= -->
			<main class="page-content">
				{#if pageIndex === 0}
					<!-- Nur auf der ersten Seite -->
					<section class="address-and-meta">
						<div class="address-block">
							<div class="sender-small">
								{data.sender?.name} • {data.sender?.street} • {data.sender?.zip}
								{data.sender?.city}
							</div>
							<div class="recipient-main">
								{#if data.recipient?.name}
									<div><strong>{data.recipient.name}</strong></div>
								{/if}
								{#if data.recipient?.street}
									<div>{data.recipient.street}</div>
								{/if}
								{#if data.recipient?.zip || data.recipient?.city}
									<div>{data.recipient.zip} {data.recipient.city}</div>
								{/if}
							</div>
						</div>
						<div class="meta-block">
							<strong>Rechnungs-Nr.:</strong>
							{data.metadata?.invoiceNumber}<br />
							<strong>Datum:</strong>
							{formatDateDE(data.metadata?.date)}<br />
							{#if data.metadata?.deliveryDate}
								<strong>Lieferdatum:</strong>
								{formatDateDE(data.metadata.deliveryDate)}<br />
							{/if}
							{#if data.recipient?.reference}
								<strong>Ihre Referenz:</strong> {data.recipient.reference}<br />
							{/if}
						</div>
					</section>

					<h1 class="document-title">
						{data.metadata?.documentTitle || "Rechnung"}
					</h1>

					{#if data.metadata?.introductionText}
						<p class="introduction-text">{data.metadata.introductionText}</p>
					{/if}
				{:else}
					<!-- Header für Folgeseiten -->
					<div class="continuation-header">
						Seite {pageIndex + 1} zur Rechnung Nr. {data.metadata
							?.invoiceNumber}
					</div>
				{/if}

				<!-- Positionstabelle -->
				<div class="table-container">
					<table class="items-table">
						<thead>
							<tr>
								<th class="pos">Pos.</th>
								<th class="desc">Bezeichnung</th>
								<th class="qty">Menge</th>
								<th class="unit">Einheit</th>
								<th class="price">Einzelpreis</th>
								<th class="total">Gesamt</th>
							</tr>
						</thead>
						<tbody>
							{#each pageItems as item, itemIndex}
								{@const globalIndex =
									(pageIndex === 0 ? 0 : ITEMS_PER_FIRST_PAGE) +
									(pageIndex > 1
										? (pageIndex - 1) * ITEMS_PER_SUBSEQUENT_PAGE
										: 0) +
									itemIndex}
								<tr>
									<td class="pos">{globalIndex + 1}</td>
									<td class="desc">{item.description}</td>
									<td class="qty">{item.quantity}</td>
									<td class="unit">{item.unit}</td>
									<td class="price">{formatCurrency(item.unitPrice)}</td>
									<td class="total"
										>{formatCurrency(item.quantity * item.unitPrice)}</td
									>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<!-- Nur auf der letzten Seite -->
				{#if pageIndex === paginatedItems.length - 1}
					<section class="summary-section">
						<!-- Totals Block -->
						<div class="totals-block">
							{#if isKleinunternehmer}
								<div class="total-line">
									<span>Gesamtbetrag</span>
									<span class="grand-total-value"
										>{formatCurrency(totals.total)}</span
									>
								</div>
								<p class="kleinunternehmer-text">
									Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.
								</p>
							{:else}
								<div class="total-line">
									<span>Zwischensumme</span>
									<span>{formatCurrency(totals.subtotal)}</span>
								</div>
								{#each Object.values(totals.taxGroups) as group}
									<div class="total-line">
										<span>+ {group.rate}% MwSt.</span>
										<span>{formatCurrency(group.tax)}</span>
									</div>
								{/each}
								<div class="total-line grand-total">
									<span>Gesamtbetrag</span>
									<span class="grand-total-value"
										>{formatCurrency(totals.total)}</span
									>
								</div>
							{/if}
						</div>
					</section>

					<section class="closing-section">
						{#if data.metadata?.closingText}
							<p>{data.metadata.closingText}</p>
						{/if}
						<p><strong>{getPaymentTermsText(data.metadata)}</strong></p>
					</section>
				{/if}
			</main>

			<!-- ================= 3. FOOTER (auf jeder Seite) ================= -->
			<footer class="page-footer">
				<div class="footer-column">
					<strong>{data.sender?.name}</strong><br />
					{data.sender?.street}<br />
					{data.sender?.zip}
					{data.sender?.city}<br />
				</div>
				<div class="footer-column">
					<strong>Bankverbindung</strong><br />
					{data.sender?.bankDetails?.bankName}<br />
					IBAN: {data.sender?.bankDetails?.iban}<br />
					BIC: {data.sender?.bankDetails?.bic}<br />
				</div>
				<div class="footer-column">
					<strong>Kontakt & Steuern</strong><br />
					{#if data.sender?.companyInfo?.managingDirector}
						GF: {data.sender.companyInfo.managingDirector}<br />
					{/if}
					{#if data.sender?.companyInfo?.commercialRegister}
						{data.sender.companyInfo.registerCourt}, {data.sender.companyInfo
							.commercialRegister}<br />
					{/if}
					St-Nr: {data.sender?.taxId}<br />
					USt-IdNr: {data.sender?.ustId || "-"}
				</div>
			</footer>
		</div>
	{/each}
</div>

<style>
	:root {
		--font-family: "Helvetica", "Arial", sans-serif;
		--font-size: 9pt;
		--line-height: 1.4;
		--page-width: 210mm;
		--page-height: 297mm;
		--margin-left: 20mm;
		--margin-right: 20mm;
		--margin-top: 15mm;
		--margin-bottom: 10mm;
		--text-color: #333;
		--border-color: #e0e0e0;
	}

	.invoice-container {
		background: #e9e9e9;
		padding: 2rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2rem;
	}

	.invoice-page {
		background: white;
		width: var(--page-width);
		height: var(--page-height);
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
		font-family: var(--font-family);
		font-size: var(--font-size);
		line-height: var(--line-height);
		color: var(--text-color);
		display: flex;
		flex-direction: column;
		position: relative;
	}

	/* --- HEADER & FOOTER --- */
	.page-header {
		padding: var(--margin-top) var(--margin-right) 0 var(--margin-left);
		height: 40mm;
		display: flex;
		justify-content: space-between;
	}
	.company-logo {
		max-height: 20mm;
		max-width: 70mm;
	}
	.sender-short-info {
		font-size: 8pt;
		color: #888;
		text-align: right;
	}
	.page-footer {
		padding: 0 var(--margin-right) var(--margin-bottom) var(--margin-left);
		height: 35mm;
		border-top: 1px solid var(--border-color);
		font-size: 8pt;
		color: #666;
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		align-items: flex-start;
		margin-top: auto;
		padding-top: 5mm;
	}
	.footer-column {
		flex: 1;
	}

	/* --- CONTENT --- */
	.page-content {
		padding: 0 var(--margin-left);
		flex-grow: 1;
		display: flex;
		flex-direction: column;
	}
	.address-and-meta {
		display: flex;
		justify-content: space-between;
		margin-top: 10mm;
		margin-bottom: 15mm;
	}
	.address-block {
		font-size: 10pt;
	}
	.sender-small {
		font-size: 7pt;
		border-bottom: 1px solid var(--border-color);
		padding-bottom: 2mm;
		margin-bottom: 3mm;
	}
	.recipient-main {
		line-height: 1.5;
	}
	.meta-block {
		text-align: right;
		line-height: 1.6;
	}
	.document-title {
		font-size: 18pt;
		font-weight: bold;
		margin-bottom: 8mm;
		border-bottom: 2px solid var(--border-color);
		padding-bottom: 3mm;
	}
	.continuation-header {
		font-size: 10pt;
		color: #888;
		padding-bottom: 5mm;
		border-bottom: 1px solid #e0e0e0;
		margin-bottom: 5mm;
	}

	/* --- TABLE --- */
	.table-container {
		flex-grow: 1;
	}
	.items-table {
		width: 100%;
		border-collapse: collapse;
	}
	.items-table th {
		text-align: left;
		padding: 8px 4px;
		border-bottom: 2px solid #333;
		font-weight: bold;
		font-size: 8pt;
		text-transform: uppercase;
	}
	.items-table td {
		padding: 8px 4px;
		border-bottom: 1px solid var(--border-color);
		vertical-align: top;
	}
	.items-table th.pos,
	.items-table td.pos {
		text-align: center;
		width: 8%;
	}
	.items-table th.desc,
	.items-table td.desc {
		width: 42%;
	}
	.items-table th.qty,
	.items-table td.qty {
		text-align: right;
		width: 10%;
	}
	.items-table th.unit,
	.items-table td.unit {
		text-align: left;
		width: 15%;
	}
	.items-table th.price,
	.items-table td.price {
		text-align: right;
		width: 15%;
	}
	.items-table th.total,
	.items-table td.total {
		text-align: right;
		width: 15%;
	}

	/* --- TOTALS & CLOSING --- */
	.summary-section {
		display: flex;
		justify-content: flex-end;
		margin-top: 5mm;
	}
	.totals-block {
		width: 45%;
	}
	.total-line {
		display: flex;
		justify-content: space-between;
		padding: 4px 0;
	}
	.grand-total {
		font-weight: bold;
		font-size: 11pt;
		border-top: 2px solid #333;
		border-bottom: 2px solid #333;
		margin-top: 5px;
		padding: 5px 0;
	}
	.kleinunternehmer-text {
		font-size: 8pt;
		color: #666;
		margin-top: 5mm;
	}
	.closing-section {
		margin-top: 10mm;
		padding-top: 5mm;
		border-top: 1px solid var(--border-color);
	}

	/* --- PRINT STYLES --- */
	@media print {
		body {
			background: white !important;
		}
		.invoice-container {
			padding: 0;
			background: white;
		}
		.invoice-page {
			box-shadow: none;
			margin: 0;
			page-break-after: always;
		}
		.invoice-page:last-child {
			page-break-after: auto;
		}
	}
</style>
