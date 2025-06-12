<script>
	export let totalRevenue = 0;
	export let totalInvoices = 0;
	export let averageInvoiceValue = 0;

	const formatCurrency = (value) => {
		return new Intl.NumberFormat("de-DE", {
			style: "currency",
			currency: "EUR"
		}).format(value);
	};
</script>

<div class="stats-grid">
	<div class="stat-card">
		<h3 class="stat-card__title">Gesamtumsatz</h3>
		<p class="stat-card__value">{formatCurrency(totalRevenue)}</p>
	</div>
	<div class="stat-card">
		<h3 class="stat-card__title">Anzahl Rechnungen</h3>
		<p class="stat-card__value">{totalInvoices}</p>
	</div>
	<div class="stat-card">
		<h3 class="stat-card__title">Ø-Rechnungsbetrag</h3>
		<p class="stat-card__value">{formatCurrency(averageInvoiceValue)}</p>
	</div>
</div>

<style>
	/* Stellt sicher, dass die Variablen aus der :root-Definition verfügbar sind. */

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
	}

	.stat-card {
		background-color: var(--white, #ffffff);
		padding: 1.5rem;
		border-radius: 8px;
		border: 1px solid var(--secondary-color, #f0f0f0);
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
		transition:
			transform 0.2s ease-in-out,
			box-shadow 0.2s ease-in-out;
	}

	.stat-card:hover {
		transform: translateY(-5px);
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.07);
	}

	.stat-card__title {
		font-size: 1rem;
		color: #6c757d; /* Ein neutrales Grau */
		margin: 0 0 0.5rem 0;
		font-weight: 500;
	}

	.stat-card__value {
		font-size: 2.25rem;
		font-weight: 600;
		color: var(--text-color, #333);
		margin: 0;
	}
</style>
