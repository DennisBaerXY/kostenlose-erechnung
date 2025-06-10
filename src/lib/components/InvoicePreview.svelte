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
</script>

<div class="invoice-paper-wrapper">
	<div class="invoice-paper">
		<header class="page-header">
			{#if data.sender.logo}
				<img src={data.sender.logo} alt="Firmenlogo" class="company-logo" />
			{:else}
				<div class="sender-letterhead">
					{data.sender.name || "Absender"} – {data.sender.street || ""}, {data
						.sender.zip || ""}
					{data.sender.city || ""}
				</div>
			{/if}
		</header>

		<main class="page-content">
			<section class="address-block">
				<div class="recipient-address">
					{#if data.recipient.companyName || data.recipient.name}<div>
							{data.recipient.companyName || data.recipient.name}
						</div>{/if}
					{#if data.recipient.department}<div>
							{data.recipient.department}
						</div>{/if}
					{#if data.recipient.contactPerson}<div>
							{data.recipient.contactPerson}
						</div>{/if}
					<div>{data.recipient.street || "Straße des Empfängers"}</div>
					<div>
						{data.recipient.zip || "PLZ"}
						{data.recipient.city || "Stadt"}
					</div>
				</div>
				<div class="sender-details">
					<strong>{data.sender.name || "Ihre Firma"}</strong><br />
					{data.sender.street || "Ihre Straße"}<br />
					{data.sender.zip || "Ihre PLZ"}
					{data.sender.city || "Ihre Stadt"}<br />
					{#if data.sender.phone}Tel.: {data.sender.phone}<br />{/if}
					{#if data.sender.email}E-Mail: {data.sender.email}{/if}
				</div>
			</section>

			<section class="invoice-meta-block">
				<strong>Rechnungs-Nr.:</strong>
				{data.metadata.invoiceNumber || "RE-00001"}<br />
				{#if data.metadata.customerNumber}<strong>Kunden-Nr.:</strong>
					{data.metadata.customerNumber}<br />{/if}
				{#if data.recipient.ustId}<strong>Kunden-USt-IdNr.:</strong>
					{data.recipient.ustId}<br />{/if}
				<strong>Datum:</strong>
				{formatDate(data.metadata.date)}<br />
				{#if data.metadata.deliveryDate}<strong>Lieferdatum:</strong>
					{formatDate(data.metadata.deliveryDate)}{/if}
			</section>

			<h1 class="document-title">
				{data.metadata.documentTitle || "Rechnung"}
			</h1>

			{#if data.metadata.introductionText}
				<p class="introduction-text">{data.metadata.introductionText}</p>
			{/if}

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
					{#each items as item, index}
						<tr>
							<td class="pos">{index + 1}</td>
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
				</tbody>
			</table>

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

			{#if data.metadata.closingText}
				<div class="closing-text">
					<p>{data.metadata.closingText}</p>
				</div>
			{/if}
		</main>

		<footer class="page-footer">
			<div class="footer-column">
				<strong>Bankverbindung</strong><br />
				{data.sender.bankDetails.bankName || "Name der Bank"}<br />
				IBAN: {data.sender.bankDetails.iban || "-"}<br />
				BIC: {data.sender.bankDetails.bic || "-"}
			</div>
			<div class="footer-column">
				<strong>Firma & Register</strong><br />
				{#if data.sender.companyInfo.managingDirector}
					Geschäftsführer: {data.sender.companyInfo.managingDirector}<br />
				{/if}
				{#if data.sender.companyInfo.commercialRegister}
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
</div>

<style>
	/* Styling von der vorherigen Antwort hier einfügen */
	.invoice-paper-wrapper {
		background: #e5e5e5;
		padding: 2rem;
		min-height: 100%;
		display: flex;
		justify-content: center;
	}
	.invoice-paper {
		background: white;
		width: 210mm;
		min-height: 297mm;
		box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
		font-size: 10pt;
		line-height: 1.4;
		color: #333;
		display: flex;
		flex-direction: column;
	}
	.page-header {
		padding: 10mm 20mm 0;
		border-bottom: 1px solid #eee;
		min-height: 30mm;
	}
	.company-logo {
		max-height: 25mm;
		max-width: 100%;
		object-fit: contain;
	}
	.sender-letterhead {
		font-size: 8pt;
		color: #888;
		text-align: center;
		padding-top: 5mm;
	}
	.page-content {
		padding: 10mm 20mm;
		flex-grow: 1;
	}
	.page-footer {
		padding: 10mm 20mm;
		border-top: 1px solid #ccc;
		font-size: 8pt;
		color: #555;
		display: flex;
		justify-content: space-between;
		gap: 20px;
	}
	.footer-column {
		flex: 1;
		line-height: 1.5;
	}
	.address-block {
		display: flex;
		justify-content: space-between;
		margin-bottom: 15mm;
		min-height: 40mm;
	}
	.recipient-address {
		width: 85mm;
		line-height: 1.5;
	}
	.sender-details {
		text-align: right;
		font-size: 9pt;
	}
	.invoice-meta-block {
		text-align: right;
		margin-bottom: 15mm;
		line-height: 1.6;
	}
	.document-title {
		font-size: 20pt;
		font-weight: bold;
		margin-bottom: 8mm;
	}
	.introduction-text,
	.closing-text {
		margin: 10mm 0;
	}
	.closing-text p {
		white-space: pre-wrap;
	}
	.items-table {
		width: 100%;
		border-collapse: collapse;
		margin-bottom: 10mm;
	}
	.items-table th {
		text-align: left;
		padding: 8px;
		background: #f4f4f4;
		border-bottom: 2px solid #ddd;
		font-weight: bold;
	}
	.items-table td {
		padding: 8px;
		border-bottom: 1px solid #eee;
		vertical-align: top;
	}
	.items-table th.pos,
	.items-table td.pos {
		text-align: center;
		width: 5%;
	}
	.items-table th.description,
	.items-table td.description {
		width: auto;
	}
	.items-table th.quantity,
	.items-table td.quantity,
	.items-table th.price,
	.items-table td.price,
	.items-table th.total,
	.items-table td.total {
		text-align: right;
	}
	.items-table .long-desc {
		font-size: 9pt;
		color: #666;
		white-space: normal;
	}
	.invoice-totals {
		display: flex;
		justify-content: flex-end;
		margin: 10mm 0;
	}
	.totals-content {
		width: 300px;
	}
	.total-line {
		display: flex;
		justify-content: space-between;
		padding: 4px 0;
	}
	.total-line.grand-total {
		border-top: 2px solid #333;
		margin-top: 5px;
		padding-top: 8px;
		font-size: 12pt;
		font-weight: bold;
	}
	@media print {
		thead {
			display: table-header-group;
		}
		tr {
			page-break-inside: avoid;
		}
	}
</style>
