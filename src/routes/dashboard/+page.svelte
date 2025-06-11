<!-- src/routes/dashboard/+page.svelte -->
<script>
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { browser } from "$app/environment";
	import { currentUser, isAuthenticated } from "$lib/stores/auth.js";
	import {
		dashboardStats,
		contacts,
		recentContacts,
		dashboardLoading,
		dashboardError,
		contactsLoading,
		contactsError,
		dashboardActions
	} from "$lib/stores/dashboard.js";

	let activeTab = "overview";
	let showCreateContactModal = false;
	let newContact = {
		name: "",
		email: "",
		street: "",
		zip: "",
		city: "",
		phone: ""
	};

	onMount(async () => {
		// Check authentication and redirect if needed (only in browser)
		if (browser && !$isAuthenticated) {
			goto("/login");
			return;
		}

		if ($isAuthenticated) {
			await dashboardActions.initialize();
		}
	});

	function formatDate(dateString) {
		if (!dateString) return "Noch keine";
		return new Date(dateString).toLocaleDateString("de-DE");
	}

	function formatCurrency(amount) {
		return new Intl.NumberFormat("de-DE", {
			style: "currency",
			currency: "EUR"
		}).format(amount || 0);
	}

	function handleCloseModal(event) {
		if (event.key === "Escape") {
			showCreateContactModal = false;
		}
	}

	async function handleCreateContact() {
		const result = await dashboardActions.createContact(newContact);
		if (result.success) {
			showCreateContactModal = false;
			newContact = {
				name: "",
				email: "",
				street: "",
				zip: "",
				city: "",
				phone: ""
			};
		}
	}

	async function handleDeleteContact(contactId) {
		if (confirm("Möchten Sie diesen Kontakt wirklich löschen?")) {
			await dashboardActions.deleteContact(contactId);
		}
	}
</script>

<svelte:head>
	<title>Dashboard | kostenlose-erechnung.de</title>
</svelte:head>

