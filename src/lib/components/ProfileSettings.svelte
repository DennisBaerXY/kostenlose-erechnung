<!-- src/lib/components/ProfileSettings.svelte -->
<script>
	import { onMount } from "svelte";
	import {
		profileData,
		profileActions,
		defaultSenderData$
	} from "$lib/stores/profileStore.js";
	import { fade, fly } from "svelte/transition";

	// Local form state
	let formData = {};
	let saving = false;
	let saveSuccess = false;
	let saveError = "";
	let activeSection = "company"; // 'company' | 'bank' | 'tax'

	// Initialize form data
	$: if ($defaultSenderData$ && Object.keys(formData).length === 0) {
		formData = JSON.parse(JSON.stringify($defaultSenderData$));
	}

	// Form validation
	$: isFormValid =
		formData.name &&
		formData.street &&
		formData.zip &&
		formData.city &&
		(formData.taxId || formData.ustId);

	onMount(() => {
		profileActions.loadProfile();
	});

	async function handleSave() {
		if (!isFormValid) {
			saveError = "Bitte füllen Sie alle Pflichtfelder aus.";
			return;
		}

		saving = true;
		saveError = "";
		saveSuccess = false;

		try {
			const result = await profileActions.saveSenderData(formData);

			if (result.success) {
				saveSuccess = true;
				setTimeout(() => {
					saveSuccess = false;
				}, 3000);
			} else {
				saveError = result.error || "Fehler beim Speichern";
			}
		} catch (error) {
			saveError = "Ein unerwarteter Fehler ist aufgetreten";
		} finally {
			saving = false;
		}
	}

	function handleReset() {
		formData = JSON.parse(JSON.stringify($defaultSenderData$));
		saveError = "";
		saveSuccess = false;
	}

	function handleLogoUpload(event) {
		const file = event.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => {
				formData.logo = e.target.result;
			};
			reader.readAsDataURL(file);
		}
	}

	function removeLogo() {
		formData.logo = null;
	}
</script>

