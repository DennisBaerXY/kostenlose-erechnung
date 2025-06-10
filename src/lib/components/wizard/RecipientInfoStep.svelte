<!-- src/lib/components/wizard/RecipientInfoStep.svelte -->
<script>
	import { createEventDispatcher } from "svelte";

	export let recipientData;

	const dispatch = createEventDispatcher();

	function updateField(field, value) {
		dispatch("update", { field, value });
	}
</script>

<div class="form-section">
	<h2>Empfänger</h2>
	<p class="form-description">Kontaktinformationen des Rechnungsempfängers</p>

	<div class="form-grid">
		<div class="form-group full">
			<label for="recipient-name">Firmenname / Name *</label>
			<input
				id="recipient-name"
				type="text"
				value={recipientData.name}
				on:input={(e) => updateField("name", e.target.value)}
				placeholder="Kunde GmbH"
				required
			/>
		</div>

		<div class="form-group">
			<label for="recipient-street">Straße und Hausnummer *</label>
			<input
				id="recipient-street"
				type="text"
				value={recipientData.street}
				on:input={(e) => updateField("street", e.target.value)}
				placeholder="Kundenstraße 456"
				required
			/>
		</div>

		<div class="form-group half">
			<label for="recipient-zip">Postleitzahl *</label>
			<input
				id="recipient-zip"
				type="text"
				value={recipientData.zip}
				on:input={(e) => updateField("zip", e.target.value)}
				placeholder="54321"
				required
			/>
		</div>

		<div class="form-group half">
			<label for="recipient-city">Ort *</label>
			<input
				id="recipient-city"
				type="text"
				value={recipientData.city}
				on:input={(e) => updateField("city", e.target.value)}
				placeholder="Kundenstadt"
				required
			/>
		</div>

		<div class="form-group">
			<label for="recipient-email">E-Mail-Adresse</label>
			<input
				id="recipient-email"
				type="email"
				value={recipientData.email}
				on:input={(e) => updateField("email", e.target.value)}
				placeholder="kontakt@kunde.de"
			/>
		</div>

		<div class="form-group">
			<label for="recipient-reference">Ihre Referenz (optional)</label>
			<input
				id="recipient-reference"
				type="text"
				value={recipientData.reference}
				on:input={(e) => updateField("reference", e.target.value)}
				placeholder="Bestellnummer, Projektnummer, etc."
			/>
		</div>
		<div class="form-group">
			<label for="recipient-customerNumber">Ihre Kundennummer (optional)</label>
			<input
				id="recipient-customerNumber"
				type="text"
				value={recipientData.customerNumber}
				on:input={(e) => updateField("customerNumber", e.target.value)}
				placeholder="Kundennummer"
			/>
		</div>
	</div>
</div>
