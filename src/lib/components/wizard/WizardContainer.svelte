<!-- src/lib/components/wizard/WizardContainer.svelte -->
<script>
	import { createEventDispatcher } from "svelte";
	import { WIZARD_STEPS } from "$lib/utils/wizard-state.js";

	import SenderInfoStep from "./SenderInfoStep.svelte";
	import RecipientInfoStep from "./RecipientInfoStep.svelte";
	import InvoiceDetailsStep from "./InvoiceDetailsStep.svelte";
	import ItemsStep from "./ItemsStep.svelte";
	import FinalStep from "./FinalStep.svelte";

	export let currentStep;
	export let invoiceData;
	export let canUploadLogo = false;
	export let selectedFormat = "CII";
	export let isDownloading = false;
	export let isFormValid = true;
	export let userTier = "free";
	export let monthlyInvoices = 0;
	export let canGoNext = true;
	export let canGoPrev = true;

	const dispatch = createEventDispatcher();

	function goToStep(step) {
		dispatch("goToStep", { step });
	}

	function nextStep() {
		dispatch("nextStep");
	}

	function prevStep() {
		dispatch("prevStep");
	}

	// Data update handlers
	function handleSenderUpdate(event) {
		dispatch("updateSender", event.detail);
	}

	function handleRecipientUpdate(event) {
		dispatch("updateRecipient", event.detail);
	}

	function handleMetadataUpdate(event) {
		dispatch("updateMetadata", event.detail);
	}

	function handleItemsUpdate(event) {
		dispatch("updateItems", event.detail);
	}

	function handleDownload(event) {
		dispatch("download", event.detail);
	}

	function handlePremiumUpgrade(event) {
		dispatch("premiumUpgrade", event.detail);
	}
</script>

<div class="wizard-section">
	<div class="wizard-header">
		<h1>E-Rechnung erstellen</h1>
		<div class="steps-indicator">
			{#each WIZARD_STEPS as step}
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
			<SenderInfoStep
				senderData={invoiceData.sender}
				{canUploadLogo}
				on:update={handleSenderUpdate}
				on:premiumUpgrade={handlePremiumUpgrade}
			/>
		{:else if currentStep === 2}
			<RecipientInfoStep
				recipientData={invoiceData.recipient}
				on:update={handleRecipientUpdate}
			/>
		{:else if currentStep === 3}
			<InvoiceDetailsStep
				metadataData={invoiceData.metadata}
				on:update={handleMetadataUpdate}
			/>
		{:else if currentStep === 4}
			<ItemsStep
				items={invoiceData.items}
				on:updateItem={handleItemsUpdate}
				on:addItem={handleItemsUpdate}
				on:removeItem={handleItemsUpdate}
			/>
		{:else if currentStep === 5}
			<FinalStep
				{invoiceData}
				{selectedFormat}
				{isDownloading}
				{isFormValid}
				{userTier}
				{monthlyInvoices}
				on:download={handleDownload}
			/>
		{/if}
	</div>

	<div class="wizard-footer">
		<button class="btn btn-secondary" on:click={prevStep} disabled={!canGoPrev}>
			← Zurück
		</button>

		{#if currentStep < WIZARD_STEPS.length}
			<button class="btn btn-primary" on:click={nextStep} disabled={!canGoNext}>
				Weiter →
			</button>
		{/if}
	</div>
</div>
