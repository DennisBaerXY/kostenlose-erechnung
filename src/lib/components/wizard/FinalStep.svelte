<!-- src/lib/components/wizard/FinalStep.svelte -->
<script>
	import { createEventDispatcher } from "svelte";

	export let invoiceData;
	export let selectedFormat = "CII";
	export let isDownloading = false;
	export let isFormValid = true;
	export let userTier = "free";
	export let monthlyInvoices = 0;

	const dispatch = createEventDispatcher();

	const LIMITS = {
		free: { invoicesPerMonth: 5 }
	};

	// Calculate totals for summary
	$: items = invoiceData.items || [];
	$: total = items.reduce((sum, item) => {
		const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
		const taxAmount = (itemTotal * (item.taxRate || 0)) / 100;
		return sum + itemTotal + taxAmount;
	}, 0);

	function formatDate(dateString) {
		if (!dateString) return "";
		return new Date(dateString + "T00:00:00").toLocaleDateString("de-DE");
	}

	function handleDownload() {
		dispatch("download", { format: selectedFormat });
	}

	function setSelectedFormat(format) {
		selectedFormat = format;
	}
</script>

<div class="form-section">
	<h2>Abschluss</h2>
	<p class="form-description">
		Überprüfen Sie Ihre Eingaben und laden Sie die Rechnung herunter
	</p>

	<div class="summary">
		<div class="summary-section">
			<h3>Rechnungsübersicht</h3>
			<div class="summary-grid">
				<div class="summary-item">
					<span class="label">Rechnungsnummer:</span>
					<span class="value">{invoiceData.metadata.invoiceNumber}</span>
				</div>
				<div class="summary-item">
					<span class="label">Datum:</span>
					<span class="value">{formatDate(invoiceData.metadata.date)}</span>
				</div>
				<div class="summary-item">
					<span class="label">Empfänger:</span>
					<span class="value">{invoiceData.recipient.name}</span>
				</div>
				<div class="summary-item">
					<span class="label">Gesamtbetrag:</span>
					<span class="value highlight">{total.toFixed(2)} €</span>
				</div>
			</div>
		</div>

		<div class="download-section">
			<h3>Format wählen</h3>
			<div class="format-download-buttons">
				<label class="format-option">
					<input
						type="radio"
						name="format"
						value="CII"
						bind:group={selectedFormat}
					/>
					<div class="format-content">
						<span class="format-name">XRechnung (CII)</span>
						<span class="format-desc"
							>Standard für öffentliche Auftraggeber</span
						>
					</div>
				</label>

				<label class="format-option">
					<input
						type="radio"
						name="format"
						value="UBL"
						bind:group={selectedFormat}
					/>
					<div class="format-content">
						<span class="format-name">XRechnung (UBL)</span>
						<span class="format-desc">PEPPOL-kompatibel</span>
					</div>
				</label>
			</div>

			<button
				class="btn btn-primary btn-download"
				on:click={handleDownload}
				disabled={isDownloading || !isFormValid}
			>
				{#if isDownloading}
					<span class="spinner"></span>
					Erstelle E-Rechnung...
				{:else}
					📥 E-Rechnung herunterladen
				{/if}
			</button>

			{#if userTier === "free"}
				<div class="download-limit-info">
					<small>
						💡 Noch {LIMITS.free.invoicesPerMonth - monthlyInvoices} kostenlose Downloads
						verfügbar
					</small>
				</div>
			{/if}
		</div>
	</div>
</div>
