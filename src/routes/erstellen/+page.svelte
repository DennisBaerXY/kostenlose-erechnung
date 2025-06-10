<!-- src/routes/erstellen/+page.svelte (CLEAN STORES VERSION) -->
<script>
	import { onMount } from "svelte";
	import {
		invoiceData,
		addInvoiceItem,
		removeInvoiceItem,
		updateInvoiceItem,
		generateInvoiceNumber,
		calculateDueDate
	} from "$lib/stores/invoice.js";
	import { getInvoiceCount, incrementInvoiceCount } from "$lib/stores/auth.js";
	import { downloadXRechnung } from "$lib/utils/invoice-generator.js";
	import { validateStep } from "$lib/utils/invoice-validation.js";

	// Store imports
	import {
		currentStep,
		uiState,
		premiumState,
		canGoNext,
		canGoPrev,
		wizardActions,
		uiActions,
		premiumActions,
		WIZARD_STEPS
	} from "$lib/utils/wizard-state.js";

	// Components
	import WizardContainer from "$lib/components/wizard/WizardContainer.svelte";
	import InvoicePreview from "$lib/components/InvoicePreview.svelte";
	import XmlViewer from "$lib/components/XmlViewer.svelte";
	import RegistrationModal from "$lib/components/RegistrationModal.svelte";

	import "./styles.css";

	// Constants
	const LIMITS = {
		free: { logoUpload: false, invoicesPerMonth: 5 },
		premium: { logoUpload: true, invoicesPerMonth: Infinity }
	};

	let lastCreatedInvoice = null;

	// Reactive values using stores
	$: canUploadLogo = LIMITS[$premiumState.userTier]?.logoUpload || false;
	$: isFormValid = $uiState.validationErrors.length === 0;

	// Only validate when the step changes

	function validateCurrentStep() {
		const validation = validateStep($currentStep, $invoiceData);
		uiActions.setValidationErrors(validation.errors);
	}
	// Initialize data on mount
	onMount(() => {
		// Auto-generate invoice number if empty
		if (!$invoiceData.metadata.invoiceNumber) {
			const newNumber = generateInvoiceNumber();
			invoiceData.update((data) => ({
				...data,
				metadata: {
					...data.metadata,
					invoiceNumber: newNumber
				}
			}));
		}

		// Ensure at least one item exists
		if ($invoiceData.items.length === 0) {
			addInvoiceItem();
		}

		// Update premium state
		premiumState.update((state) => ({
			...state,
			monthlyInvoices: getInvoiceCount()
		}));
	});

	// Data update handlers - CORRECT Store Updates
	function handleUpdateSender(event) {
		const { field, value } = event.detail;
		invoiceData.update((data) => ({
			...data,
			sender: {
				...data.sender,
				[field]: value
			}
		}));
	}

	function handleUpdateRecipient(event) {
		const { field, value } = event.detail;
		invoiceData.update((data) => ({
			...data,
			recipient: {
				...data.recipient,
				[field]: value
			}
		}));
	}

	function handleUpdateMetadata(event) {
		const { field, value } = event.detail;
		invoiceData.update((data) => ({
			...data,
			metadata: {
				...data.metadata,
				[field]: value
			}
		}));

		// Auto-calculate due date
		if (field === "date" || field === "paymentTerms") {
			const dueDate = calculateDueDate(
				field === "date" ? value : $invoiceData.metadata.date,
				field === "paymentTerms" ? value : $invoiceData.metadata.paymentTerms
			);
			if (dueDate) {
				invoiceData.update((data) => ({
					...data,
					metadata: {
						...data.metadata,
						dueDate
					}
				}));
			}
		}
	}

	function handleUpdateItems(event) {
		const { type, index, field, value } = event.detail;

		switch (type) {
			case "updateItem":
				if ($invoiceData.items[index]) {
					updateInvoiceItem($invoiceData.items[index].id, { [field]: value });
				}
				break;
			case "addItem":
				addInvoiceItem();
				break;
			case "removeItem":
				if ($invoiceData.items[index]) {
					removeInvoiceItem($invoiceData.items[index].id);
				}
				break;
		}
	}

	// Download handler
	async function handleDownload(event) {
		const { format } = event.detail;

		// Check limits
		const currentCount = getInvoiceCount();
		if (currentCount >= 5 && $premiumState.userTier !== "premium") {
			premiumActions.showPremiumUpgrade("Mehr als 5 Rechnungen pro Monat");
			return;
		}

		if (!isFormValid) {
			alert(
				"Bitte füllen Sie alle Pflichtfelder aus:\n\n" +
					$uiState.validationErrors.join("\n")
			);
			return;
		}

		try {
			uiActions.setDownloading(true);
			await new Promise((resolve) => setTimeout(resolve, 500));

			const result = downloadXRechnung($invoiceData, format);

			if (result.success) {
				incrementInvoiceCount();
				premiumState.update((state) => ({
					...state,
					monthlyInvoices: state.monthlyInvoices + 1
				}));

				lastCreatedInvoice = {
					id: crypto.randomUUID(),
					data: JSON.parse(JSON.stringify($invoiceData)),
					createdAt: new Date().toISOString(),
					filename: result.filename
				};

				uiActions.setShowSuccess(true);

				setTimeout(() => {
					uiActions.setShowSuccess(false);
					if (!globalThis.$currentUser) {
						uiState.update((state) => ({
							...state,
							showRegistrationModal: true
						}));
					}
				}, 2000);
			}
		} catch (error) {
			console.error("Download error:", error);
			alert("Fehler beim Erstellen der E-Rechnung: " + error.message);
		} finally {
			uiActions.setDownloading(false);
		}
	}

	// Event handlers for wizard
	function handleGoToStep(event) {
		wizardActions.goToStep(event.detail.step);
	}

	function handleNextStep() {
		validateCurrentStep();

		wizardActions.nextStep();
	}

	function handlePrevStep() {
		wizardActions.prevStep();
	}

	function handlePremiumUpgrade(event) {
		premiumActions.showPremiumUpgrade(event.detail);
	}
