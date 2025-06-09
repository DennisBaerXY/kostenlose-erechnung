<script>
	export let data;

	$: subtotal = data.items.reduce(
		(sum, item) => sum + item.quantity * item.unitPrice,
		0
	);

	$: taxGroups = data.items.reduce((groups, item) => {
		const rate = item.taxRate;
		if (!groups[rate]) {
			groups[rate] = { rate, base: 0, tax: 0 };
		}
		const itemTotal = item.quantity * item.unitPrice;
		groups[rate].base += itemTotal;
		groups[rate].tax += (itemTotal * rate) / 100;
		return groups;
	}, {});

	$: taxAmount = Object.values(taxGroups).reduce(
		(sum, group) => sum + group.tax,
		0
	);
	$: total = subtotal + taxAmount;

	function formatDate(dateString) {
		if (!dateString) return "";
		return new Date(dateString).toLocaleDateString("de-DE");
	}

	function formatCurrency(amount) {
		return amount.toFixed(2).replace(".", ",") + " €";
	}
</script>

<div class="invoice-preview">
	<div class="invoice-paper">
		<!-- Header -->
		{#if data.sender.logo}
			<div>
				<img
					src={data.sender.logo || "/default-logo.png"}
					alt="Logo"
					class="company-logo"
				/>
			</div>
		{/if}
		<div class="invoice-header">
			<div class="sender-info">
				<!-- <div
						style="display: flex; align-items: center; gap: 10px; justify-content: center;"
					>
						<div class="company-name" style="margin-bottom: 0;">
							{data.sender.name || "Ihre Firma"}
						</div>
						<img
							src={data.sender.logo || "/default-logo.png"}
							alt="Logo"
							class="company-logo"
						/>
					</div> -->

				<div class="company-name">{data.sender.name || "Ihre Firma"}</div>

				<div class="address-line">{data.sender.contactName}</div>
				<div class="address-line">{data.sender.street || "Straße"}</div>
				<div class="address-line">
					{data.sender.zip || "PLZ"}
					{data.sender.city || "Stadt"}
				</div>
				{#if data.sender.phone}
					<div class="contact-line">Tel: {data.sender.phone}</div>
				{/if}
				{#if data.sender.email}
					<div class="contact-line">E-Mail: {data.sender.email}</div>
				{/if}
			</div>

			<div class="invoice-title">
				<h1>Rechnung</h1>
				<div class="invoice-number">
					Nr. {data.metadata.invoiceNumber || "2025-001"}
				</div>
			</div>
		</div>

		<!-- Recipient -->
		<div class="recipient-section">
			<div class="recipient-label">An</div>
			<div class="recipient-info">
				<div class="recipient-name">{data.recipient.name || "Empfänger"}</div>
				<div>{data.recipient.street || "Straße"}</div>
				<div>
					{data.recipient.zip || "PLZ"}
					{data.recipient.city || "Stadt"}
				</div>
			</div>
		</div>

		<!-- Invoice Meta -->
		<div class="invoice-meta">
			<div class="meta-item">
				<span class="meta-label">Rechnungsdatum:</span>
				<span class="meta-value">{formatDate(data.metadata.date)}</span>
			</div>
			{#if data.metadata.deliveryDate}
				<div class="meta-item">
					<span class="meta-label">Lieferdatum:</span>
					<span class="meta-value"
						>{formatDate(data.metadata.deliveryDate)}</span
					>
				</div>
			{/if}
			{#if data.metadata.dueDate}
				<div class="meta-item">
					<span class="meta-label">Zahlungsziel:</span>
					<span class="meta-value">{formatDate(data.metadata.dueDate)}</span>
				</div>
			{/if}
			{#if data.recipient.reference}
				<div class="meta-item">
					<span class="meta-label">Ihre Referenz:</span>
					<span class="meta-value">{data.recipient.reference}</span>
				</div>
			{/if}
		</div>

		<!-- Items Table -->
		<table class="items-table">
			<thead>
				<tr>
					<th class="pos">Pos.</th>
					<th class="description">Bezeichnung</th>
					<th class="quantity">Menge</th>
					<th class="unit">Einheit</th>
					<th class="price">Einzelpreis</th>
					<th class="tax">MwSt.</th>
					<th class="total">Gesamt</th>
				</tr>
			</thead>
			<tbody>
				{#each data.items as item, index}
					<tr>
						<td class="pos">{index + 1}</td>
						<td class="description"
							>{item.description || "Position " + (index + 1)}</td
						>
						<td class="quantity">{item.quantity}</td>
						<td class="unit">{item.unit}</td>
						<td class="price" style="text-align: right;"
							>{formatCurrency(item.unitPrice)}</td
						>
						<td class="tax">{item.taxRate}%</td>
						<td class="total"
							>{formatCurrency(item.quantity * item.unitPrice)}</td
						>
					</tr>
				{/each}
			</tbody>
		</table>

		<!-- Totals -->
		<div class="invoice-totals">
			<div class="totals-content">
				<div class="total-line">
					<span>Zwischensumme netto:</span>
					<span>{formatCurrency(subtotal)}</span>
				</div>

				{#each Object.values(taxGroups) as group}
					<div class="total-line">
						<span>MwSt. {group.rate}% auf {formatCurrency(group.base)}:</span>
						<span>{formatCurrency(group.tax)}</span>
					</div>
				{/each}

				<div class="total-line grand-total">
					<span>Gesamtbetrag:</span>
					<span>{formatCurrency(total)}</span>
				</div>
			</div>
		</div>

		<!-- Payment Terms -->
		{#if data.metadata.paymentTerms}
			<div class="payment-terms">
				<p>
					{#if data.metadata.paymentTerms === "net14"}
						Zahlbar innerhalb von 14 Tagen ohne Abzug.
					{:else if data.metadata.paymentTerms === "net30"}
						Zahlbar innerhalb von 30 Tagen ohne Abzug.
					{:else if data.metadata.paymentTerms === "immediate"}
						Zahlbar sofort ohne Abzug.
					{:else if data.metadata.customPaymentTerms}
						{data.metadata.customPaymentTerms}
					{/if}
				</p>
			</div>
		{/if}

		<div class="invoice-footer">
			{#if data.sender.taxId}
				<div>Steuernummer: {data.sender.taxId}</div>
			{/if}
			{#if data.sender.ustId}
				<div>USt-IdNr.: {data.sender.ustId}</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.invoice-preview {
		background: #e5e5e5;
		padding: 2rem;
		min-height: 100%;
		display: flex;
		justify-content: center;
	}

	.invoice-paper {
		background: white;
		width: 100%;
		max-width: 210mm;
		min-height: 297mm;
		max-height: 297mm;
		padding: 30mm 20mm;
		box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
		font-size: 10pt;
		line-height: 1.5;
		color: #333;
	}

	.invoice-header {
		display: flex;
		justify-content: space-between;
		margin-bottom: 40px;
	}

	.sender-info {
		font-size: 9pt;
	}

	.company-name {
		font-weight: 700;
		font-size: 14pt;
		margin-bottom: 8px;
	}

	.address-line,
	.contact-line {
		margin-bottom: 4px;
	}

	.invoice-title {
		text-align: right;
	}

	.invoice-title h1 {
		font-size: 24pt;
		margin: 0 0 8px 0;
		color: #222;
	}

	.invoice-number {
		font-size: 11pt;
		color: #666;
	}

	.recipient-section {
		margin-bottom: 30px;
	}

	.recipient-label {
		font-size: 8pt;
		color: #666;
		margin-bottom: 8px;
	}

	.recipient-info {
		padding-left: 10mm;
	}

	.recipient-name {
		font-weight: 600;
		margin-bottom: 4px;
	}

	.invoice-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 20px;
		margin-bottom: 30px;
		padding-bottom: 20px;
		border-bottom: 1px solid #ddd;
	}

	.meta-item {
		display: flex;
		gap: 8px;
	}

	.meta-label {
		font-weight: 600;
		color: #666;
	}

	.items-table {
		width: 100%;
		border-collapse: collapse;
		margin-bottom: 30px;
	}

	.items-table th {
		background: #f8f8f8;
		padding: 10px;
		text-align: left;
		font-weight: 600;
		border-bottom: 2px solid #ddd;
		white-space: nowrap;
	}

	.items-table td {
		padding: 10px;
		border-bottom: 1px solid #eee;
		text-align: left;
		white-space: nowrap;
	}

	/* Let the description take up the available space */
	.items-table th.description,
	.items-table td.description {
		width: 50%;
	}

	.invoice-totals {
		display: flex;
		justify-content: flex-end;
		margin-bottom: 40px;
	}

	.items-table th.pos,
	.items-table td.pos {
		text-align: center;
	}
	.items-table th.quantity,
	.items-table td.quantity {
		text-align: right;
	}
	.items-table th.price,
	.items-table td.price {
		text-align: right;
	}
	.items-table th.tax,
	.items-table td.tax {
		text-align: right;
	}
	.items-table th.total,
	.items-table td.total {
		text-align: right;
	}

	.totals-content {
		width: 300px;
	}

	.total-line {
		display: flex;
		justify-content: space-between;
		padding: 8px 0;
	}

	.total-line.grand-total {
		border-top: 2px solid #333;
		margin-top: 8px;
		padding-top: 12px;
		font-size: 12pt;
		font-weight: 700;
	}

	.payment-terms {
		margin-bottom: 40px;
		padding: 15px;
		background: #f8f8f8;
		border-radius: 4px;
	}

	.payment-terms p {
		margin: 0;
	}

	.invoice-footer {
		bottom: 20mm;
		left: 20mm;
		right: 20mm;
		padding-top: 20px;
		border-top: 1px solid #ddd;
		font-size: 8pt;
		color: #666;
		display: flex;
		gap: 20px;
	}

	@media (max-width: 768px) {
		.invoice-preview {
			padding: 1rem;
		}

		.invoice-paper {
			padding: 20mm 15mm;
			min-height: auto;
		}

		.invoice-footer {
			position: relative;
			bottom: auto;
			left: auto;
			right: auto;
			margin-top: 40px;
		}
	}
</style>
