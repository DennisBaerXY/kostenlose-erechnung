<script>
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { profileData, profileActions } from "$lib/stores/profileStore.js";

	import "./styles.css";

	const ONBOARDING_STEPS = [
		{ id: 1, name: "Unternehmensdaten" },
		{ id: 2, name: "Finanzinformationen" },
		{ id: 3, name: "Branding & Logo" },
		{ id: 4, name: "Abschluss" }
	];

	const LEGAL_FORMS = [
		{
			value: "Einzelunternehmen",
			label: "Einzelunternehmen",
			needsRegister: false
		},
		{ value: "Freiberufler", label: "Freiberufler", needsRegister: false },
		{
			value: "GbR",
			label: "Gesellschaft bürgerlichen Rechts (GbR)",
			needsRegister: false
		},
		{
			value: "GmbH",
			label: "Gesellschaft mit beschränkter Haftung (GmbH)",
			needsRegister: true
		},
		{
			value: "UG",
			label: "Unternehmergesellschaft (haftungsbeschränkt) (UG)",
			needsRegister: true
		},
		{ value: "AG", label: "Aktiengesellschaft (AG)", needsRegister: true },
		{ value: "KG", label: "Kommanditgesellschaft (KG)", needsRegister: true },
		{
			value: "oHG",
			label: "Offene Handelsgesellschaft (oHG)",
			needsRegister: true
		},
		{
			value: "eK",
			label: "Eingetragener Kaufmann (e.K.)",
			needsRegister: true
		},
		{ value: "Sonstige", label: "Sonstige", needsRegister: false }
	];

	let currentStep = 1;
	let senderData;
	let isLoading = true;
	let isSaving = false;
	let errors = {};

	const unsubscribe = profileData.subscribe(($profile) => {
		if ($profile.profile) {
			senderData = JSON.parse(JSON.stringify($profile.profile.defaultSender));
			senderData.isSmallBusinessOwner ??= false;
			senderData.legalForm ??= "";
			senderData.email ??= "";
			senderData.registrationCourt ??= "";
			senderData.registrationNumber ??= "";
			isLoading = false;
		} else {
			isLoading = $profile.loading;
		}
	});

	onMount(() => {
		return () => unsubscribe();
	});

	$: companyNameLabel =
		senderData?.legalForm === "Einzelunternehmen" ||
		senderData?.legalForm === "Freiberufler"
			? "Firmenname / Ihr Vor- und Nachname"
			: "Firmenname";

	$: showRegistrationFields =
		LEGAL_FORMS.find((form) => form.value === senderData?.legalForm)
			?.needsRegister ?? false;

	function validateStep(step) {
		errors = {};
		const data = senderData;
		if (step === 1) {
			if (!data.legalForm)
				errors.legalForm = "Bitte wählen Sie eine Unternehmensform.";
			if (!data.name) errors.name = "Bitte geben Sie Ihren Firmennamen an.";
			if (!data.street) errors.street = "Bitte geben Sie eine Straße an.";
			if (!data.zip) errors.zip = "Bitte geben Sie eine Postleitzahl an.";
			if (!data.city) errors.city = "Bitte geben Sie eine Stadt an.";
			if (!data.email) {
				errors.email = "Bitte geben Sie eine E-Mail-Adresse an.";
			} else if (!/^\S+@\S+\.\S+$/.test(data.email)) {
				errors.email = "Bitte geben Sie eine gültige E-Mail-Adresse an.";
			}
			if (showRegistrationFields) {
				if (!data.registrationCourt)
					errors.registrationCourt = "Bitte geben Sie das Registergericht an.";
				if (!data.registrationNumber)
					errors.registrationNumber = "Bitte geben Sie die Registernummer an.";
			}
		}
		if (step === 2) {
			if (!data.taxId) errors.taxId = "Bitte geben Sie Ihre Steuernummer an.";
			if (!data.bankDetails.accountHolder)
				errors.accountHolder = "Bitte geben Sie den Kontoinhaber an.";
			if (!data.bankDetails.iban) errors.iban = "Bitte geben Sie eine IBAN an.";
		}
		return Object.keys(errors).length === 0;
	}

	function nextStep() {
		if (!validateStep(currentStep)) return;
		if (currentStep < ONBOARDING_STEPS.length) {
			currentStep++;
		}
	}

	function prevStep() {
		errors = {};
		if (currentStep > 1) {
			currentStep--;
		}
	}

	async function handleSave() {
		if (!validateStep(1) || !validateStep(2)) {
			alert(
				"Bitte korrigieren Sie die Fehler in den Schritten 1 und 2, bevor Sie speichern."
			);
			if (!validateStep(1)) currentStep = 1;
			else if (!validateStep(2)) currentStep = 2;
			return;
		}
		isSaving = true;
		const result = await profileActions.saveSenderData(senderData);
		if (result.success) {
			goto("/dashboard");
		} else {
			alert("Fehler beim Speichern der Daten. Bitte versuchen Sie es erneut.");
		}
		isSaving = false;
	}

	function handleSkip() {
		goto("/erstellen");
	}
	function handleLogoChange(e) {
		const file = e.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (event) => {
				senderData.logo = event.target.result;
			};
			reader.readAsDataURL(file);
		}
	}
	function removeLogo() {
		senderData.logo = null;
	}