</script>

<svelte:head>
	<title>E-Rechnung erstellen | XRechnung & ZUGFeRD Generator</title>
	<meta
		name="description"
		content="Erstellen Sie gesetzeskonforme E-Rechnungen im XRechnung- und ZUGFeRD-Format. Einfach, schnell und kostenlos."
	/>
</svelte:head>

<!-- Premium Modal -->
{#if $uiState.showPremiumModal}
	<div class="modal-overlay" on:click={premiumActions.hidePremiumModal}>
		<div class="modal" on:click|stopPropagation>
			<div class="modal-header">
				<h3>🚀 Premium Feature</h3>
				<button class="modal-close" on:click={premiumActions.hidePremiumModal}
					>✕</button
				>
			</div>
			<div class="modal-content">
				<div class="premium-icon">⭐</div>
				<h4>{$premiumState.premiumFeature}</h4>
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
					on:click={premiumActions.hidePremiumModal}
				>
					Später
				</button>
				<button class="btn btn-primary">🚀 Premium werden</button>
			</div>
		</div>
	</div>
{/if}

<!-- Registration Modal -->
{#if $uiState.showRegistrationModal}
	<RegistrationModal
		invoiceData={$invoiceData}
		{lastCreatedInvoice}
		bind:show={$uiState.showRegistrationModal}
	/>
{/if}

<!-- Success Banner -->
{#if $uiState.showSuccess}
	<div class="success-banner">
		<span class="success-icon">✅</span>
		<span>E-Rechnung wurde erfolgreich heruntergeladen!</span>
	</div>
{/if}

<!-- Error Banner -->
{#if $uiState.validationErrors.length > 0}
	<div class="error-banner">
		<span class="error-icon">⚠️</span>
		<div>
			<strong>Fehlende Pflichtfelder:</strong>
			<ul>
				{#each $uiState.validationErrors.slice(0, 3) as error}
					<li>{error}</li>
				{/each}
				{#if $uiState.validationErrors.length > 3}
					<li>...und {$uiState.validationErrors.length - 3} weitere</li>
				{/if}
			</ul>
		</div>
	</div>
{/if}

<!-- Main Layout -->
<div class="creator-container">
	<WizardContainer
		currentStep={$currentStep}
		invoiceData={$invoiceData}
		{canUploadLogo}
		selectedFormat={$uiState.selectedFormat}
		isDownloading={$uiState.isDownloading}
		{isFormValid}
		userTier={$premiumState.userTier}
		monthlyInvoices={$premiumState.monthlyInvoices}
		canGoNext={$canGoNext}
		canGoPrev={$canGoPrev}
		on:goToStep={handleGoToStep}
		on:nextStep={handleNextStep}
		on:prevStep={handlePrevStep}
		on:updateSender={handleUpdateSender}
		on:updateRecipient={handleUpdateRecipient}
		on:updateMetadata={handleUpdateMetadata}
		on:updateItems={handleUpdateItems}
		on:download={handleDownload}
		on:premiumUpgrade={handlePremiumUpgrade}
	/>

	<!-- Preview Section -->
	<div class="preview-section">
		<div class="preview-header">
			<h3>Live-Vorschau</h3>
			<div class="preview-toggle">
				<button
					class:active={!$uiState.showXml}
					on:click={() => uiActions.toggleXmlView()}
				>
					📄 PDF
				</button>
				<button
					class:active={$uiState.showXml}
					on:click={() => uiActions.toggleXmlView()}
				>
					📝 XML
				</button>
			</div>
		</div>

		<div class="preview-content">
			{#if $uiState.showXml}
				<XmlViewer data={$invoiceData} />
			{:else}
				<InvoicePreview data={$invoiceData} />
			{/if}
		</div>
	</div>
</div>
