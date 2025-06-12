<!-- src/routes/dashboard/+page.svelte - VOLLSTÄNDIGE IMPLEMENTATION -->
<script>
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { browser } from "$app/environment";

	import { authStore, isAuthenticated, isLoading } from "$lib/stores/authStore";
	import {
		dashboardStats,
		contacts,
		recentContacts,
		dashboardLoading,
		dashboardError,
		dashboardActions
	} from "$lib/stores/dashboardStore.js";

	// Local UI State
	let activeTab = "overview";
	let showCreateContactModal = false;
	let recentInvoices = [];
	let loadingInvoices = false;

	// Contact form
	let newContact = {
		name: "",
		email: "",
		street: "",
		zip: "",
		city: "",
		phone: ""
	};

	// Reactive Redirect
	$: if (browser && !$isAuthenticated && !$isLoading) {
		goto("/login");
	}

	onMount(() => {
		const unsubscribe = isLoading.subscribe((loading) => {
			if (!loading && $isAuthenticated) {
				dashboardActions.initialize();
				loadRecentInvoices();
			}
		});

		return unsubscribe;
	});

	// Load recent invoices
	async function loadRecentInvoices() {
		if (!$isAuthenticated) return;

		loadingInvoices = true;
		try {
			const response = await fetch(
				`${import.meta.env.VITE_API_URL}/invoices/recent`,
				{
					headers: {
						Authorization: `Bearer ${authStore.getTokens()?.IdToken}`
					}
				}
			);

			if (response.ok) {
				const data = await response.json();
				recentInvoices = data.invoices || [];
			}
		} catch (error) {
			console.error("Error loading invoices:", error);
		} finally {
			loadingInvoices = false;
		}
	}

	// Helper Functions
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

	// Action Handlers
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
		} else {
			alert(`Error creating contact: ${result.error}`);
		}
	}

	async function handleDeleteContact(contactId) {
		if (confirm("Möchten Sie diesen Kontakt wirklich löschen?")) {
			await dashboardActions.deleteContact(contactId);
		}
	}

	function openInvoiceCreator(templateData = null) {
		if (templateData) {
			// Als Vorlage verwenden - Daten in localStorage speichern
			localStorage.setItem("invoice_template", JSON.stringify(templateData));
		}
		goto("/erstellen");
	}

	async function downloadInvoiceFiles(invoice) {
		try {
			// PDF Download
			if (invoice.files?.pdf) {
				const response = await fetch(
					`${import.meta.env.VITE_API_URL}/invoices/${invoice.id}/pdf`,
					{
						headers: {
							Authorization: `Bearer ${authStore.getTokens()?.IdToken}`
						}
					}
				);
				if (response.ok) {
					const blob = await response.blob();
					const url = URL.createObjectURL(blob);
					const a = document.createElement("a");
					a.href = url;
					a.download = invoice.files.pdf;
					a.click();
					URL.revokeObjectURL(url);
				}
			}
		} catch (error) {
			console.error("Download error:", error);
			alert("Fehler beim Download der Rechnung");
		}
	}
</script>

<svelte:head>
	<title>Dashboard | kostenlose-erechnung.de</title>
</svelte:head>

