<!-- src/lib/components/wizard/ItemsStep.svelte -->
<script>
	import { createEventDispatcher } from "svelte";

	export let items;

	const dispatch = createEventDispatcher();

	function updateItem(index, field, value) {
		dispatch("updateItem", { type: "updateItem", index, field, value });
	}

	function addItem() {
		dispatch("addItem", { type: "addItem" });
	}

	function removeItem(index) {
		dispatch("removeItem", { type: "removeItem", index });
	}

	let taxations = [
		{ label: "0%", value: 0 },
		{ label: "7%", value: 7 },
		{ label: "19%", value: 19 }
	];

	// Calculate totals
	$: subtotal = items.reduce(
		(sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
		0
	);

	$: taxAmount = items.reduce(
		(sum, item) =>
			sum +
			((item.quantity || 0) * (item.unitPrice || 0) * (item.taxRate || 0)) /
				100,
		0
	);

	$: total = subtotal + taxAmount;
</script>

<div class="form-section">
	<h2>Rechnungspositionen</h2>
	<p class="form-description">
		Fügen Sie die einzelnen Leistungen oder Produkte hinzu
	</p>

	<div class="items-list">
		{#each items as item, index}
			<div class="item-row">
				<div class="item-header">
					<h4>Position {index + 1}</h4>
					{#if items.length > 1}
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
						<label for={`description-${index}`}>Beschreibung *</label>
						<input
							id={`description-${index}`}
							type="text"
							value={item.description}
							on:input={(e) => updateItem(index, "description", e.target.value)}
							placeholder="Beratung, Website-Entwicklung, etc."
							required
						/>
					</div>

					<div class="form-group">
						<label for={`quantity-${index}`}>Menge *</label>
						<input
							id={`quantity-${index}`}
							type="number"
							value={item.quantity}
							on:input={(e) =>
								updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
							min="0"
							step="0.01"
							required
						/>
					</div>

					<div class="form-group">
						<label for={`unit-${index}`}>Einheit</label>
						<select
							id={`unit-${index}`}
							value={item.unit}
							required
							aria-label="Einheit auswählen"
							on:change={(e) => updateItem(index, "unit", e.target.value)}
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
						<label for={`unitPrice-${index}`}>Einzelpreis (€) *</label>
						<input
							id={`unitPrice-${index}`}
							type="number"
							value={item.unitPrice}
							on:input={(e) =>
								updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
							min="0"
							step="0.01"
							required
						/>
					</div>
					<div class="form-group">
						<label for={`taxRate-${index}`}>MwSt. (%)</label>
						<select
							id={`taxRate-${index}`}
							required
							bind:value={item.taxRate}
							on:change={(e) =>
								updateItem(index, "taxRate", parseFloat(e.target.value) || 0)}
						>
							{#each taxations as tax}
								<option value={tax.value}>{tax.label}</option>
							{/each}
						</select>
					</div>
				</div>

				<div class="item-total">
					Gesamt: {((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)} €
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
