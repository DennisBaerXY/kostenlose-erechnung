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
	import PremiumModal from "$lib/components/PremiumModal.svelte";

	import "./styles.css";
	import { goto } from "$app/navigation";

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
		isFormValid = validation.isValid;
	}

	function incrementInvoiceCount() {
		premiumState.update((state) => ({
			...state,
			monthlyInvoices: (state.monthlyInvoices || 0) + 1
		}));
	}
	// Initialize data on mount
	onMount(() => {
		wizardActions.resetWizard();

		uiState.update((state) => ({
			...state,
			showXml: false,
			showSuccess: false,
			showRegistrationModal: false,
			showPremiumModal: false,
			validationErrors: []
		}));

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
		console.log("handleUpdateItems", type, index, field, value);
		switch (type) {
			case "updateItem":
				if ($invoiceData.items[index]) {
					// Ensure tax rate is a number
					const processedValue = field === "taxRate" ? Number(value) : value;
					updateInvoiceItem($invoiceData.items[index].id, {
						[field]: processedValue
					});
				}
				validateCurrentStep();
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

		if (!isFormValid) {
			alert(
				"Bitte füllen Sie alle Pflichtfelder aus:\n\n" +
					$uiState.validationErrors.join("\n")
			);
			return;
		}

		try {
			uiActions.setDownloading(true);

			const result = await downloadXRechnung($invoiceData);

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
		console.log("handleGoToStep");
		wizardActions.goToStep(event.detail.step);
	}

	function handleNextStep() {
		validateCurrentStep();
		if (!isFormValid) {
			console.log("Form is not valid, cannot proceed to next step");
			return;
		}

		console.log("Navigating to next step");
		wizardActions.nextStep();
	}

	function handlePrevStep() {
		validateCurrentStep();
		if (!isFormValid) {
			console.log("Form is not valid, cannot proceed to next step");
			return;
		}
		console.log("Navigating to previous step");
		wizardActions.prevStep();
	}

	function handlePremiumUpgrade(event) {
		premiumActions.showPremiumUpgrade(event.detail);
		goto("/preise");
	}
	function handleClose(event) {
		uiState.update((state) => ({
			...state,
			showPremiumModal: false,
			showRegistrationModal: false
		}));
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
	<PremiumModal
		featureName={$uiState.premiumFeatureName}
		bind:show={$uiState.showPremiumModal}
		on:upgrade={handlePremiumUpgrade}
		on:close={handleClose}
	/>
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
