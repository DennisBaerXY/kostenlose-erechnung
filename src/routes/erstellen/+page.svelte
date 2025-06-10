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

	import "./styles.css";

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
</style>