</script>

<svelte:head>
	<title>Willkommen an Bord - Richten Sie Ihr Profil ein</title>
	<meta
		name="description"
		content="Konfigurieren Sie Ihr Unternehmensprofil, um die Erstellung von E-Rechnungen zu beschleunigen."
	/>
</svelte:head>

<div>
	{#if isLoading}
		<div class="onboarding-container">
			<p>Profil wird geladen...</p>
		</div>
	{:else if senderData}
		<div class="onboarding-container">
			<div class="onboarding-header">
				<h1>Willkommen an Bord!</h1>
				<p>
					Lassen Sie uns Ihr Profil einrichten, um zukünftig Zeit zu sparen.
				</p>
			</div>

			<div class="progress-bar">
				{#each ONBOARDING_STEPS as step}
					<div class="progress-step" class:active={currentStep >= step.id} />
				{/each}
			</div>

			{#if currentStep === 1}
				<div class="form-section">
					<h2>Schritt 1: Ihre Unternehmensdaten</h2>
					<p class="form-description">
						Diese Informationen erscheinen auf all Ihren Rechnungen.
					</p>
					<div class="form-grid">
						<div class="form-group full">
							<label for="legalForm">Unternehmensform</label>
							<select id="legalForm" bind:value={senderData.legalForm}>
								<option disabled value="">Bitte wählen...</option>
								{#each LEGAL_FORMS as form}
									<option value={form.value}>{form.label}</option>
								{/each}
							</select>
							{#if errors.legalForm}<span class="error-message"
									>{errors.legalForm}</span
								>{/if}
						</div>
						<div class="form-group full">
							<label for="name">{companyNameLabel}</label>
							<input
								id="name"
								type="text"
								bind:value={senderData.name}
								placeholder="Ihre Firma GmbH / Max Mustermann"
							/>
							{#if errors.name}<span class="error-message">{errors.name}</span
								>{/if}
						</div>
						{#if showRegistrationFields}
							<div class="form-group">
								<label for="registrationCourt">Registergericht</label>
								<input
									id="registrationCourt"
									type="text"
									bind:value={senderData.registrationCourt}
									placeholder="z.B. Amtsgericht Darmstadt"
								/>
								{#if errors.registrationCourt}<span class="error-message"
										>{errors.registrationCourt}</span
									>{/if}
							</div>
							<div class="form-group">
								<label for="registrationNumber">Registernummer</label>
								<input
									id="registrationNumber"
									type="text"
									bind:value={senderData.registrationNumber}
									placeholder="z.B. HRB 12345"
								/>
								{#if errors.registrationNumber}<span class="error-message"
										>{errors.registrationNumber}</span
									>{/if}
							</div>
						{/if}
						<div class="form-group">
							<label for="contactName">Ansprechpartner (optional)</label>
							<input
								id="contactName"
								type="text"
								bind:value={senderData.contactName}
								placeholder="Max Mustermann"
							/>
						</div>
						<div class="form-group">
							<label for="email">E-Mail</label>
							<input
								id="email"
								type="email"
								bind:value={senderData.email}
								placeholder="kontakt@ihre-firma.de"
							/>
							{#if errors.email}<span class="error-message">{errors.email}</span
								>{/if}
						</div>
						<div class="form-group full">
							<label for="street">Straße & Hausnummer</label>
							<input
								id="street"
								type="text"
								bind:value={senderData.street}
								placeholder="Musterstraße 1"
							/>
							{#if errors.street}<span class="error-message"
									>{errors.street}</span
								>{/if}
						</div>
						<div class="form-group">
							<label for="zip">Postleitzahl</label>
							<input
								id="zip"
								type="text"
								bind:value={senderData.zip}
								placeholder="12345"
							/>
							{#if errors.zip}<span class="error-message">{errors.zip}</span
								>{/if}
						</div>
						<div class="form-group">
							<label for="city">Stadt</label>
							<input
								id="city"
								type="text"
								bind:value={senderData.city}
								placeholder="Musterstadt"
							/>
							{#if errors.city}<span class="error-message">{errors.city}</span
								>{/if}
						</div>
						<div class="form-group">
							<label for="phone">Telefon (optional)</label>
							<input
								id="phone"
								type="tel"
								bind:value={senderData.phone}
								placeholder="+49 123 456789"
							/>
						</div>
					</div>
				</div>
			{/if}

			{#if currentStep === 2}
				<div class="form-section">
					<h2>Schritt 2: Finanzinformationen</h2>
					<p class="form-description">
						Fügen Sie Ihre Steuer- und Bankdaten für die Zahlungsabwicklung
						hinzu.
					</p>
					<div class="form-grid">
						<div class="form-group full checkbox-group">
							<input
								id="isSmallBusinessOwner"
								type="checkbox"
								bind:checked={senderData.isSmallBusinessOwner}
							/>
							<label for="isSmallBusinessOwner"
								>Ich bin Kleinunternehmer gemäß § 19 UStG.</label
							>
							<small
								>Wenn Sie diese Option wählen, wird auf Ihren Rechnungen keine
								Umsatzsteuer ausgewiesen.</small
							>
						</div>
						<div class="form-group">
							<label for="taxId">Steuernummer</label>
							<input
								id="taxId"
								type="text"
								bind:value={senderData.taxId}
								placeholder="123/456/7890"
							/>
							{#if errors.taxId}<span class="error-message">{errors.taxId}</span
								>{/if}
						</div>
						{#if !senderData.isSmallBusinessOwner}
							<div class="form-group">
								<label for="ustId">USt-IdNr.</label>
								<input
									id="ustId"
									type="text"
									bind:value={senderData.ustId}
									placeholder="DE123456789"
								/>
								{#if errors.ustId}<span class="error-message"
										>{errors.ustId}</span
									>{/if}
							</div>
						{/if}
						<div class="form-group full"><h3>Bankverbindung</h3></div>
						<div class="form-group">
							<label for="accountHolder">Kontoinhaber</label>
							<input
								id="accountHolder"
								type="text"
								bind:value={senderData.bankDetails.accountHolder}
								placeholder="Ihre Firma GmbH"
							/>
							{#if errors.accountHolder}<span class="error-message"
									>{errors.accountHolder}</span
								>{/if}
						</div>
						<div class="form-group">
							<label for="bankName">Bank (optional)</label>
							<input
								id="bankName"
								type="text"
								bind:value={senderData.bankDetails.bankName}
								placeholder="Musterbank"
							/>
						</div>
						<div class="form-group">
							<label for="iban">IBAN</label>
							<input
								id="iban"
								type="text"
								bind:value={senderData.bankDetails.iban}
								placeholder="DE12..."
							/>
							{#if errors.iban}<span class="error-message">{errors.iban}</span
								>{/if}
						</div>
						<div class="form-group">
							<label for="bic">BIC (optional)</label>
							<input
								id="bic"
								type="text"
								bind:value={senderData.bankDetails.bic}
								placeholder="MUSTERBIC"
							/>
						</div>
					</div>
				</div>
			{/if}

			{#if currentStep === 3}
				<div class="form-section">
					<h2>Schritt 3: Branding & Logo</h2>
					<p class="form-description">
						Personalisieren Sie Ihre Rechnungen mit Ihrem Firmenlogo.
					</p>
					<div class="form-grid">
						<div class="logo-upload-section">
							{#if senderData.logo}
								<div class="logo-preview">
									<img src={senderData.logo} alt="Firmenlogo Vorschau" />
									<button class="btn-remove-logo" on:click={removeLogo}
										>Logo entfernen</button
									>
								</div>
							{:else}
								<p>Laden Sie Ihr Logo hoch (PNG, JPG).</p>
								<input
									type="file"
									id="logo-upload"
									accept="image/png, image/jpeg"
									on:change={handleLogoChange}
									hidden
								/>
								<label for="logo-upload" class="btn btn-secondary"
									>Logo auswählen</label
								>
							{/if}
						</div>
					</div>
				</div>
			{/if}

			{#if currentStep === 4}
				<div class="form-section">
					<h2>Fast geschafft!</h2>
					<p class="form-description">
						Überprüfen Sie Ihre Angaben. Sie können diese später jederzeit in
						Ihren Profileinstellungen ändern.
					</p>
					<button
						class="btn btn-primary"
						on:click={handleSave}
						disabled={isSaving}
					>
						{#if isSaving}
							<span class="spinner" /> Speichern...
						{:else}
							Speichern und loslegen
						{/if}
					</button>
				</div>
			{/if}

			<footer class="onboarding-footer">
				<div>
					{#if currentStep === 1}
						<a
							href="/erstellen"
							class="skip-link"
							on:click|preventDefault={handleSkip}>Überspringen</a
						>
					{/if}
				</div>
				<div style="display: flex; gap: 1rem;">
					{#if currentStep > 1}
						<button class="btn btn-secondary" on:click={prevStep}>
							Zurück
						</button>
					{/if}
					{#if currentStep < ONBOARDING_STEPS.length}
						<button class="btn btn-primary" on:click={nextStep}>
							Weiter
						</button>
					{/if}
				</div>
			</footer>
		</div>
	{/if}
</div>
