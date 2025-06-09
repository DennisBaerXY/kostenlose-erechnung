<!-- src/routes/erstellen/+page.svelte - Original Styling + Alle Funktionen + Premium Features -->
<script>
	import { onMount } from "svelte";
	import {
		invoiceData,
		addInvoiceItem,
		removeInvoiceItem,
		updateInvoiceItem
	} from "$lib/stores/invoice.js";
	import {
		generateXRechnung,
		downloadXRechnung,
		validateXRechnungData
	} from "$lib/utils/invoice-generator.js";

	import { getInvoiceCount, incrementInvoiceCount } from "$lib/stores/auth.js";

	import InvoicePreview from "$lib/components/InvoicePreview.svelte";
	import XmlViewer from "$lib/components/XmlViewer.svelte";
	import RegistrationModal from "$lib/components/RegistrationModal.svelte";

	let showXml = false;
	let validationErrors = [];
	let isDownloading = false;
	let showSuccess = false;
	let userTier = "premium"; // 'free' | 'premium'
	let monthlyInvoices = 3; // Aktueller Verbrauch
	let showPremiumModal = false;
	let premiumFeature = "";
	let selectedFormat = "CII";
	let lastCreatedInvoice = null;
	let showRegistrationModal = false;

	// Freemium Limits
	const LIMITS = {
		free: {
			invoicesPerMonth: 5,
			logoUpload: false,
			templates: false,
			customers: false
		},
		premium: {
			invoicesPerMonth: Infinity,
			logoUpload: true,
			templates: true,
			customers: true
		}
	};

	const steps = [
		{ id: 1, name: "Kontaktinformationen", icon: "👤" },
		{ id: 2, name: "Empfänger", icon: "📮" },
		{ id: 3, name: "Rechnungsdetails", icon: "📄" },
		{ id: 4, name: "Positionen", icon: "📋" },
		{ id: 5, name: "Abschluss", icon: "✓" }
	];

	let currentStep = 1;
	$: totalSteps = steps.length;

	// XRechnung-konforme Standardwerte setzen
	onMount(() => {
		$invoiceData.metadata.customizationId =
			"urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0";
		$invoiceData.metadata.profileId =
			"urn:fdc:peppol.eu:2017:poacc:billing:01:1.0";
		$invoiceData.metadata.invoiceTypeCode = "380";
		$invoiceData.metadata.currency = "EUR";

		// Auto-generiere Rechnungsnummer wenn leer
		if (!$invoiceData.metadata.invoiceNumber) {
			generateInvoiceNumber();
		}

		// Stelle sicher, dass mindestens ein Item existiert
		if ($invoiceData.items.length === 0) {
			addInvoiceItem();
		}
	});

	function nextStep() {
		if (currentStep < totalSteps) {
			currentStep += 1;
		}
	}

	function prevStep() {
		if (currentStep > 1) {
			currentStep -= 1;
		}
	}

	function goToStep(step) {
		currentStep = step;
	}

	// Form handlers mit Validierung
	function updateSender(field, value) {
		$invoiceData.sender[field] = value;
	}

	function updateRecipient(field, value) {
		$invoiceData.recipient[field] = value;
	}

	function updateMetadata(field, value) {
		$invoiceData.metadata[field] = value;
		if (field === "date" || field === "paymentTerms") {
			calculateDueDate();
		}
	}

	function generateInvoiceNumber() {
		const year = new Date().getFullYear();
		const month = String(new Date().getMonth() + 1).padStart(2, "0");
		const day = String(new Date().getDate()).padStart(2, "0");
		const time = Date.now().toString().slice(-4);
		updateMetadata("invoiceNumber", `${year}${month}${day}-${time}`);
	}

	function calculateDueDate() {
		if ($invoiceData.metadata.date && $invoiceData.metadata.paymentTerms) {
			const issueDate = new Date($invoiceData.metadata.date);
			let days = 30;

			if ($invoiceData.metadata.paymentTerms === "net14") days = 14;
			if ($invoiceData.metadata.paymentTerms === "net30") days = 30;
			if ($invoiceData.metadata.paymentTerms === "immediate") days = 0;

			const dueDate = new Date(issueDate);
			dueDate.setDate(dueDate.getDate() + days);
			updateMetadata("dueDate", dueDate.toISOString().split("T")[0]);
		}
	}

	function validateForm() {
		const validation = validateXRechnungData($invoiceData);
		validationErrors = validation.errors;
		return validation.isValid;
	}

	function addItem() {
		addInvoiceItem();
	}

	function removeItem(index) {
		const items = $invoiceData.items;
		if (items.length > index) {
			removeInvoiceItem(items[index].id);
		}
	}

	function updateItem(index, field, value) {
		const items = $invoiceData.items;
		if (items.length > index) {
			updateInvoiceItem(items[index].id, { [field]: value });
		}
	}

	// Premium Features
	function handleLogoUpload() {
		if (!LIMITS[userTier].logoUpload) {
			showPremiumUpgrade("Logo Upload");
			return;
		}
		// Logo Upload Logic hier
		const input = document.createElement("input");
		input.type = "file";
		input.accept = "image/*";
		input.onchange = (e) => {
			const file = e.target.files[0];
			if (file) {
				// File zu Base64 konvertieren und in Store speichern
				const reader = new FileReader();
				reader.onload = (e) => {
					$invoiceData.sender.logo = e.target.result;
				};
				reader.readAsDataURL(file);
			}
		};
		input.click();
	}

	function showPremiumUpgrade(feature) {
		premiumFeature = feature;
		showPremiumModal = true;
	}

	function checkInvoiceLimit() {
		if (
			userTier === "free" &&
			monthlyInvoices >= LIMITS.free.invoicesPerMonth
		) {
			showPremiumUpgrade("Mehr als 5 Rechnungen pro Monat");
			return false;
		}
		return true;
	}

	async function handleDownload(format = "CII") {
		// Check limit only at download time
		const currentCount = getInvoiceCount();
		// if (currentCount >= 5 && !globalThis.$currentUser?.premium) {
		// 	showLimitReachedModal = true;
		// 	return;
		// }

		if (!validateForm()) {
			alert(
				"Bitte füllen Sie alle Pflichtfelder aus:\n\n" +
					validationErrors.join("\n")
			);
			return;
		}

		try {
			isDownloading = true;
			await new Promise((resolve) => setTimeout(resolve, 500));

			const result = downloadXRechnung($invoiceData, format);

			if (result.success) {
				// Increment counter AFTER successful download
				incrementInvoiceCount();

				// Store invoice data for potential registration
				lastCreatedInvoice = {
					id: crypto.randomUUID(),
					data: { ...$invoiceData },
					createdAt: new Date().toISOString(),
					filename: result.filename
				};

				// Show success briefly
				showSuccess = true;
				// if (!globalThis.$currentUser?.premium) {
				// 	showPremiumModal = true;
				// }

				setTimeout(() => {
					showSuccess = false;
					// Show registration modal after success message

					if (!globalThis.$currentUser) {
						showRegistrationModal = true;
					}
				}, 2000);
			}
		} catch (error) {
			console.error("Download error:", error);
			alert("Fehler beim Erstellen der E-Rechnung: " + error.message);
		} finally {
			isDownloading = false;
		}
	}

	// Berechnungen für Live-Vorschau
	$: subtotal = $invoiceData.items.reduce(
		(sum, item) => sum + item.quantity * item.unitPrice,
		0
	);

	$: taxAmount = $invoiceData.items.reduce(
		(sum, item) => sum + (item.quantity * item.unitPrice * item.taxRate) / 100,
		0
	);

	$: total = subtotal + taxAmount;
	$: isFormValid = validationErrors.length === 0;
