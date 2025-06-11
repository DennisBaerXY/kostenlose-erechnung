<!-- src/routes/confirm-email/+page.svelte -->
<script>
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { browser } from "$app/environment";
	import { page } from "$app/stores";
	import { confirmSignUpUser } from "$lib/stores/auth.js";

	let email = "";
	let confirmationCode = "";
	let loading = false;
	let error = "";
	let success = false;

	onMount(() => {
		// Get email from URL parameters
		if (browser) {
			email = $page.url.searchParams.get("email") || "";
		}
	});

	async function handleConfirmation() {
		if (!email || !confirmationCode) {
			error = "Bitte geben Sie E-Mail und Bestätigungscode ein.";
			return;
		}

		loading = true;
		error = "";

		try {
			const result = await confirmSignUpUser(email, confirmationCode);

			if (result.success) {
				success = true;
				setTimeout(() => {
					goto("/login?confirmed=true");
				}, 2000);
			} else {
				error =
					result.message ||
					"Bestätigung fehlgeschlagen. Bitte prüfen Sie den Code.";
			}
		} catch (err) {
			console.error("Confirmation error:", err);
			error = "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.";
		} finally {
			loading = false;
		}
	}

	function handleKeydown(event) {
		if (event.key === "Enter") {
			handleConfirmation();
		}
	}

	function clearError() {
		error = "";
	}
</script>

<svelte:head>
	<title>E-Mail bestätigen | kostenlose-erechnung.de</title>
	<meta
		name="description"
		content="Bestätigen Sie Ihre E-Mail-Adresse, um Ihr Konto zu aktivieren."
	/>
</svelte:head>