<div class="profile-settings">
	<div class="settings-header">
		<h2>📊 Firmendaten verwalten</h2>
		<p>Diese Daten werden automatisch für neue Rechnungen verwendet</p>
	</div>

	{#if $profileData.loading}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Lade Profildaten...</p>
		</div>
	{:else}
		<div class="settings-content">
			<!-- Section Navigation -->
			<nav class="section-nav">
				<button
					class="nav-item"
					class:active={activeSection === "company"}
					on:click={() => (activeSection = "company")}
				>
					🏢 Firmendaten
				</button>
				<button
					class="nav-item"
					class:active={activeSection === "bank"}
					on:click={() => (activeSection = "bank")}
				>
					🏦 Bankdaten
				</button>
				<button
					class="nav-item"
					class:active={activeSection === "tax"}
					on:click={() => (activeSection = "tax")}
				>
					📋 Steuerinfo
				</button>
			</nav>

			<!-- Success/Error Messages -->
			{#if saveSuccess}
				<div class="alert alert-success" in:fly={{ y: -10, duration: 300 }}>
					✅ Firmendaten erfolgreich gespeichert!
				</div>
			{/if}

			{#if saveError}
				<div class="alert alert-error" in:fly={{ y: -10, duration: 300 }}>
					❌ {saveError}
				</div>
			{/if}

			<!-- Form Sections -->
			<div class="form-sections">
				{#if activeSection === "company"}
					<div class="form-section" in:fade={{ duration: 200 }}>
						<h3>Grunddaten</h3>

						<div class="form-grid">
							<div class="form-group">
								<label for="company-name">Firmenname *</label>
								<input
									id="company-name"
									type="text"
									bind:value={formData.name}
									placeholder="Mustermann GmbH"
									required
									class="input"
								/>
							</div>

							<div class="form-group">
								<label for="contact-name">Ansprechpartner</label>
								<input
									id="contact-name"
									type="text"
									bind:value={formData.contactName}
									placeholder="Max Mustermann"
									class="input"
								/>
							</div>

							<div class="form-group">
								<label for="street">Straße und Hausnummer *</label>
								<input
									id="street"
									type="text"
									bind:value={formData.street}
									placeholder="Musterstraße 123"
									required
									class="input"
								/>
							</div>

							<div class="form-group half">
								<label for="zip">Postleitzahl *</label>
								<input
									id="zip"
									type="text"
									bind:value={formData.zip}
									placeholder="12345"
									required
									class="input"
								/>
							</div>

							<div class="form-group half">
								<label for="city">Stadt *</label>
								<input
									id="city"
									type="text"
									bind:value={formData.city}
									placeholder="Musterstadt"
									required
									class="input"
								/>
							</div>

							<div class="form-group">
								<label for="phone">Telefonnummer</label>
								<input
									id="phone"
									type="tel"
									bind:value={formData.phone}
									placeholder="+49 123 456789"
									class="input"
								/>
							</div>

							<div class="form-group">
								<label for="email">E-Mail-Adresse</label>
								<input
									id="email"
									type="email"
									bind:value={formData.email}
									placeholder="info@mustermann.de"
									class="input"
								/>
							</div>
						</div>

						<!-- Logo Upload -->
						<div class="logo-section">
							<h4>Firmenlogo</h4>
							<div class="logo-upload">
								{#if formData.logo}
									<div class="logo-preview">
										<img src={formData.logo} alt="Firmenlogo" />
										<button
											type="button"
											class="btn-remove"
											on:click={removeLogo}
										>
											🗑️ Entfernen
										</button>
									</div>
								{:else}
									<div class="logo-placeholder">
										<input
											type="file"
											id="logo-upload"
											accept="image/*"
											on:change={handleLogoUpload}
											hidden
										/>
										<label for="logo-upload" class="upload-label">
											📁 Logo hochladen
										</label>
										<p>JPG, PNG oder SVG, max. 2MB</p>
									</div>
								{/if}
							</div>
						</div>
					</div>
				{:else if activeSection === "bank"}
					<div class="form-section" in:fade={{ duration: 200 }}>
						<h3>Bankverbindung</h3>

						<div class="form-grid">
							<div class="form-group">
								<label for="account-holder">Kontoinhaber</label>
								<input
									id="account-holder"
									type="text"
									bind:value={formData.bankDetails.accountHolder}
									placeholder="Mustermann GmbH"
									class="input"
								/>
							</div>

							<div class="form-group">
								<label for="bank-name">Bank</label>
								<input
									id="bank-name"
									type="text"
									bind:value={formData.bankDetails.bankName}
									placeholder="Musterbank"
									class="input"
								/>
							</div>

							<div class="form-group">
								<label for="iban">IBAN</label>
								<input
									id="iban"
									type="text"
									bind:value={formData.bankDetails.iban}
									placeholder="DE12 3456 7890 1234 5678 90"
									class="input"
									style="font-family: monospace;"
								/>
							</div>

							<div class="form-group">
								<label for="bic">BIC/SWIFT</label>
								<input
									id="bic"
									type="text"
									bind:value={formData.bankDetails.bic}
									placeholder="MUSTDEMUXXX"
									class="input"
									style="font-family: monospace;"
								/>
							</div>
						</div>
					</div>
				{:else if activeSection === "tax"}
					<div class="form-section" in:fade={{ duration: 200 }}>
						<h3>Steuer- und Registerinformationen</h3>

						<div class="form-grid">
							<div class="form-group">
								<label for="tax-id">Steuernummer</label>
								<input
									id="tax-id"
									type="text"
									bind:value={formData.taxId}
									placeholder="12/345/67890"
									class="input"
								/>
								<small
									>Mindestens Steuernummer oder USt-IdNr. erforderlich</small
								>
							</div>

							<div class="form-group">
								<label for="ust-id">USt-IdNr.</label>
								<input
									id="ust-id"
									type="text"
									bind:value={formData.ustId}
									placeholder="DE123456789"
									class="input"
								/>
							</div>

							<div class="form-group">
								<label for="managing-director">Geschäftsführer</label>
								<input
									id="managing-director"
									type="text"
									bind:value={formData.companyInfo.managingDirector}
									placeholder="Max Mustermann"
									class="input"
								/>
							</div>

							<div class="form-group">
								<label for="commercial-register">Handelsregister</label>
								<input
									id="commercial-register"
									type="text"
									bind:value={formData.companyInfo.commercialRegister}
									placeholder="HRB 12345"
									class="input"
								/>
							</div>

							<div class="form-group">
								<label for="register-court">Registergericht</label>
								<input
									id="register-court"
									type="text"
									bind:value={formData.companyInfo.registerCourt}
									placeholder="Amtsgericht Musterstadt"
									class="input"
								/>
							</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- Action Buttons -->
			<div class="form-actions">
				<button type="button" class="btn btn-secondary" on:click={handleReset}>
					Zurücksetzen
				</button>
				<button
					type="button"
					class="btn btn-primary"
					on:click={handleSave}
					disabled={saving || !isFormValid}
				>
					{#if saving}
						<span class="spinner-small"></span>
						Speichern...
					{:else}
						💾 Speichern
					{/if}
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.profile-settings {
		max-width: 800px;
		margin: 0 auto;
	}

	.settings-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.settings-header h2 {
		margin: 0 0 0.5rem 0;
		font-size: 1.75rem;
	}

	.settings-header p {
		color: var(--text-light);
		margin: 0;
	}

	.loading-state {
		text-align: center;
		padding: 4rem 2rem;
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

	.section-nav {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 2rem;
		background: var(--bg-light);
		padding: 0.5rem;
		border-radius: var(--radius);
	}

	.nav-item {
		flex: 1;
		padding: 0.75rem 1rem;
		background: none;
		border: none;
		border-radius: var(--radius);
		cursor: pointer;
		font-weight: 500;
		transition: all 0.2s;
		color: var(--text-light);
	}

	.nav-item:hover {
		background: var(--bg-white);
		color: var(--text-dark);
	}

	.nav-item.active {
		background: var(--primary-color);
		color: var(--text-dark);
	}

	.alert {
		padding: 1rem;
		border-radius: var(--radius);
		margin-bottom: 1.5rem;
	}

	.alert-success {
		background: #d4edda;
		color: #155724;
		border: 1px solid #c3e6cb;
	}

	.alert-error {
		background: #f8d7da;
		color: #721c24;
		border: 1px solid #f5c6cb;
	}

	.form-section {
		background: var(--bg-white);
		border: 1px solid var(--border-color);
		border-radius: var(--radius);
		padding: 2rem;
		margin-bottom: 2rem;
	}

	.form-section h3 {
		margin: 0 0 1.5rem 0;
		font-size: 1.25rem;
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.5rem;
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
		color: var(--text-dark);
		font-size: 0.875rem;
	}

	.input {
		padding: 0.75rem;
		border: 1px solid var(--border-color);
		border-radius: var(--radius);
		font-size: 1rem;
		transition: border-color 0.2s;
	}

	.input:focus {
		outline: none;
		border-color: var(--primary-color);
	}

	.form-group small {
		color: var(--text-light);
		font-size: 0.75rem;
	}

	.logo-section {
		margin-top: 2rem;
		padding-top: 2rem;
		border-top: 1px solid var(--border-color);
	}

	.logo-section h4 {
		margin: 0 0 1rem 0;
	}

	.logo-upload {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.logo-preview {
		text-align: center;
	}

	.logo-preview img {
		max-width: 200px;
		max-height: 100px;
		object-fit: contain;
		border: 1px solid var(--border-color);
		border-radius: var(--radius);
		margin-bottom: 1rem;
	}

	.logo-placeholder {
		text-align: center;
		padding: 2rem;
		border: 2px dashed var(--border-color);
		border-radius: var(--radius);
		background: var(--bg-light);
	}

	.upload-label {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		background: var(--primary-color);
		color: var(--text-dark);
		border-radius: var(--radius);
		cursor: pointer;
		font-weight: 500;
		margin-bottom: 0.5rem;
	}

	.upload-label:hover {
		background: var(--primary-dark);
	}

	.btn-remove {
		background: #dc3545;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: var(--radius);
		cursor: pointer;
		font-size: 0.875rem;
	}

	.form-actions {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		padding-top: 2rem;
		border-top: 1px solid var(--border-color);
	}

	.btn {
		padding: 0.75rem 2rem;
		border-radius: var(--radius);
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.btn-primary {
		background: var(--primary-color);
		color: var(--text-dark);
		border: none;
	}

	.btn-primary:hover:not(:disabled) {
		background: var(--primary-dark);
	}

	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-secondary {
		background: var(--bg-white);
		color: var(--text-dark);
		border: 1px solid var(--border-color);
	}

	.btn-secondary:hover {
		background: var(--bg-light);
	}

	.spinner-small {
		width: 16px;
		height: 16px;
		border: 2px solid currentColor;
		border-top: 2px solid transparent;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Mobile Responsive */
	@media (max-width: 768px) {
		.form-grid {
			grid-template-columns: 1fr;
		}

		.section-nav {
			flex-direction: column;
		}

		.form-actions {
			flex-direction: column;
		}

		.form-section {
			padding: 1.5rem;
		}
	}
</style>