</script>

<svelte:head>
	<title>E-Rechnung erstellen | XRechnung & ZUGFeRD Generator</title>
	<meta
		name="description"
		content="Erstellen Sie gesetzeskonforme E-Rechnungen im XRechnung- und ZUGFeRD-Format. Einfach, schnell und kostenlos."
	/>
</svelte:head>

<!-- Premium Upgrade Modal -->
{#if showPremiumModal}
	<div class="modal-overlay" on:click={() => (showPremiumModal = false)}>
		<div class="modal" on:click|stopPropagation>
			<div class="modal-header">
				<h3>🚀 Premium Feature</h3>
				<button class="modal-close" on:click={() => (showPremiumModal = false)}
					>✕</button
				>
			</div>

			<div class="modal-content">
				<div class="premium-icon">⭐</div>
				<h4>{premiumFeature}</h4>
				<p>Dieses Feature ist nur für Premium-Nutzer verfügbar.</p>

				<div class="premium-benefits">
					<div class="benefit">✅ Unbegrenzte E-Rechnungen</div>
					<div class="benefit">✅ Logo-Upload</div>
					<div class="benefit">✅ Rechnungsvorlagen</div>
					<div class="benefit">✅ Kundenverwaltung</div>
					<div class="benefit">✅ Prioritäts-Support</div>
				</div>

				<div class="premium-price">
					<span class="price">9,99€</span>
					<span class="period">pro Monat</span>
				</div>
			</div>

			<div class="modal-actions">
				<button
					class="btn btn-secondary"
					on:click={() => (showPremiumModal = false)}
				>
					Später
				</button>
				<button class="btn btn-primary"> 🚀 Premium werden </button>
			</div>
		</div>
	</div>
{/if}

{#if showRegistrationModal}
	<RegistrationModal
		invoiceData={$invoiceData}
		{lastCreatedInvoice}
		bind:show={showRegistrationModal}
	/>
{/if}
<!-- Success/Error Messages -->
{#if showSuccess}
	<div class="success-banner">
		<span class="success-icon">✅</span>
		<span>E-Rechnung wurde erfolgreich heruntergeladen!</span>
	</div>
{/if}

{#if validationErrors.length > 0}
	<div class="error-banner">
		<span class="error-icon">⚠️</span>
		<div>
			<strong>Fehlende Pflichtfelder:</strong>
			<ul>
				{#each validationErrors.slice(0, 3) as error}
					<li>{error}</li>
				{/each}
				{#if validationErrors.length > 3}
					<li>...und {validationErrors.length - 3} weitere</li>
				{/if}
			</ul>
		</div>
	</div>
{/if}

<div class="creator-container">
	<div class="wizard-section">
		<div class="wizard-header">
			<h1>E-Rechnung erstellen</h1>
			<div class="steps-indicator">
				{#each steps as step}
					<button
						class="step-item"
						class:active={currentStep === step.id}
						class:completed={currentStep > step.id}
						on:click={() => goToStep(step.id)}
						disabled={step.id > currentStep}
					>
						<span class="step-icon">{step.icon}</span>
						<span class="step-name">{step.name}</span>
					</button>
				{/each}
			</div>
		</div>

		<div class="wizard-content">
			{#if currentStep === 1}
				<div class="form-section">
					<h2>Ihre Angaben</h2>
					<p class="form-description">
						Geben Sie Ihre Kontaktinformationen ein
					</p>

					<div class="form-grid">
						<div class="form-group half">
							<label for="sender-name">Firmenname *</label>
							<input
								id="sender-name"
								type="text"
								value={$invoiceData.sender.name}
								on:input={(e) => updateSender("name", e.target.value)}
								placeholder="Mustermann GmbH"
								required
							/>
						</div>
						<div class="form-group half">
							<label for="sender-contact-name">Kontaktname *</label>
							<input
								id="sender-contact-name"
								type="text"
								value={$invoiceData.sender.contactName}
								on:input={(e) => updateSender("contactName", e.target.value)}
								placeholder="Friedrich Muster"
								required
							/>
						</div>

						<!-- Premium: Logo Upload -->
						<div class="form-group full">
							<label
								>Firmenlogo {#if !LIMITS[userTier].logoUpload}<span
										class="premium-label">⭐ Premium</span
									>{/if}</label
							>
							<div class="logo-upload-section">
								{#if $invoiceData.sender.logo}
									<div class="logo-preview">
										<img src={$invoiceData.sender.logo} alt="Firmenlogo" />
										<button
											class="btn-remove-logo"
											on:click={() => ($invoiceData.sender.logo = null)}
										>
											✕ Entfernen
										</button>
									</div>
								{:else}
									<button
										class="btn btn-secondary logo-upload-btn"
										on:click={handleLogoUpload}
										disabled={!LIMITS[userTier].logoUpload}
									>
										📁 Logo hochladen
									</button>
									{#if !LIMITS[userTier].logoUpload}
										<small class="premium-hint"
											>Professionelle Rechnungen mit eigenem Logo - nur mit
											Premium</small
										>
									{/if}
								{/if}
							</div>
						</div>

						<div class="form-group">
							<label for="sender-street">Straße und Hausnummer *</label>
							<input
								id="sender-street"
								type="text"
								value={$invoiceData.sender.street}
								on:input={(e) => updateSender("street", e.target.value)}
								placeholder="Musterstraße 123"
								required
							/>
						</div>

						<div class="form-group half">
							<label for="sender-zip">Postleitzahl *</label>
							<input
								id="sender-zip"
								type="text"
								value={$invoiceData.sender.zip}
								on:input={(e) => updateSender("zip", e.target.value)}
								placeholder="12345"
								required
							/>
						</div>

						<div class="form-group half">
							<label for="sender-city">Ort *</label>
							<input
								id="sender-city"
								type="text"
								value={$invoiceData.sender.city}
								on:input={(e) => updateSender("city", e.target.value)}
								placeholder="Musterstadt"
								required
							/>
						</div>

						<div class="form-group">
							<label for="sender-email">E-Mail-Adresse</label>
							<input
								id="sender-email"
								type="email"
								value={$invoiceData.sender.email}
								on:input={(e) => updateSender("email", e.target.value)}
								placeholder="info@mustermann.de"
							/>
						</div>

						<div class="form-group">
							<label for="sender-phone">Telefonnummer</label>
							<input
								id="sender-phone"
								type="tel"
								value={$invoiceData.sender.phone}
								on:input={(e) => updateSender("phone", e.target.value)}
								placeholder="+49 123 456789"
							/>
						</div>

						<div class="form-group">
							<label for="sender-taxid">Steuernummer *</label>
							<input
								id="sender-taxid"
								type="text"
								value={$invoiceData.sender.taxId}
								on:input={(e) => updateSender("taxId", e.target.value)}
								placeholder="12/345/67890"
								required
							/>
							<small>Erforderlich oder USt-IdNr.</small>
						</div>

						<div class="form-group">
							<label for="sender-ustid">USt-IdNr. (optional)</label>
							<input
								id="sender-ustid"
								type="text"
								value={$invoiceData.sender.ustId}
								on:input={(e) => updateSender("ustId", e.target.value)}
								placeholder="DE123456789"
							/>
						</div>
					</div>
				</div>
			{/if}

			{#if currentStep === 2}
				<div class="form-section">
					<h2>Empfänger</h2>
					<p class="form-description">
						Kontaktinformationen des Rechnungsempfängers
					</p>

					<div class="form-grid">
						<div class="form-group full">
							<label for="recipient-name">Firmenname / Name *</label>
							<input
								id="recipient-name"
								type="text"
								value={$invoiceData.recipient.name}
								on:input={(e) => updateRecipient("name", e.target.value)}
								placeholder="Kunde GmbH"
								required
							/>
						</div>

						<div class="form-group">
							<label for="recipient-street">Straße und Hausnummer *</label>
							<input
								id="recipient-street"
								type="text"
								value={$invoiceData.recipient.street}
								on:input={(e) => updateRecipient("street", e.target.value)}
								placeholder="Kundenstraße 456"
								required
							/>
						</div>

						<div class="form-group half">
							<label for="recipient-zip">Postleitzahl *</label>
							<input
								id="recipient-zip"
								type="text"
								value={$invoiceData.recipient.zip}
								on:input={(e) => updateRecipient("zip", e.target.value)}
								placeholder="54321"
								required
							/>
						</div>

						<div class="form-group half">
							<label for="recipient-city">Ort *</label>
							<input
								id="recipient-city"
								type="text"
								value={$invoiceData.recipient.city}
								on:input={(e) => updateRecipient("city", e.target.value)}
								placeholder="Kundenstadt"
								required
							/>
						</div>

						<div class="form-group">
							<label for="recipient-email">E-Mail-Adresse</label>
							<input
								id="recipient-email"
								type="email"
								value={$invoiceData.recipient.email}
								on:input={(e) => updateRecipient("email", e.target.value)}
								placeholder="kontakt@kunde.de"
							/>
						</div>

						<div class="form-group">
							<label for="recipient-reference">Ihre Referenz (optional)</label>
							<input
								id="recipient-reference"
								type="text"
								value={$invoiceData.recipient.reference}
								on:input={(e) => updateRecipient("reference", e.target.value)}
								placeholder="Bestellnummer, Projektnummer, etc."
							/>
						</div>
					</div>
				</div>
			{/if}

			{#if currentStep === 3}
				<div class="form-section">
					<h2>Rechnungsdetails</h2>
					<p class="form-description">Allgemeine Informationen zur Rechnung</p>

					<div class="form-grid">
						<div class="form-group">
							<label for="invoice-number">Rechnungsnummer *</label>
							<div class="input-with-button">
								<input
									id="invoice-number"
									type="text"
									value={$invoiceData.metadata.invoiceNumber}
									on:input={(e) =>
										updateMetadata("invoiceNumber", e.target.value)}
									placeholder="2025-001"
									required
								/>
								<button
									type="button"
									class="btn-generate"
									on:click={generateInvoiceNumber}
									title="Automatisch generieren"
								>
									🎲
								</button>
							</div>
						</div>

						<div class="form-group">
							<label for="invoice-date">Rechnungsdatum *</label>
							<input
								id="invoice-date"
								type="date"
								value={$invoiceData.metadata.date}
								on:input={(e) => updateMetadata("date", e.target.value)}
								required
							/>
						</div>

						<div class="form-group">
							<label for="delivery-date">Lieferdatum</label>
							<input
								id="delivery-date"
								type="date"
								value={$invoiceData.metadata.deliveryDate}
								on:input={(e) => updateMetadata("deliveryDate", e.target.value)}
							/>
						</div>

						<div class="form-group">
							<label for="due-date">Fälligkeitsdatum</label>
							<input
								id="due-date"
								type="date"
								value={$invoiceData.metadata.dueDate}
								on:input={(e) => updateMetadata("dueDate", e.target.value)}
								readonly
								class="readonly"
							/>
						</div>

						<div class="form-group full">
							<label for="payment-terms">Zahlungsbedingungen</label>
							<select
								id="payment-terms"
								value={$invoiceData.metadata.paymentTerms}
								on:change={(e) =>
									updateMetadata("paymentTerms", e.target.value)}
							>
								<option value="net14">Zahlbar innerhalb 14 Tagen</option>
								<option value="net30">Zahlbar innerhalb 30 Tagen</option>
								<option value="immediate">Zahlbar sofort</option>
								<option value="custom">Benutzerdefiniert</option>
							</select>
						</div>

						{#if $invoiceData.metadata.paymentTerms === "custom"}
							<div class="form-group full">
								<label for="custom-terms"
									>Benutzerdefinierte Zahlungsbedingungen</label
								>
								<textarea
									id="custom-terms"
									value={$invoiceData.metadata.customPaymentTerms}
									on:input={(e) =>
										updateMetadata("customPaymentTerms", e.target.value)}
									placeholder="Geben Sie Ihre Zahlungsbedingungen ein..."
									rows="3"
								></textarea>
							</div>
						{/if}
					</div>
				</div>
			{/if}

			{#if currentStep === 4}
				<div class="form-section">
					<h2>Rechnungspositionen</h2>
					<p class="form-description">
						Fügen Sie die einzelnen Leistungen oder Produkte hinzu
					</p>

					<div class="items-list">
						{#each $invoiceData.items as item, index}
							<div class="item-row">
								<div class="item-header">
									<h4>Position {index + 1}</h4>
									{#if $invoiceData.items.length > 1}
										<button
											class="btn-remove"
											on:click={() => removeItem(index)}
											aria-label="Position entfernen"
										>
											✕
										</button>
									{/if}
								</div>

								<div class="item-grid">
									<div class="form-group full">
										<label>Beschreibung *</label>
										<input
											type="text"
											value={item.description}
											on:input={(e) =>
												updateItem(index, "description", e.target.value)}
											placeholder="Beratung, Website-Entwicklung, etc."
											required
										/>
									</div>

									<div class="form-group">
										<label>Menge *</label>
										<input
											type="number"
											value={item.quantity}
											on:input={(e) =>
												updateItem(
													index,
													"quantity",
													parseFloat(e.target.value) || 0
												)}
											min="0"
											step="0.01"
											required
										/>
									</div>

									<div class="form-group">
										<label>Einheit</label>
										<select
											value={item.unit}
											on:change={(e) =>
												updateItem(index, "unit", e.target.value)}
										>
											<option value="Stück">Stück</option>
											<option value="Stunden">Stunden</option>
											<option value="Tage">Tage</option>
											<option value="Pauschal">Pauschal</option>
											<option value="km">km</option>
											<option value="kg">kg</option>
											<option value="m²">m²</option>
										</select>
									</div>

									<div class="form-group">
										<label>Einzelpreis (€) *</label>
										<input
											type="number"
											value={item.unitPrice}
											on:input={(e) =>
												updateItem(
													index,
													"unitPrice",
													parseFloat(e.target.value) || 0
												)}
											min="0"
											step="0.01"
											required
										/>
									</div>

									<div class="form-group">
										<label>MwSt. (%)</label>
										<select
											value={item.taxRate}
											on:change={(e) =>
												updateItem(index, "taxRate", parseInt(e.target.value))}
										>
											<option value="0">0%</option>
											<option value="7">7%</option>
											<option value="19">19%</option>
										</select>
									</div>
								</div>

								<div class="item-total">
									Gesamt: {(item.quantity * item.unitPrice).toFixed(2)} €
								</div>
							</div>
						{/each}
					</div>

					<button class="btn btn-secondary add-item" on:click={addItem}>
						+ Position hinzufügen
					</button>

					<div class="totals">
						<div class="total-row">
							<span>Zwischensumme:</span>
							<span>{subtotal.toFixed(2)} €</span>
						</div>
						<div class="total-row">
							<span>MwSt.:</span>
							<span>{taxAmount.toFixed(2)} €</span>
						</div>
						<div class="total-row total">
							<span>Gesamtbetrag:</span>
							<span>{total.toFixed(2)} €</span>
						</div>
					</div>
				</div>
			{/if}

			{#if currentStep === 5}
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
									<span class="value"
										>{$invoiceData.metadata.invoiceNumber}</span
									>
								</div>
								<div class="summary-item">
									<span class="label">Datum:</span>
									<span class="value"
										>{new Date($invoiceData.metadata.date).toLocaleDateString(
											"de-DE"
										)}</span
									>
								</div>
								<div class="summary-item">
									<span class="label">Empfänger:</span>
									<span class="value">{$invoiceData.recipient.name}</span>
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
								on:click={() => handleDownload(selectedFormat)}
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
										💡 Noch {LIMITS.free.invoicesPerMonth - monthlyInvoices} kostenlose
										Downloads verfügbar
									</small>
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/if}
		</div>

		<div class="wizard-footer">
			<button
				class="btn btn-secondary"
				on:click={prevStep}
				disabled={currentStep === 1}
			>
				← Zurück
			</button>

			{#if currentStep < totalSteps}
				<button class="btn btn-primary" on:click={nextStep}> Weiter → </button>
			{/if}
		</div>
	</div>

	<div class="preview-section">
		<div class="preview-header">
			<h3>Live-Vorschau</h3>
			<div class="preview-toggle">
				<button class:active={!showXml} on:click={() => (showXml = false)}>
					📄 PDF
				</button>
				<button class:active={showXml} on:click={() => (showXml = true)}>
					📝 XML
				</button>
			</div>
		</div>

		<div class="preview-content">
			{#if showXml}
				<XmlViewer data={$invoiceData} />
			{:else}
				<InvoicePreview data={$invoiceData} />
			{/if}
		</div>
	</div>
</div>

<style>
	.creator-container {
		display: grid;
		grid-template-columns: 1fr 1fr;
		min-height: calc(100vh - 80px);

		margin: 0 auto;
	}

	/* FREEMIUM STATUS BAR */
	.freemium-bar {
		background: var(--bg-light);
		border-bottom: 1px solid var(--border-color);
		padding: 0.75rem 0;
	}

	.freemium-content {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	.usage-info {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex: 1;
	}

	.usage-text {
		font-size: 0.875rem;
		color: var(--text-light);
		white-space: nowrap;
	}

	.usage-bar {
		flex: 1;
		max-width: 200px;
		height: 6px;
		background: var(--border-color);
		border-radius: 3px;
		overflow: hidden;
	}

	.usage-fill {
		height: 100%;
		background: linear-gradient(90deg, var(--primary-color), #ff6b6b);
		transition: width 0.3s ease;
	}

	.premium-status {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.premium-badge {
		background: linear-gradient(45deg, #ffd700, #ffed4e);
		color: var(--text-dark);
		padding: 0.25rem 0.75rem;
		border-radius: 50px;
		font-size: 0.875rem;
		font-weight: 600;
	}

	.btn-small {
		font-size: 0.875rem;
		padding: 0.5rem 1rem;
	}

	/* PREMIUM MODAL */
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
		box-shadow: var(--shadow-lg);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 2rem 2rem 1rem;
		border-bottom: 1px solid var(--border-color);
	}

	.modal-header h3 {
		margin: 0;
		color: var(--text-dark);
	}

	.modal-close {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: var(--text-light);
		padding: 0.25rem;
	}

	.modal-content {
		padding: 2rem;
		text-align: center;
	}

	.premium-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.modal-content h4 {
		color: var(--text-dark);
		margin-bottom: 1rem;
	}

	.premium-benefits {
		background: var(--bg-light);
		padding: 1.5rem;
		border-radius: var(--radius);
		margin: 1.5rem 0;
		text-align: left;
	}

	.benefit {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
		font-size: 0.875rem;
	}

	.benefit:last-child {
		margin-bottom: 0;
	}

	.premium-price {
		display: flex;
		justify-content: center;
		align-items: baseline;
		gap: 0.5rem;
		margin: 1.5rem 0;
	}

	.price {
		font-size: 2rem;
		font-weight: 700;
		color: var(--primary-dark);
	}

	.period {
		color: var(--text-light);
	}

	.modal-actions {
		display: flex;
		gap: 1rem;
		padding: 1rem 2rem 2rem;
	}

	.modal-actions button {
		flex: 1;
	}

	/* SUCCESS/ERROR BANNERS */
	.success-banner,
	.error-banner {
		position: fixed;
		top: 100px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 100;
		padding: 1rem 2rem;
		border-radius: var(--radius);
		display: flex;
		align-items: center;
		gap: 1rem;
		box-shadow: var(--shadow-lg);
		animation: slideDown 0.3s ease;
	}

	.success-banner {
		background: #d4edda;
		color: #155724;
		border: 1px solid #c3e6cb;
	}

	.error-banner {
		background: #f8d7da;
		color: #721c24;
		border: 1px solid #f5c6cb;
	}

	.error-banner ul {
		margin: 0.5rem 0 0 0;
		padding-left: 1.5rem;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translate(-50%, -20px);
		}
		to {
			opacity: 1;
			transform: translate(-50%, 0);
		}
	}

	/* WIZARD SECTION */
	.wizard-section {
		background: var(--bg-white);
		overflow-y: auto;

		padding: 2rem;

		width: 100%;
		max-width: 800px;

		margin: 0 auto;
	}

	.wizard-header {
		margin-bottom: 2rem;
	}

	.wizard-header h1 {
		font-size: 2rem;
		margin-bottom: 1.5rem;
	}

	.steps-indicator {
		display: flex;
		gap: 1rem;
		margin-bottom: 2rem;
		flex-wrap: wrap;
	}

	.step-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border: 2px solid var(--border-color);
		border-radius: var(--radius);
		background: var(--bg-white);
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.step-item:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.step-item.active {
		border-color: var(--primary-color);
		background: var(--primary-light);
	}

	.step-item.completed {
		border-color: var(--primary-color);
		background: var(--primary-color);
	}

	.step-icon {
		font-size: 1.25rem;
	}

	.step-name {
		font-weight: 500;
	}

	.form-section h2 {
		font-size: 1.5rem;
		margin-bottom: 0.5rem;
	}

	.form-description {
		color: var(--text-light);
		margin-bottom: 2rem;
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

	.form-group.full {
		grid-column: 1 / -1;
	}

	.form-group.half {
		grid-column: span 1;
	}

	.form-group label {
		font-weight: 500;
		color: var(--text-dark);
	}

	.premium-label {
		color: #ffd700;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.form-group input,
	.form-group select,
	.form-group textarea {
		padding: 0.75rem;
		border: 1px solid var(--border-color);
		border-radius: var(--radius);
		font-size: 1rem;
		transition: border-color 0.3s ease;
	}

	.form-group input:focus,
	.form-group select:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: var(--primary-color);
	}

	.form-group input.readonly {
		background: var(--bg-light);
		cursor: not-allowed;
	}

	.form-group small {
		color: var(--text-light);
		font-size: 0.75rem;
	}

	.input-with-button {
		display: flex;
		gap: 0.5rem;
	}

	.input-with-button input {
		flex: 1;
	}

	.btn-generate {
		background: var(--primary-color);
		border: none;
		border-radius: var(--radius);
		padding: 0.75rem;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.btn-generate:hover {
		background: var(--primary-dark);
	}

	/* LOGO UPLOAD */
	.logo-upload-section {
		border: 2px dashed var(--border-color);
		border-radius: var(--radius);
		padding: 1.5rem;
		text-align: center;
		transition: all 0.3s ease;
	}

	.logo-upload-section:hover {
		border-color: var(--primary-color);
	}

	.logo-preview {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.logo-preview img {
		max-width: 200px;
		max-height: 100px;
		object-fit: contain;
		border-radius: var(--radius);
		box-shadow: var(--shadow);
	}

	.btn-remove-logo {
		background: #dc3545;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: var(--radius);
		cursor: pointer;
		font-size: 0.875rem;
	}

	.logo-upload-btn {
		padding: 1rem 2rem;
	}

	.logo-upload-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.premium-hint {
		color: #ffd700;
		font-style: italic;
		margin-top: 0.5rem;
	}

	.items-list {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.item-row {
		background: var(--bg-light);
		padding: 1.5rem;
		border-radius: var(--radius);
	}

	.item-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.item-header h4 {
		margin: 0;
	}

	.btn-remove {
		background: none;
		border: none;
		color: var(--text-light);
		cursor: pointer;
		font-size: 1.25rem;
		padding: 0.25rem;
		transition: color 0.3s ease;
	}

	.btn-remove:hover {
		color: #e74c3c;
	}

	.item-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1rem;
	}

	.item-total {
		text-align: right;
		font-weight: 600;
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--border-color);
	}

	.add-item {
		width: 100%;
		margin-bottom: 2rem;
	}

	.totals {
		background: var(--bg-light);
		padding: 1.5rem;
		border-radius: var(--radius);
	}

	.total-row {
		display: flex;
		justify-content: space-between;
		padding: 0.5rem 0;
	}

	.total-row.total {
		font-size: 1.25rem;
		font-weight: 700;
		border-top: 2px solid var(--border-color);
		padding-top: 1rem;
		margin-top: 0.5rem;
	}

	.summary {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.summary-section {
		background: var(--bg-light);
		padding: 1.5rem;
		border-radius: var(--radius);
	}

	.summary-section h3 {
		font-size: 1.25rem;
		margin-bottom: 1rem;
	}

	.summary-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	.summary-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.summary-item .label {
		font-size: 0.875rem;
		color: var(--text-light);
	}

	.summary-item .value {
		font-weight: 600;
	}

	.summary-item .value.highlight {
		color: var(--primary-dark);
		font-size: 1.25rem;
	}

	.download-section h3 {
		font-size: 1.25rem;
		margin-bottom: 1rem;
	}

	.format-download-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}
	.format-options {
		display: flex;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.format-option {
		flex: 1;
		cursor: pointer;
	}

	.format-option input {
		display: none;
	}

	.format-content {
		display: flex;
		flex-direction: column;
		padding: 1rem;
		border: 2px solid var(--border-color);
		border-radius: var(--radius);
		transition: all 0.3s ease;
	}

	.format-option input:checked + .format-content {
		border-color: var(--primary-color);
		background: var(--primary-light);
	}

	.format-name {
		font-weight: 600;
		margin-bottom: 0.25rem;
	}

	.format-desc {
		font-size: 0.875rem;
		color: var(--text-light);
	}

	.btn-download {
		width: 100%;
		font-size: 1.125rem;
		padding: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.btn-download:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid currentColor;
		border-top: 2px solid transparent;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	.download-limit-info {
		text-align: center;
		margin-top: 1rem;
		padding: 0.75rem;
		background: var(--bg-light);
		border-radius: var(--radius);
	}

	.wizard-footer {
		display: flex;
		justify-content: space-between;
		margin-top: 2rem;
		padding-top: 2rem;
		border-top: 1px solid var(--border-color);
	}

	.preview-section {
		background: var(--bg-light);
		border-left: 1px solid var(--border-color);
		display: flex;
		flex-direction: column;
	}

	.preview-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem 2rem;
		background: var(--bg-white);
		border-bottom: 1px solid var(--border-color);
	}

	.preview-header h3 {
		margin: 0;
	}

	.preview-toggle {
		display: flex;
		gap: 0.5rem;
	}

	.preview-toggle button {
		padding: 0.5rem 1rem;
		border: 1px solid var(--border-color);
		background: var(--bg-white);
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.preview-toggle button:first-child {
		border-radius: var(--radius) 0 0 var(--radius);
	}

	.preview-toggle button:last-child {
		border-radius: 0 var(--radius) var(--radius) 0;
		border-left: none;
	}

	.preview-toggle button.active {
		background: var(--primary-color);
		color: var(--text-dark);
		border-color: var(--primary-color);
	}

	.preview-content {
		flex: 1;
		overflow-y: auto;
		padding: 2rem;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 1200px) {
		.creator-container {
			grid-template-columns: 1fr 750px;
		}
	}

	@media (max-width: 968px) {
		.creator-container {
			grid-template-columns: 1fr;
		}

		.preview-section {
			display: none;
		}

		.form-grid {
			grid-template-columns: 1fr;
		}

		.form-group.half {
			grid-column: span 1;
		}

		.freemium-content {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.usage-info {
			width: 100%;
		}
	}
</style>