<div class="dashboard-container">
	{#if $isAuthenticated && $authStore}
		<div class="dashboard-header">
			<div class="welcome">
				<h1>Willkommen zurück, {$authStore.email?.split("@")[0]}! 💚</h1>
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
					on:click={dashboardActions.initialize}
				>
					Erneut versuchen
				</button>
			</div>
		{:else}
			<!-- Stats Grid -->
			<div class="stats-grid">
				<div class="stat-card">
					<div class="stat-icon">📄</div>
					<div class="stat-content">
						<div class="stat-value">{$dashboardStats.invoicesCount}</div>
						<div class="stat-label">Rechnungen erstellt</div>
					</div>
				</div>

				<div class="stat-card">
					<div class="stat-icon">👥</div>
					<div class="stat-content">
						<div class="stat-value">{$dashboardStats.customersCount}</div>
						<div class="stat-label">Gespeicherte Kunden</div>
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

			<!-- Tabs Navigation -->
			<div class="dashboard-content">
				<nav class="tabs">
					<button
						class="tab"
						class:active={activeTab === "overview"}
						on:click={() => (activeTab = "overview")}
					>
						📊 Übersicht
					</button>
					<button
						class="tab"
						class:active={activeTab === "invoices"}
						on:click={() => (activeTab = "invoices")}
					>
						📄 Rechnungen
					</button>
					<button
						class="tab"
						class:active={activeTab === "customers"}
						on:click={() => (activeTab = "customers")}
					>
						👥 Kunden
					</button>
					<button
						class="tab"
						class:active={activeTab === "profile"}
						on:click={() => (activeTab = "profile")}
					>
						⚙️ Profil
					</button>
				</nav>

				<div class="tab-content">
					{#if activeTab === "overview"}
						<div class="overview-content">
							<div class="overview-grid">
								<!-- Recent Invoices -->
								<div class="overview-card">
									<div class="card-header">
										<h3>🕒 Letzte Rechnungen</h3>
										<a
											href="#"
											on:click={() => (activeTab = "invoices")}
											class="view-all">Alle anzeigen →</a
										>
									</div>

									{#if loadingInvoices}
										<div class="card-loading">
											<div class="spinner-small"></div>
											<span>Lade Rechnungen...</span>
										</div>
									{:else if recentInvoices.length === 0}
										<div class="empty-state">
											<p>Noch keine Rechnungen erstellt</p>
											<a href="/erstellen" class="btn btn-primary"
												>Erste Rechnung erstellen</a
											>
										</div>
									{:else}
										<div class="recent-list">
											{#each recentInvoices.slice(0, 5) as invoice}
												<div class="recent-item">
													<div class="recent-info">
														<strong
															>{invoice.data.metadata.invoiceNumber}</strong
														>
														<span class="recent-meta"
															>{invoice.data.recipient.name} • {formatDate(
																invoice.data.metadata.date
															)}</span
														>
													</div>
													<div class="recent-amount">
														{formatCurrency(invoice.total)}
													</div>
													<div class="recent-actions">
														<button
															class="btn-icon"
															on:click={() => downloadInvoiceFiles(invoice)}
															title="Herunterladen"
														>
															📥
														</button>
														<button
															class="btn-icon"
															on:click={() => openInvoiceCreator(invoice.data)}
															title="Als Vorlage verwenden"
														>
															📋
														</button>
													</div>
												</div>
											{/each}
										</div>
									{/if}
								</div>

								<!-- Recent Contacts -->
								<div class="overview-card">
									<div class="card-header">
										<h3>👥 Letzte Kunden</h3>
										<a
											href="#"
											on:click={() => (activeTab = "customers")}
											class="view-all">Alle anzeigen →</a
										>
									</div>

									{#if $contacts.length === 0}
										<div class="empty-state">
											<p>Noch keine Kunden gespeichert</p>
											<button
												class="btn btn-secondary"
												on:click={() => (showCreateContactModal = true)}
											>
												Ersten Kunden anlegen
											</button>
										</div>
									{:else}
										<div class="recent-list">
											{#each $recentContacts as contact}
												<div class="recent-item">
													<div class="recent-info">
														<strong>{contact.name}</strong>
														<span class="recent-meta"
															>{contact.email || contact.city}</span
														>
													</div>
													<div class="recent-actions">
														<button
															class="btn-icon"
															on:click={() =>
																openInvoiceCreator({ recipient: contact })}
															title="Rechnung erstellen"
														>
															📄
														</button>
													</div>
												</div>
											{/each}
										</div>
									{/if}
								</div>

								<!-- Quick Actions -->
								<div class="overview-card quick-actions">
									<h3>⚡ Schnellaktionen</h3>
									<div class="action-buttons">
										<a href="/erstellen" class="action-btn">
											<span class="action-icon">📄</span>
											<span class="action-text">Neue Rechnung</span>
										</a>
										<button
											class="action-btn"
											on:click={() => (showCreateContactModal = true)}
										>
											<span class="action-icon">👤</span>
											<span class="action-text">Kunde hinzufügen</span>
										</button>
										<a href="/auslesen" class="action-btn">
											<span class="action-icon">🔍</span>
											<span class="action-text">Rechnung prüfen</span>
										</a>
									</div>
								</div>
							</div>
						</div>
					{:else if activeTab === "invoices"}
						<div class="invoices-content">
							<div class="content-header">
								<h2>Ihre Rechnungen</h2>
								<a href="/erstellen" class="btn btn-primary">+ Neue Rechnung</a>
							</div>

							{#if loadingInvoices}
								<div class="loading-content">
									<div class="spinner"></div>
									<p>Lade Rechnungen...</p>
								</div>
							{:else if recentInvoices.length === 0}
								<div class="empty-state-large">
									<div class="empty-icon">📄</div>
									<h3>Noch keine Rechnungen</h3>
									<p>Erstellen Sie Ihre erste professionelle E-Rechnung</p>
									<a href="/erstellen" class="btn btn-primary">Jetzt starten</a>
								</div>
							{:else}
								<div class="invoices-table">
									<div class="table-header">
										<div class="th">Nr.</div>
										<div class="th">Kunde</div>
										<div class="th">Datum</div>
										<div class="th">Betrag</div>
										<div class="th">Aktionen</div>
									</div>
									{#each recentInvoices as invoice}
										<div class="table-row">
											<div class="td font-mono">
												{invoice.data.metadata.invoiceNumber}
											</div>
											<div class="td">{invoice.data.recipient.name}</div>
											<div class="td">
												{formatDate(invoice.data.metadata.date)}
											</div>
											<div class="td font-bold">
												{formatCurrency(invoice.total)}
											</div>
											<div class="td">
												<div class="action-buttons-inline">
													<button
														class="btn-icon"
														on:click={() => downloadInvoiceFiles(invoice)}
														title="Herunterladen">📥</button
													>
													<button
														class="btn-icon"
														on:click={() => openInvoiceCreator(invoice.data)}
														title="Als Vorlage">📋</button
													>
												</div>
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					{:else if activeTab === "customers"}
						<div class="customers-content">
							<div class="content-header">
								<h2>Ihre Kunden</h2>
								<button
									class="btn btn-primary"
									on:click={() => (showCreateContactModal = true)}
								>
									+ Neuer Kunde
								</button>
							</div>

							{#if $contacts.length === 0}
								<div class="empty-state-large">
									<div class="empty-icon">👥</div>
									<h3>Noch keine Kunden</h3>
									<p>
										Speichern Sie Kundendaten für schnellere Rechnungserstellung
									</p>
									<button
										class="btn btn-primary"
										on:click={() => (showCreateContactModal = true)}
									>
										Ersten Kunden anlegen
									</button>
								</div>
							{:else}
								<div class="contacts-grid">
									{#each $contacts as contact}
										<div class="contact-card">
											<div class="contact-header">
												<h4>{contact.name}</h4>
												<div class="contact-actions">
													<button
														class="btn-icon"
														on:click={() =>
															openInvoiceCreator({ recipient: contact })}
														title="Rechnung erstellen">📄</button
													>
													<button
														class="btn-icon danger"
														on:click={() =>
															handleDeleteContact(contact.contactId)}
														title="Löschen">🗑️</button
													>
												</div>
											</div>
											<div class="contact-details">
												{#if contact.email}<p>📧 {contact.email}</p>{/if}
												{#if contact.street}<p>
														📍 {contact.street}, {contact.zip}
														{contact.city}
													</p>{/if}
												{#if contact.phone}<p>📞 {contact.phone}</p>{/if}
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					{:else if activeTab === "profile"}
						<div class="profile-content">
							<div class="content-header">
								<h2>Profil & Einstellungen</h2>
							</div>

							<div class="profile-grid">
								<div class="profile-card">
									<h3>🏢 Firmendaten</h3>
									<p>Ihre Standard-Absenderdaten für alle Rechnungen</p>
									<button class="btn btn-secondary"
										>Firmendaten bearbeiten</button
									>
								</div>

								<div class="profile-card">
									<h3>🔐 Konto</h3>
									<p>E-Mail: {$authStore.email}</p>
									<p>Plan: {$authStore.subscriptionStatus || "Kostenlos"}</p>
									<div class="profile-actions">
										<button class="btn btn-secondary">Passwort ändern</button>
										{#if $authStore.subscriptionStatus !== "premium"}
											<a href="/preise" class="btn btn-primary"
												>Upgrade zu Premium</a
											>
										{/if}
									</div>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	{:else if $isLoading}
		<div class="loading-section">
			<div class="spinner"></div>
			<p>Lade Benutzerinformationen...</p>
		</div>
	{:else}
		<div class="error-section">
			<p>Sie sind nicht angemeldet.</p>
			<a href="/login" class="btn btn-primary">Zur Anmeldung</a>
		</div>
	{/if}
</div>

<!-- Create Contact Modal -->
{#if showCreateContactModal}
	<div class="modal-overlay" on:click={() => (showCreateContactModal = false)}>
		<div class="modal" on:click|stopPropagation>
			<div class="modal-header">
				<h3>Neuen Kunden anlegen</h3>
				<button
					class="modal-close"
					on:click={() => (showCreateContactModal = false)}>✕</button
				>
			</div>

			<div class="modal-content">
				<div class="form-grid">
					<div class="form-group">
						<label>Firmenname / Name *</label>
						<input
							type="text"
							bind:value={newContact.name}
							placeholder="Mustermann GmbH"
							required
						/>
					</div>
					<div class="form-group">
						<label>E-Mail</label>
						<input
							type="email"
							bind:value={newContact.email}
							placeholder="info@mustermann.de"
						/>
					</div>
					<div class="form-group">
						<label>Straße</label>
						<input
							type="text"
							bind:value={newContact.street}
							placeholder="Musterstraße 123"
						/>
					</div>
					<div class="form-group half">
						<label>PLZ</label>
						<input
							type="text"
							bind:value={newContact.zip}
							placeholder="12345"
						/>
					</div>
					<div class="form-group half">
						<label>Stadt</label>
						<input
							type="text"
							bind:value={newContact.city}
							placeholder="Musterstadt"
						/>
					</div>
					<div class="form-group">
						<label>Telefon</label>
						<input
							type="tel"
							bind:value={newContact.phone}
							placeholder="+49 123 456789"
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
				<button
					class="btn btn-primary"
					on:click={handleCreateContact}
					disabled={!newContact.name}
				>
					Kunde anlegen
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	/* ALL YOUR EXISTING DASHBOARD STYLES REMAIN THE SAME */
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
		flex-wrap: wrap;
		gap: 1rem;
	}

	.welcome h1 {
		font-size: 1.75rem;
		margin-bottom: 0.25rem;
	}

	.welcome p {
		color: var(--text-light, #6c757d);
		margin: 0;
	}

	.loading-section,
	.error-section {
		text-align: center;
		padding: 4rem 2rem;
		background-color: var(--bg-light, #f8f9fa);
		border-radius: var(--radius-lg, 12px);
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid var(--border-color, #dee2e6);
		border-top: 4px solid var(--primary-color, #7bfe84);
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
		background: var(--bg-white, #fff);
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1.5rem;
		margin-bottom: 3rem;

		border-radius: var(--radius-lg, 12px);
		border: 1px solid var(--border-color, #dee2e6);
	}

	.stat-card {
		padding: 1.5rem;

		display: flex;
		align-items: center;
		gap: 1.5rem;
	}

	.stat-icon {
		font-size: 2rem;
		width: 60px;
		height: 60px;
		background: var(--bg-light, #f8f9fa);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.stat-content {
		line-height: 1.2;
	}

	.stat-value {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--text-dark, #1a1a1a);
	}

	.stat-label {
		color: var(--text-light, #6c757d);
		font-size: 0.875rem;
	}

	.tabs {
		display: flex;
		gap: 1rem;
		border-bottom: 2px solid var(--border-color, #dee2e6);
		margin-bottom: 2rem;
	}

	.tab {
		background: none;
		border: none;
		padding: 0.75rem 0.25rem;
		margin: 0 1rem;
		font-weight: 600;
		color: var(--text-light, #6c757d);
		cursor: pointer;
		transition: all 0.3s ease;
		position: relative;
	}
	.tab:first-child {
		margin-left: 0;
	}

	.tab:hover {
		color: var(--text-dark, #1a1a1a);
	}

	.tab.active {
		color: var(--primary-dark, #5cb85c);
	}

	.tab.active::after {
		content: "";
		position: absolute;
		bottom: -2px;
		left: 0;
		right: 0;
		height: 2px;
		background: var(--primary-color, #7bfe84);
	}

	.tab-content {
		min-height: 200px;
	}
	.overview-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		margin-bottom: 2rem;
	}

	.overview-card {
		background: var(--bg-white);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-lg);
		padding: 1.5rem;
	}

	.overview-card.quick-actions {
		grid-column: 1 / -1;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.card-header h3 {
		margin: 0;
		font-size: 1.125rem;
	}

	.view-all {
		color: var(--primary-dark);
		text-decoration: none;
		font-size: 0.875rem;
	}

	.recent-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.recent-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem;
		background: var(--bg-light);
		border-radius: var(--radius);
	}

	.recent-info strong {
		display: block;
		margin-bottom: 0.25rem;
	}

	.recent-meta {
		font-size: 0.875rem;
		color: var(--text-light);
	}

	.recent-amount {
		font-weight: 600;
		color: var(--primary-dark);
	}

	.recent-actions {
		display: flex;
		gap: 0.5rem;
	}

	.btn-icon {
		background: none;
		border: none;
		padding: 0.25rem;
		cursor: pointer;
		border-radius: 4px;
		transition: background 0.2s;
	}

	.btn-icon:hover {
		background: var(--border-color);
	}

	.action-buttons {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 1rem;
	}

	.action-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1rem;
		border: 2px solid var(--border-color);
		border-radius: var(--radius);
		text-decoration: none;
		color: var(--text-dark);
		transition: all 0.2s;
		background: none;
		cursor: pointer;
	}

	.action-btn:hover {
		border-color: var(--primary-color);
		background: var(--primary-light);
	}

	.action-icon {
		font-size: 2rem;
		margin-bottom: 0.5rem;
	}

	.empty-state,
	.empty-state-large {
		text-align: center;
		padding: 2rem;
		color: var(--text-light);
	}

	.empty-state-large .empty-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.invoices-table {
		background: var(--bg-white);
		border-radius: var(--radius);
		overflow: hidden;
		border: 1px solid var(--border-color);
	}

	.table-header,
	.table-row {
		display: grid;
		grid-template-columns: 1fr 2fr 1fr 1fr 1fr;
		gap: 1rem;
		padding: 1rem;
		align-items: center;
	}

	.table-header {
		background: var(--bg-light);
		font-weight: 600;
		border-bottom: 1px solid var(--border-color);
	}

	.table-row {
		border-bottom: 1px solid var(--border-color);
	}

	.table-row:last-child {
		border-bottom: none;
	}

	.contacts-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.contact-card {
		background: var(--bg-white);
		border: 1px solid var(--border-color);
		border-radius: var(--radius);
		padding: 1.5rem;
	}

	.contact-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.contact-details p {
		margin: 0.5rem 0;
		font-size: 0.875rem;
		color: var(--text-light);
	}

	.profile-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
	}

	.profile-card {
		background: var(--bg-white);
		border: 1px solid var(--border-color);
		border-radius: var(--radius);
		padding: 2rem;
	}

	.profile-actions {
		display: flex;
		gap: 1rem;
		margin-top: 1rem;
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
		max-width: 600px;
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

	.modal-content {
		padding: 1.5rem;
	}

	.modal-actions {
		display: flex;
		justify-content: space-between;
		padding: 1.5rem;
		border-top: 1px solid var(--border-color);
		gap: 1rem;
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-group.half {
		grid-column: span 1;
	}

	.form-group label {
		font-weight: 500;
		font-size: 0.875rem;
	}

	.form-group input {
		padding: 0.75rem;
		border: 1px solid var(--border-color);
		border-radius: var(--radius);
	}

	@media (max-width: 768px) {
		.overview-grid {
			grid-template-columns: 1fr;
		}

		.table-header,
		.table-row {
			grid-template-columns: 1fr;
			gap: 0.5rem;
		}

		.contacts-grid {
			grid-template-columns: 1fr;
		}

		.form-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
