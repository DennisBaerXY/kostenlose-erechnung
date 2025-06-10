<!-- src/lib/components/wizard/InvoiceDetailsStep.svelte -->
<script>
	import { createEventDispatcher } from "svelte";
	import {
		generateInvoiceNumber,
		calculateDueDate
	} from "$lib/utils/invoice-validation.js";

	export let metadataData;

	const dispatch = createEventDispatcher();

	function updateField(field, value) {
		dispatch("update", { field, value });

		// Auto-calculate due date when date or payment terms change
		if (field === "date" || field === "paymentTerms") {
			const dueDate = calculateDueDate(
				field === "date" ? value : metadataData.date,
				field === "paymentTerms" ? value : metadataData.paymentTerms
			);
			if (dueDate) {
				dispatch("update", { field: "dueDate", value: dueDate });
			}
		}

		if (field === "paymentTerms") {
			// Generate invoice number if not set

			switch (value) {
				case "net14":
					metadataData.customPaymentTerms =
						"Zahlbar innerhalb 14 Tagen ohne Abzug.";
					break;

				case "immediate":
					metadataData.customPaymentTerms = "Zahlbar sofort ohne Abzug.";
					break;
				default:
				case "net30":
					metadataData.customPaymentTerms =
						"Zahlbar innerhalb 30 Tagen ohne Abzug.";

					break;
			}
		}
	}
</script>

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
					value={metadataData.invoiceNumber}
					on:input={(e) => updateField("invoiceNumber", e.target.value)}
					placeholder="25-0001"
					required
				/>
			</div>
		</div>

		<div class="form-group">
			<label for="invoice-date">Rechnungsdatum *</label>
			<input
				id="invoice-date"
				type="date"
				value={metadataData.date}
				on:input={(e) => updateField("date", e.target.value)}
				required
			/>
		</div>

		<div class="form-group">
			<label for="delivery-date">Lieferdatum</label>
			<input
				id="delivery-date"
				type="date"
				value={metadataData.deliveryDate}
				on:input={(e) => updateField("deliveryDate", e.target.value)}
			/>
		</div>

		<div class="form-group">
			<label for="due-date">Fälligkeitsdatum</label>
			<input
				id="due-date"
				type="date"
				value={metadataData.dueDate}
				on:input={(e) => updateField("dueDate", e.target.value)}
				readonly
				class="readonly"
			/>
		</div>

		<div class="form-group full">
			<label for="payment-terms">Zahlungsbedingungen</label>
			<select
				id="payment-terms"
				value={metadataData.paymentTerms}
				on:change={(e) => updateField("paymentTerms", e.target.value)}
			>
				<option value="net14">Zahlbar innerhalb 14 Tagen</option>
				<option value="net30">Zahlbar innerhalb 30 Tagen</option>
				<option value="immediate">Zahlbar sofort</option>
			</select>
		</div>
	</div>
</div>