<div class="confirm-container">
	<div class="confirm-wrapper">
		{#if success}
			<div class="success-state">
				<div class="success-icon">✅</div>
				<h2>E-Mail erfolgreich bestätigt!</h2>
				<p>
					Ihr Konto ist jetzt aktiv. Sie werden zur Anmeldung weitergeleitet.
				</p>
				<div class="loading-dots">
					<span></span>
					<span></span>
					<span></span>
				</div>
			</div>
		{:else}
			<div class="confirm-card">
				<div class="header">
					<div class="email-icon">📧</div>
					<h1>E-Mail bestätigen</h1>
					<p>
						Wir haben Ihnen einen Bestätigungscode gesendet. Bitte geben Sie
						diesen unten ein.
					</p>
				</div>

				{#if error}
					<div class="error-message" on:click={clearError}>
						<span class="error-icon">⚠️</span>
						<span>{error}</span>
						<button class="error-close" aria-label="Fehlermeldung schließen"
							>✕</button
						>
					</div>
				{/if}

				<form
					on:submit|preventDefault={handleConfirmation}
					class="confirm-form"
				>
					<div class="input-group">
						<label for="email">E-Mail-Adresse</label>
						<input
							id="email"
							type="email"
							bind:value={email}
							on:keydown={handleKeydown}
							on:input={clearError}
							placeholder="ihre@email.de"
							required
							class="input"
							readonly={!!$page.url.searchParams.get("email")}
						/>
					</div>

					<div class="input-group">
						<label for="confirmationCode">Bestätigungscode</label>
						<input
							id="confirmationCode"
							type="text"
							bind:value={confirmationCode}
							on:keydown={handleKeydown}
							on:input={clearError}
							placeholder="123456"
							required
							class="input code-input"
							maxlength="6"
							pattern="[0-9]{6}"
						/>
						<small class="input-hint"> 6-stelliger Code aus der E-Mail </small>
					</div>

					<button
						type="submit"
						class="confirm-button"
						disabled={loading || !email || !confirmationCode}
					>
						{#if loading}
							<div class="spinner"></div>
							<span>Wird bestätigt...</span>
						{:else}
							<span>E-Mail bestätigen</span>
						{/if}
					</button>
				</form>

				<div class="help-section">
					<h3>Probleme?</h3>
					<div class="help-options">
						<button class="help-link" disabled> 🔄 Code erneut senden </button>
						<a href="/register" class="help-link">
							← Zurück zur Registrierung
						</a>
						<a href="/login" class="help-link"> Zur Anmeldung → </a>
					</div>
				</div>

				<div class="info-box">
					<div class="info-icon">💡</div>
					<div class="info-content">
						<strong>Tipp:</strong> Prüfen Sie auch Ihren Spam-Ordner, falls Sie keine
						E-Mail erhalten haben.
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.confirm-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
	}

	.confirm-wrapper {
		width: 100%;
		max-width: 500px;
	}

	.confirm-card {
		background: var(--bg-white);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
		padding: 3rem;
	}

	.header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.email-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.header h1 {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--text-dark);
		margin: 0 0 1rem 0;
	}

	.header p {
		color: var(--text-light);
		margin: 0;
		line-height: 1.6;
	}

	.success-state {
		background: var(--bg-white);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
		padding: 3rem;
		text-align: center;
	}

	.success-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.success-state h2 {
		color: #28a745;
		margin-bottom: 1rem;
	}

	.loading-dots {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
		margin-top: 2rem;
	}

	.loading-dots span {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--primary-color);
		animation: bounce 1.4s ease-in-out infinite both;
	}

	.loading-dots span:nth-child(1) {
		animation-delay: -0.32s;
	}
	.loading-dots span:nth-child(2) {
		animation-delay: -0.16s;
	}

	@keyframes bounce {
		0%,
		80%,
		100% {
			transform: scale(0);
		}
		40% {
			transform: scale(1);
		}
	}

	.error-message {
		background: #f8d7da;
		border: 1px solid #f5c6cb;
		border-radius: var(--radius);
		padding: 1rem;
		margin-bottom: 1.5rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		color: #721c24;
		cursor: pointer;
	}

	.error-close {
		background: none;
		border: none;
		color: inherit;
		cursor: pointer;
		margin-left: auto;
		padding: 0.25rem;
	}

	.confirm-form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.input-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.input-group label {
		font-weight: 500;
		color: var(--text-dark);
		font-size: 0.875rem;
	}

	.input {
		padding: 0.875rem 1rem;
		border: 2px solid var(--border-color);
		border-radius: var(--radius);
		font-size: 1rem;
		transition: all 0.3s ease;
	}

	.input:focus {
		outline: none;
		border-color: var(--primary-color);
		box-shadow: 0 0 0 3px rgba(123, 254, 132, 0.1);
	}

	.input:read-only {
		background: var(--bg-light);
		color: var(--text-light);
	}

	.code-input {
		text-align: center;
		font-size: 1.25rem;
		font-weight: 600;
		letter-spacing: 0.5rem;
		font-family: monospace;
	}

	.input-hint {
		color: var(--text-light);
		font-size: 0.75rem;
		text-align: center;
	}

	.confirm-button {
		background: linear-gradient(
			135deg,
			var(--primary-color) 0%,
			var(--primary-dark) 100%
		);
		color: var(--text-dark);
		border: none;
		border-radius: var(--radius);
		padding: 1rem;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		min-height: 48px;
	}

	.confirm-button:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(123, 254, 132, 0.3);
	}

	.confirm-button:disabled {
		opacity: 0.7;
		cursor: not-allowed;
		transform: none;
	}

	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(26, 26, 26, 0.3);
		border-top: 2px solid var(--text-dark);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.help-section {
		border-top: 1px solid var(--border-color);
		padding-top: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.help-section h3 {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-dark);
		margin: 0 0 1rem 0;
		text-align: center;
	}

	.help-options {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.help-link {
		background: none;
		border: none;
		color: var(--primary-dark);
		text-decoration: none;
		cursor: pointer;
		font-size: 0.875rem;
		text-align: center;
		padding: 0.5rem;
		border-radius: var(--radius);
		transition: all 0.3s ease;
	}

	.help-link:hover:not(:disabled) {
		background: var(--primary-light);
		text-decoration: underline;
	}

	.help-link:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.info-box {
		background: #e7f3ff;
		border: 1px solid #b3d9ff;
		border-radius: var(--radius);
		padding: 1rem;
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
	}

	.info-icon {
		font-size: 1.25rem;
		flex-shrink: 0;
	}

	.info-content {
		font-size: 0.875rem;
		color: #0056b3;
		line-height: 1.5;
	}

	/* Mobile Responsiveness */
	@media (max-width: 480px) {
		.confirm-container {
			padding: 0.5rem;
		}

		.confirm-card,
		.success-state {
			padding: 2rem;
		}

		.header h1 {
			font-size: 1.5rem;
		}

		.email-icon,
		.success-icon {
			font-size: 3rem;
		}
	}
</style>
