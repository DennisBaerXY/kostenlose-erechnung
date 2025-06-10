<!-- src/routes/dashboard/+page.svelte -->
<script>
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";

	import { get } from "svelte/store";

	let activeTab = "overview";
	let stats = {
		invoicesCount: 0,
		customersCount: 0,
		templatesCount: 0,
		lastInvoiceDate: null
	};
</script>

<svelte:head>
	<title>Premium Dashboard | kostenlose-erechnung.de</title>
</svelte:head>

<div class="dashboard-container">
	<div class="dashboard-header">
		<div class="welcome">
			<h1>Willkommen zurück</h1>
			<p>Verwalten Sie Ihre E-Rechnungen, Kunden und Vorlagen</p>
		</div>

		<div class="actions">
			<a href="/erstellen" class="btn btn-primary"> + Neue Rechnung </a>
		</div>
	</div>

	<div class="stats-grid">
		<div class="stat-card">
			<div class="stat-icon">📄</div>
			<div class="stat-content">
				<div class="stat-value">{stats.invoicesCount}</div>
				<div class="stat-label">Rechnungen</div>
			</div>
		</div>

		<div class="stat-card">
			<div class="stat-icon">👥</div>
			<div class="stat-content">
				<div class="stat-value">{stats.customersCount}</div>
				<div class="stat-label">Kunden</div>
			</div>
		</div>

		<div class="stat-card">
			<div class="stat-icon">📋</div>
			<div class="stat-content">
				<div class="stat-value">{stats.templatesCount}</div>
				<div class="stat-label">Vorlagen</div>
			</div>
		</div>

		<div class="stat-card">
			<div class="stat-icon">📅</div>
			<div class="stat-content">
				<div class="stat-value">{stats.lastInvoiceDate}</div>
				<div class="stat-label">Letzte Rechnung</div>
			</div>
		</div>
	</div>

	<div class="dashboard-content">
		<nav class="tabs">
			<button
				class="tab"
				class:active={activeTab === "overview"}
				on:click={() => (activeTab = "overview")}
			>
				Übersicht
			</button>
			<button
				class="tab"
				class:active={activeTab === "invoices"}
				on:click={() => (activeTab = "invoices")}
			>
				Rechnungen
			</button>
			<button
				class="tab"
				class:active={activeTab === "customers"}
				on:click={() => (activeTab = "customers")}
			>
				Kunden
			</button>
			<button
				class="tab"
				class:active={activeTab === "templates"}
				on:click={() => (activeTab = "templates")}
			>
				Vorlagen
			</button>
		</nav>

		<div class="tab-content">
			{#if activeTab === "overview"}
				<div class="overview-section">
					<h2>Schnellzugriff</h2>

					<div class="quick-actions">
						<a href="/erstellen" class="quick-action">
							<span class="icon">📄</span>
							<span>Neue Rechnung erstellen</span>
						</a>

						<a href="/dashboard/customers/new" class="quick-action">
							<span class="icon">👤</span>
							<span>Neuen Kunden anlegen</span>
						</a>

						<a href="/dashboard/templates/new" class="quick-action">
							<span class="icon">📋</span>
							<span>Neue Vorlage erstellen</span>
						</a>

						<a href="/auslesen" class="quick-action">
							<span class="icon">🔍</span>
							<span>Rechnung prüfen</span>
						</a>
					</div>

					<div class="empty-state">
						<p>Sie haben noch keine Rechnungen erstellt.</p>
						<a href="/erstellen" class="btn btn-primary"
							>Erste Rechnung erstellen</a
						>
					</div>
				</div>
			{:else if activeTab === "invoices"}
				<div class="invoices-section">
					<div class="section-header">
						<h2>Alle Rechnungen</h2>
						<div class="filters">
							<input
								type="search"
								placeholder="Suchen..."
								class="search-input"
							/>
							<select class="filter-select">
								<option>Alle</option>
								<option>Diesen Monat</option>
								<option>Letzten Monat</option>
								<option>Dieses Jahr</option>
							</select>
						</div>
					</div>

					<div class="empty-state">
						<p>Keine Rechnungen vorhanden.</p>
						<a href="/erstellen" class="btn btn-primary"
							>Neue Rechnung erstellen</a
						>
					</div>
				</div>
			{:else if activeTab === "customers"}
				<div class="customers-section">
					<div class="section-header">
						<h2>Kundenverwaltung</h2>
						<a href="/dashboard/customers/new" class="btn btn-primary">
							+ Neuer Kunde
						</a>
					</div>

					<div class="empty-state">
						<p>Keine Kunden vorhanden.</p>
						<a href="/dashboard/customers/new" class="btn btn-primary"
							>Ersten Kunden anlegen</a
						>
					</div>
				</div>
			{:else if activeTab === "templates"}
				<div class="templates-section">
					<div class="section-header">
						<h2>Rechnungsvorlagen</h2>
						<a href="/dashboard/templates/new" class="btn btn-primary">
							+ Neue Vorlage
						</a>
					</div>

					<div class="empty-state">
						<p>Keine Vorlagen vorhanden.</p>
						<a href="/dashboard/templates/new" class="btn btn-primary"
							>Erste Vorlage erstellen</a
						>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.dashboard-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	.dashboard-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.welcome h1 {
		margin-bottom: 0.5rem;
	}

	.welcome p {
		color: var(--text-light);
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
		margin-bottom: 3rem;
	}

	.stat-card {
		background: var(--bg-white);
		padding: 1.5rem;
		border-radius: var(--radius-lg);
		border: 1px solid var(--border-color);
		display: flex;
		align-items: center;
		gap: 1.5rem;
		transition: all 0.3s ease;
	}

	.stat-card:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
	}

	.stat-icon {
		font-size: 2.5rem;
		width: 60px;
		height: 60px;
		background: var(--bg-light);
		border-radius: var(--radius);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.stat-value {
		font-size: 2rem;
		font-weight: 700;
		color: var(--text-dark);
	}

	.stat-label {
		color: var(--text-light);
		font-size: 0.875rem;
	}

	.tabs {
		display: flex;
		gap: 1rem;
		border-bottom: 2px solid var(--border-color);
		margin-bottom: 2rem;
	}

	.tab {
		background: none;
		border: none;
		padding: 0.75rem 1.5rem;
		font-weight: 500;
		color: var(--text-light);
		cursor: pointer;
		transition: all 0.3s ease;
		position: relative;
	}

	.tab:hover {
		color: var(--text-dark);
	}

	.tab.active {
		color: var(--primary-dark);
	}

	.tab.active::after {
		content: "";
		position: absolute;
		bottom: -2px;
		left: 0;
		right: 0;
		height: 2px;
		background: var(--primary-color);
	}

	.tab-content {
		min-height: 400px;
	}

	.quick-actions {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 3rem;
	}

	.quick-action {
		background: var(--bg-light);
		padding: 1.5rem;
		border-radius: var(--radius);
		text-align: center;
		transition: all 0.3s ease;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		color: var(--text-dark);
		text-decoration: none;
	}

	.quick-action:hover {
		background: var(--primary-light);
		transform: translateY(-2px);
	}

	.quick-action .icon {
		font-size: 2rem;
	}

	.empty-state {
		text-align: center;
		padding: 3rem;
		color: var(--text-light);
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.filters {
		display: flex;
		gap: 1rem;
	}

	.search-input {
		padding: 0.5rem 1rem;
		border: 1px solid var(--border-color);
		border-radius: var(--radius);
		min-width: 250px;
	}

	.filter-select {
		padding: 0.5rem 1rem;
		border: 1px solid var(--border-color);
		border-radius: var(--radius);
		background: var(--bg-white);
	}

	@media (max-width: 768px) {
		.dashboard-header {
			flex-direction: column;
			gap: 1rem;
			align-items: flex-start;
		}

		.stats-grid {
			grid-template-columns: 1fr;
		}

		.tabs {
			overflow-x: auto;
			-webkit-overflow-scrolling: touch;
		}

		.filters {
			flex-direction: column;
		}

		.search-input {
			min-width: auto;
			width: 100%;
		}
	}
</style>
