<script>
	import { createEventDispatcher, onMount } from "svelte";
	import { invoiceData } from "$lib/stores/invoice.js";
	import { fade, fly, scale } from "svelte/transition";

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
			await new Promise((resolve) => setTimeout(resolve, 1000));

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

	function goToLogin() {
		skipRegistration();
		window.location.href = "/login";
	}

	onMount(() => {
		transition = true;
	});
</script>

{#if transition}
	<div
		class="modal-overlay"
		in:fade={{ duration: 200 }}
		out:fade={{ duration: 150 }}
	>
		<div
			class="modal"
			in:scale={{ duration: 300, start: 0.95 }}
			out:scale={{ duration: 200, start: 0.98 }}
		>
			<!-- Success Header -->
			<div class="success-header">
				<div class="success-icon">
					<svg
						viewBox="0 0 24 24"
						width="24"
						height="24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<polyline points="20,6 9,17 4,12" />
					</svg>
				</div>
				<div class="success-text">
					<h2>Rechnung erfolgreich erstellt</h2>
					<p>Ihre E-Rechnung wurde heruntergeladen</p>
				</div>
				<button class="close-btn" on:click={skipRegistration}>
					<svg
						viewBox="0 0 24 24"
						width="20"
						height="20"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<line x1="18" y1="6" x2="6" y2="18" />
						<line x1="6" y1="6" x2="18" y2="18" />
					</svg>
				</button>
			</div>

			<!-- Main Content -->
			<div class="content">
				<!-- Sales Pitch -->
				<div class="pitch">
					<h3>Sparen Sie Zeit bei jeder Rechnung</h3>
					<p>
						Firmendaten automatisch speichern • Rechnungshistorie • Keine
						Dateneingabe mehr
					</p>
				</div>

				<!-- Form -->
				<form on:submit|preventDefault={handleRegister} class="form">
					<div class="input-group">
						<label for="signup-email">E-Mail-Adresse</label>
						<input
							id="signup-email"
							type="email"
							bind:value={email}
							placeholder="ihre@email.de"
							required
							class="input"
						/>
					</div>

					<div class="input-group">
						<label for="signup-password">Passwort</label>
						<input
							id="signup-password"
							type="password"
							bind:value={password}
							placeholder="Mindestens 8 Zeichen"
							minlength="8"
							required
							class="input"
						/>
					</div>

					{#if error}
						<div class="error" in:fly={{ y: -10, duration: 200 }}>
							{error}
						</div>
					{/if}

					<button type="submit" class="btn-primary" disabled={loading}>
						{#if loading}
							<div class="spinner"></div>
							Konto wird erstellt...
						{:else}
							Kostenloses Konto erstellen
						{/if}
					</button>

					<p class="terms">
						Durch die Registrierung stimmen Sie unseren <a
							href="/agb"
							target="_blank">AGB</a
						>
						und
						<a href="/datenschutz" target="_blank">Datenschutzbestimmungen</a> zu.
					</p>
				</form>

				<!-- Footer -->
				<div class="footer">
					<button class="link-btn" on:click={goToLogin}>
						Bereits ein Konto? <span>Anmelden</span>
					</button>
					<button class="skip-btn" on:click={skipRegistration}> Später </button>
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
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(8px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal {
		background: #ffffff;
		border-radius: 16px;
		max-width: 480px;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow:
			0 20px 40px -12px rgba(0, 0, 0, 0.2),
			0 0 0 1px rgba(0, 0, 0, 0.05);
		position: relative;
	}

	/* Success Header */
	.success-header {
		background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
		padding: 1.5rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		border-radius: 16px 16px 0 0;
		border-bottom: 1px solid #e9ecef;
	}

	.success-icon {
		width: 48px;
		height: 48px;
		background: #27ae60;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		flex-shrink: 0;
	}

	.success-text {
		flex: 1;
	}

	.success-text h2 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1a1a1a;
		margin: 0 0 0.25rem 0;
		line-height: 1.3;
	}

	.success-text p {
		color: #6c757d;
		font-size: 0.9rem;
		margin: 0;
		line-height: 1.4;
	}

	.close-btn {
		background: none;
		border: none;
		color: #6c757d;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 8px;
		transition: all 0.2s ease;
		flex-shrink: 0;
	}

	.close-btn:hover {
		background: rgba(108, 117, 125, 0.1);
		color: #495057;
	}

	/* Content */
	.content {
		padding: 1.5rem 2rem 2rem;
	}

	/* Sales Pitch */
	.pitch {
		text-align: center;
		margin-bottom: 1.5rem;
	}

	.pitch h3 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1a1a1a;
		margin: 0 0 0.75rem 0;
		line-height: 1.3;
	}

	.pitch p {
		color: #6c757d;
		font-size: 1rem;
		margin: 0;
		line-height: 1.5;
	}

	/* Form */
	.form {
		margin-bottom: 1.5rem;
	}

	.input-group {
		margin-bottom: 0.75rem;
	}

	.input-group label {
		display: block;
		font-size: 0.9rem;
		font-weight: 500;
		color: #495057;
		margin-bottom: 0.5rem;
	}

	.input {
		width: 100%;
		padding: 0.875rem 1rem;
		border: 2px solid #e9ecef;
		border-radius: 8px;
		font-size: 1rem;
		background: #ffffff;
		transition: all 0.2s ease;
		outline: none;
	}

	.input:focus {
		border-color: #7bfe84;
		box-shadow: 0 0 0 3px rgba(123, 254, 132, 0.1);
	}

	.input::placeholder {
		color: #adb5bd;
	}

	.btn-primary {
		width: 100%;
		background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%);
		border: none;
		border-radius: 8px;
		padding: 1rem;
		font-size: 1rem;
		font-weight: 600;
		color: #ffffff;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.btn-primary:hover:not(:disabled) {
		background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.btn-primary:disabled {
		opacity: 0.7;
		cursor: not-allowed;
		transform: none;
	}

	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top: 2px solid #ffffff;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	.terms {
		font-size: 0.8rem;
		color: #6c757d;
		text-align: center;
		margin: 0;
		line-height: 1.4;
	}

	.terms a {
		color: #1a1a1a;
		text-decoration: none;
	}

	.terms a:hover {
		text-decoration: underline;
	}

	.error {
		background: #f8d7da;
		border: 1px solid #f5c6cb;
		border-radius: 6px;
		padding: 0.75rem;
		margin-bottom: 1rem;
		color: #721c24;
		font-size: 0.9rem;
		text-align: center;
	}

	/* Footer */
	.footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 1rem;
		border-top: 1px solid #f8f9fa;
	}

	.link-btn {
		background: none;
		border: none;
		color: #6c757d;
		font-size: 0.9rem;
		cursor: pointer;
		transition: color 0.2s ease;
	}

	.link-btn:hover {
		color: #1a1a1a;
	}

	.link-btn span {
		font-weight: 600;
		color: #1a1a1a;
	}

	.skip-btn {
		background: none;
		border: none;
		color: #adb5bd;
		font-size: 0.9rem;
		cursor: pointer;
		transition: color 0.2s ease;
	}

	.skip-btn:hover {
		color: #6c757d;
	}

	/* Animations */
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Mobile Responsiveness */
	@media (max-width: 768px) {
		.modal {
			margin: 0.5rem;
			max-height: 95vh;
		}

		.success-header {
			padding: 1.25rem;
		}

		.content {
			padding: 1.5rem;
		}

		.pitch h3 {
			font-size: 1.3rem;
		}

		.pitch p {
			font-size: 0.95rem;
		}
	}

	@media (max-width: 480px) {
		.footer {
			flex-direction: column;
			gap: 1rem;
			text-align: center;
		}

		.success-header {
			flex-direction: column;
			text-align: center;
			gap: 1rem;
		}

		.close-btn {
			position: absolute;
			top: 1rem;
			right: 1rem;
		}
	}
</style>
