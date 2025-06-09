<script>
	import { createEventDispatcher, onMount } from "svelte";
	import { invoiceData } from "$lib/stores/invoice.js";
	import { fade, fly } from "svelte/transition";

	export let show = false;
	export let justCreatedInvoice = null;

	const dispatch = createEventDispatcher();

	let email = "";
	let password = "";
	let loading = false;
	let transition = false;
	let error = "";

	async function handleRegister() {
		loading = true;
		error = "";

		try {
			// TODO: Implement actual registration
			// For now, simulate registration
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// Save current invoice data to user account
			const userData = {
				email,
				tier: "free",
				invoices: justCreatedInvoice ? [justCreatedInvoice] : []
			};

			localStorage.setItem("user", JSON.stringify(userData));
			dispatch("registered", userData);
		} catch (err) {
			error = "Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.";
		} finally {
			loading = false;
		}
	}

	function skipRegistration() {
		dispatch("skip");
		transition = false;
		show = false;
	}

	onMount(() => {
		transition = true;
	});
</script>

{#if transition}
	<div class="modal-overlay" in:fly={{ y: 100 }} out:fade={{ duration: 100 }}>
		<div class="modal">
			<div class="modal-header">
				<h2>🎉 Ihre E-Rechnung wurde erfolgreich erstellt!</h2>
				<button class="close-btn" on:click={skipRegistration}>✕</button>
			</div>

			<div class="modal-content">
				<div class="success-message">
					<span class="success-icon">✅</span>
					<p>Ihre Rechnung wurde heruntergeladen und ist bereit zum Versand.</p>
				</div>

				<div class="registration-offer">
					<h3>
						Möchten Sie diese Rechnung und Ihre Daten für die Zukunft speichern?
					</h3>
					<p>Erstellen Sie ein kostenloses Konto und profitieren Sie von:</p>

					<ul class="benefits">
						<li>📁 Sichere Speicherung Ihrer Rechnungen</li>
						<li>🔄 Wiederverwendung Ihrer Firmendaten</li>
						<li>👥 Kundenverwaltung für schnelleres Ausfüllen</li>
						<li>📋 Rechnungsvorlagen (Premium)</li>
					</ul>

					<form on:submit|preventDefault={handleRegister}>
						<div class="form-group">
							<label for="email">E-Mail-Adresse</label>
							<input
								id="email"
								type="email"
								bind:value={email}
								placeholder={$invoiceData.sender.email || "ihre@email.de"}
								required
							/>
						</div>

						<div class="form-group">
							<label for="password">Passwort</label>
							<input
								id="password"
								type="password"
								bind:value={password}
								placeholder="Mindestens 8 Zeichen"
								minlength="8"
								required
							/>
						</div>

						{#if error}
							<div class="error-message">{error}</div>
						{/if}

						<div class="actions">
							<button type="submit" class="btn btn-primary" disabled={loading}>
								{#if loading}
									Erstelle Konto...
								{:else}
									Kostenloses Konto erstellen
								{/if}
							</button>

							<button
								type="button"
								class="btn btn-secondary"
								on:click={skipRegistration}
							>
								Später
							</button>
						</div>
					</form>

					<p class="privacy-note">
						Mit der Registrierung stimmen Sie unseren AGB und
						Datenschutzbestimmungen zu.
					</p>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
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
		max-width: 600px;
		width: 90%;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: var(--shadow-lg);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 2rem;
		border-bottom: 1px solid var(--border-color);
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.5rem;
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: var(--text-light);
		padding: 0.5rem;
	}

	.modal-content {
		padding: 2rem;
	}

	.success-message {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: #d4edda;
		border-radius: var(--radius);
		margin-bottom: 2rem;
	}

	.success-icon {
		font-size: 2rem;
	}

	.registration-offer h3 {
		margin-bottom: 0.5rem;
	}

	.benefits {
		list-style: none;
		padding: 0;
		margin: 1.5rem 0;
	}

	.benefits li {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
	}

	.form-group input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid var(--border-color);
		border-radius: var(--radius);
		font-size: 1rem;
	}

	.form-group input:focus {
		outline: none;
		border-color: var(--primary-color);
	}

	.error-message {
		color: #dc3545;
		font-size: 0.875rem;
		margin-bottom: 1rem;
	}

	.actions {
		display: flex;
		gap: 1rem;
		margin-top: 2rem;
	}

	.actions button {
		flex: 1;
	}

	.privacy-note {
		font-size: 0.75rem;
		color: var(--text-light);
		text-align: center;
		margin-top: 1rem;
	}
</style>
