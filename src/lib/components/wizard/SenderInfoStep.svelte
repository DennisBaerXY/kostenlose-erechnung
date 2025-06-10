<!-- src/lib/components/wizard/SenderInfoStep.svelte -->
<script>
	import { createEventDispatcher } from "svelte";

	export let senderData;
	export let canUploadLogo = false;

	const dispatch = createEventDispatcher();

	function updateField(field, value) {
		dispatch("update", { field, value });
	}

	function handleLogoUpload() {
		if (!canUploadLogo) {
			dispatch("premiumUpgrade", "Logo Upload");
			return;
		}

		const input = document.createElement("input");
		input.type = "file";
		input.accept = "image/*";
		input.onchange = (e) => {
			const file = e.target.files[0];
			if (file) {
				const reader = new FileReader();
				reader.onload = (e) => {
					updateField("logo", e.target.result);
				};
				reader.readAsDataURL(file);
			}
		};
		input.click();
	}

	function removeLogo() {
		updateField("logo", null);
	}
</script>

<div class="form-section">
	<h2>Ihre Angaben</h2>
	<p class="form-description">Geben Sie Ihre Kontaktinformationen ein</p>

	<div class="form-grid">
		<div class="form-group half">
			<label for="sender-name">Firmenname *</label>
			<input
				id="sender-name"
				type="text"
				value={senderData.name}
				on:input={(e) => updateField("name", e.target.value)}
				placeholder="Mustermann GmbH"
				required
			/>
		</div>

		<div class="form-group half">
			<label for="sender-contact-name">Kontaktname (optional)</label>
			<input
				id="sender-contact-name"
				type="text"
				value={senderData.contactName}
				on:input={(e) => updateField("contactName", e.target.value)}
				placeholder="Friedrich Muster"
				required
			/>
		</div>

		<!-- Logo Upload Section -->
		<div class="form-group full">
			<label>
				Firmenlogo
				{#if !canUploadLogo}
					<span class="premium-label">⭐ Premium</span>
				{/if}
			</label>

			<div class="logo-upload-section">
				{#if senderData.logo}
					<div class="logo-preview">
						<img src={senderData.logo} alt="Firmenlogo" />
						<button class="btn-remove-logo" on:click={removeLogo}>
							✕ Entfernen
						</button>
					</div>
				{:else}
					<button
						class="btn btn-secondary logo-upload-btn"
						on:click={handleLogoUpload}
						disabled={!canUploadLogo}
					>
						📁 Logo hochladen
					</button>
					{#if !canUploadLogo}
						<small class="premium-hint">
							Professionelle Rechnungen mit eigenem Logo - nur mit Premium
						</small>
					{/if}
				{/if}
			</div>
		</div>

		<div class="form-group">
			<label for="sender-street">Straße und Hausnummer *</label>
			<input
				id="sender-street"
				type="text"
				value={senderData.street}
				on:input={(e) => updateField("street", e.target.value)}
				placeholder="Musterstraße 123"
				required
			/>
		</div>

		<div class="form-group half">
			<label for="sender-zip">Postleitzahl *</label>
			<input
				id="sender-zip"
				type="text"
				value={senderData.zip}
				on:input={(e) => updateField("zip", e.target.value)}
				placeholder="12345"
				required
			/>
		</div>

		<div class="form-group half">
			<label for="sender-city">Ort *</label>
			<input
				id="sender-city"
				type="text"
				value={senderData.city}
				on:input={(e) => updateField("city", e.target.value)}
				placeholder="Musterstadt"
				required
			/>
		</div>

		<div class="form-group">
			<label for="sender-email">E-Mail-Adresse</label>
			<input
				id="sender-email"
				type="email"
				value={senderData.email}
				on:input={(e) => updateField("email", e.target.value)}
				placeholder="info@mustermann.de"
			/>
		</div>

		<div class="form-group">
			<label for="sender-phone">Telefonnummer</label>
			<input
				id="sender-phone"
				type="tel"
				value={senderData.phone}
				on:input={(e) => updateField("phone", e.target.value)}
				placeholder="+49 123 456789"
			/>
		</div>

		<div class="form-group">
			<label for="sender-taxid">Steuernummer *</label>
			<input
				id="sender-taxid"
				type="text"
				value={senderData.taxId}
				on:input={(e) => updateField("taxId", e.target.value)}
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
				value={senderData.ustId}
				on:input={(e) => updateField("ustId", e.target.value)}
				placeholder="DE123456789"
			/>
		</div>
	</div>
</div>