<div class="dashboard-container">
	<div class="dashboard-header">
		<div class="welcome">
			<h1>
				Willkommen zurück{$currentUser?.email
					? `, ${$currentUser.email.split("@")[0]}`
					: ""}
			</h1>
			<p>Verwalten Sie Ihre E-Rechnungen, Kunden und Vorlagen</p>
		</div>

		<div class="actions">
			<a href="/erstellen" class="btn btn-primary"> + Neue Rechnung </a>
		</div>
	</div>

	{#if $dashboardLoading}
		<div class="loading-section">
			<div class="spinner"></div>
			<p>Lade Dashboard-Daten...</p>
		</div>
	{:else if $dashboardError}
		<div class="error-section">
			<p>Fehler beim Laden: {$dashboardError}</p>
			<button
				class="btn btn-secondary"
				on:click={() => dashboardActions.initialize()}
			>
				Erneut versuchen
			</button>
		</div>
	{:else}
		<div class="stats-grid">
			<div class="stat-card">
				<div class="stat-icon">📄</div>
				<div class="stat-content">
					<div class="stat-value">{$dashboardStats.invoicesCount}</div>
					<div class="stat-label">Rechnungen</div>
				</div>
			</div>

			<div class="stat-card">
				<div class="stat-icon">👥</div>
				<div class="stat-content">
					<div class="stat-value">{$dashboardStats.customersCount}</div>
					<div class="stat-label">Kunden</div>
				</div>
			</div>

			<div class="stat-card">
				<div class="stat-icon">💰</div>
				<div class="stat-content">
					<div class="stat-value">
						{formatCurrency($dashboardStats.totalRevenue)}
					</div>
					<div class="stat-label">Gesamtumsatz</div>
				</div>
			</div>

			<div class="stat-card">
				<div class="stat-icon">📅</div>
				<div class="stat-content">
					<div class="stat-value">
						{formatDate($dashboardStats.lastInvoiceDate)}
					</div>
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

							<button
								class="quick-action"
								on:click={() => (showCreateContactModal = true)}
							>
								<span class="icon">👤</span>
								<span>Neuen Kunden anlegen</span>
							</button>

							<a href="/auslesen" class="quick-action">
								<span class="icon">🔍</span>
								<span>Rechnung prüfen</span>
							</a>

							<a href="/preise" class="quick-action">
								<span class="icon">⭐</span>
								<span>Premium Features</span>
							</a>
						</div>

						{#if $recentContacts.length > 0}
							<div class="recent-section">
								<h3>Aktuelle Kunden</h3>
								<div class="recent-contacts">
									{#each $recentContacts as contact}
										<div class="contact-card">
											<div class="contact-info">
												<h4>{contact.name}</h4>
												<p>{contact.email}</p>
												<small>{contact.city}</small>
											</div>
											<div class="contact-actions">
												<button class="btn-icon" title="Rechnung erstellen"
													>📄</button
												>
												<button class="btn-icon" title="Bearbeiten">✏️</button>
											</div>
										</div>
									{/each}
								</div>
							</div>
						{:else}
							<div class="empty-state">
								<p>Sie haben noch keine Kunden angelegt.</p>
								<button
									class="btn btn-primary"
									on:click={() => (showCreateContactModal = true)}
								>
									Ersten Kunden anlegen
								</button>
							</div>
						{/if}
					</div>
				{:else if activeTab === "customers"}
					<div class="customers-section">
						<div class="section-header">
							<h2>Kundenverwaltung</h2>
							<button
								class="btn btn-primary"
								on:click={() => (showCreateContactModal = true)}
							>
								+ Neuer Kunde
							</button>
						</div>

						{#if $contactsLoading}
							<div class="loading">Lade Kunden...</div>
						{:else if $contactsError}
							<div class="error">Fehler: {$contactsError}</div>
						{:else if $contacts.length > 0}
							<div class="contacts-table">
								<table>
									<thead>
										<tr>
											<th>Name</th>
											<th>E-Mail</th>
											<th>Stadt</th>
											<th>Telefon</th>
											<th>Aktionen</th>
										</tr>
									</thead>
									<tbody>
										{#each $contacts as contact}
											<tr>
												<td>{contact.name}</td>
												<td>{contact.email || "-"}</td>
												<td>{contact.city || "-"}</td>
												<td>{contact.phone || "-"}</td>
												<td>
													<div class="action-buttons">
														<button class="btn-small btn-secondary"
															>Bearbeiten</button
														>
														<button
															class="btn-small btn-danger"
															on:click={() =>
																handleDeleteContact(contact.contactId)}
														>
															Löschen
														</button>
													</div>
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						{:else}
							<div class="empty-state">
								<p>Keine Kunden vorhanden.</p>
								<button
									class="btn btn-primary"
									on:click={() => (showCreateContactModal = true)}
								>
									Ersten Kunden anlegen
								</button>
							</div>
						{/if}
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
							<p>Rechnungshistorie ist nur mit Premium verfügbar.</p>
							<a href="/preise" class="btn btn-primary">Premium werden</a>
						</div>
					</div>
				{:else if activeTab === "templates"}
					<div class="templates-section">
						<div class="section-header">
							<h2>Rechnungsvorlagen</h2>
							<button class="btn btn-primary" disabled> + Neue Vorlage </button>
						</div>

						<div class="empty-state">
							<p>Vorlagen sind nur mit Premium verfügbar.</p>
							<a href="/preise" class="btn btn-primary">Premium werden</a>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<!-- Create Contact Modal -->
{#if showCreateContactModal}
	<div
		class="modal-overlay"
		on:click={() => (showCreateContactModal = false)}
		on:keydown={handleCloseModal}
		role="dialog"
		aria-modal="true"
		aria-labelledby="modal-title"
		tabindex="-1"
	>
		<div
			class="modal"
			on:click|stopPropagation
			on:keydown|stopPropagation
			role="document"
		>
			<div class="modal-header">
				<h3 id="modal-title">Neuen Kunden anlegen</h3>
				<button
					class="modal-close"
					on:click={() => (showCreateContactModal = false)}
				>
					✕
				</button>
			</div>

			<div class="modal-content">
				<div class="form-group">
					<label for="contact-name">Firmenname / Name *</label>
					<input
						id="contact-name"
						type="text"
						bind:value={newContact.name}
						placeholder="Kunde GmbH"
						required
					/>
				</div>

				<div class="form-row">
					<div class="form-group">
						<label for="contact-email">E-Mail</label>
						<input
							id="contact-email"
							type="email"
							bind:value={newContact.email}
							placeholder="kontakt@kunde.de"
						/>
					</div>
					<div class="form-group">
						<label for="contact-phone">Telefon</label>
						<input
							id="contact-phone"
							type="tel"
							bind:value={newContact.phone}
							placeholder="+49 123 456789"
						/>
					</div>
				</div>

				<div class="form-group">
					<label for="contact-street">Straße</label>
					<input
						id="contact-street"
						type="text"
						bind:value={newContact.street}
						placeholder="Kundenstraße 456"
					/>
				</div>

				<div class="form-row">
					<div class="form-group">
						<label for="contact-zip">PLZ</label>
						<input
							id="contact-zip"
							type="text"
							bind:value={newContact.zip}
							placeholder="54321"
						/>
					</div>
					<div class="form-group">
						<label for="contact-city">Stadt</label>
						<input
							id="contact-city"
							type="text"
							bind:value={newContact.city}
							placeholder="Kundenstadt"
						/>
					</div>
				</div>
			</div>

			<div class="modal-actions">
				<button
					class="btn btn-secondary"
					on:click={() => (showCreateContactModal = false)}
				>
					Abbrechen
				</button>
				<button class="btn btn-primary" on:click={handleCreateContact}>
					Kunde anlegen
				</button>
			</div>
		</div>
	</div>
{/if}

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

	.loading-section,
	.error-section {
		text-align: center;
		padding: 3rem;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid var(--border-color);
		border-top: 4px solid var(--primary-color);
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 1rem;
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
		font-size: 1.5rem;
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
		border: none;
		cursor: pointer;
	}

	.quick-action:hover {
		background: var(--primary-light);
		transform: translateY(-2px);
	}

	.quick-action .icon {
		font-size: 2rem;
	}

	.recent-section {
		margin-bottom: 2rem;
	}

	.recent-contacts {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1rem;
	}

	.contact-card {
		background: var(--bg-white);
		padding: 1rem;
		border-radius: var(--radius);
		border: 1px solid var(--border-color);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.contact-info h4 {
		margin: 0 0 0.25rem 0;
	}

	.contact-info p {
		margin: 0;
		color: var(--text-light);
		font-size: 0.875rem;
	}

	.contact-actions {
		display: flex;
		gap: 0.5rem;
	}

	.btn-icon {
		background: none;
		border: none;
		padding: 0.5rem;
		cursor: pointer;
		border-radius: var(--radius);
		transition: background 0.3s ease;
	}

	.btn-icon:hover {
		background: var(--bg-light);
	}

	.contacts-table {
		background: var(--bg-white);
		border-radius: var(--radius);
		overflow: hidden;
		border: 1px solid var(--border-color);
	}

	.contacts-table table {
		width: 100%;
		border-collapse: collapse;
	}

	.contacts-table th,
	.contacts-table td {
		padding: 1rem;
		text-align: left;
		border-bottom: 1px solid var(--border-color);
	}

	.contacts-table th {
		background: var(--bg-light);
		font-weight: 600;
	}

	.action-buttons {
		display: flex;
		gap: 0.5rem;
	}

	.btn-small {
		padding: 0.25rem 0.75rem;
		font-size: 0.875rem;
	}

	.btn-danger {
		background: #dc3545;
		color: white;
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

	.search-input,
	.filter-select {
		padding: 0.5rem 1rem;
		border: 1px solid var(--border-color);
		border-radius: var(--radius);
		min-width: 200px;
	}

	.empty-state {
		text-align: center;
		padding: 3rem;
		color: var(--text-light);
	}

	/* Modal Styles */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal {
		background: var(--bg-white);
		border-radius: var(--radius-lg);
		max-width: 500px;
		width: 90%;
		max-height: 90vh;
		overflow-y: auto;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid var(--border-color);
	}

	.modal-close {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: var(--text-light);
	}

	.modal-content {
		padding: 1.5rem;
	}

	.modal-actions {
		display: flex;
		gap: 1rem;
		padding: 1.5rem;
		border-top: 1px solid var(--border-color);
	}

	.form-group {
		margin-bottom: 1rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
	}

	.form-group input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid var(--border-color);
		border-radius: var(--radius);
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
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
		}

		.form-row {
			grid-template-columns: 1fr;
		}
	}
</style>
