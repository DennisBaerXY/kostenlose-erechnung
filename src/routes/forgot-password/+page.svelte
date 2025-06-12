<!-- src/routes/forgot-password/+page.svelte -->
<script>
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { browser } from "$app/environment";
	import { fade, fly } from "svelte/transition";

	import { isAuthenticated, authStore } from "$lib/stores/authStore";
	import { auth } from "$lib/api/auth";

	let email = "";
	let loading = false;
	let error = "";
	let success = false;
	let step = "request"; // 'request' | 'code' | 'newPassword'
	let resetCode = "";
	let newPassword = "";
	let confirmPassword = "";

	// Redirect if already authenticated
	onMount(() => {
		if (browser && $isAuthenticated) {
			goto("/dashboard");
		}
	});

	async function handleForgotPassword() {
		if (!email) {
			error = "Bitte geben Sie Ihre E-Mail-Adresse ein.";
			return;
		}

		loading = true;
		error = "";

		try {
			const result = await authStore.forgotPassword(email);
			if (!result.success) {
				error =
					result.message ||
					"Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.";
				return;
			}

			success = true;

			step = "code";
		} catch (err) {
			console.error("Forgot password error:", err);
			error = "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.";
		} finally {
			loading = false;
		}
	}

	async function handleResetPassword() {
		if (!resetCode || !newPassword || !confirmPassword) {
			error = "Bitte füllen Sie alle Felder aus.";
			return;
		}

		if (newPassword !== confirmPassword) {
			error = "Die Passwörter stimmen nicht überein.";
			return;
		}

		if (newPassword.length < 8) {
			error = "Das Passwort muss mindestens 8 Zeichen lang sein.";
			return;
		}

		loading = true;
		error = "";

		try {
			// TODO: Implement reset password API call
			// const result = await authAPI.resetPassword(email, resetCode, newPassword);
			const result = await authStore.resetPassword(
				email,
				resetCode,
				newPassword
			);

			if (!result.success) {
				error =
					result.message ||
					"Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.";
				return;
			}

			success = true;
			step = "complete";

			setTimeout(() => {
				goto("/login?passwordReset=true");
			}, 3000);
		} catch (err) {
			console.error("Reset password error:", err);
			error = "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.";
		} finally {
			loading = false;
		}
	}

	function handleKeydown(event) {
		if (event.key === "Enter") {
			if (step === "request") {
				handleForgotPassword();
			} else if (step === "code") {
				handleResetPassword();
			}
		}
	}

	function clearError() {
		error = "";
	}

	function goBack() {
		if (step === "code") {
			step = "request";
			success = false;
		} else {
			goto("/login");
		}
	}
</script>

<svelte:head>
	<title>Passwort vergessen | kostenlose-erechnung.de</title>
	<meta
		name="description"
		content="Setzen Sie Ihr Passwort zurück und erhalten Sie wieder Zugang zu Ihrem Konto."
	/>
</svelte:head>

<div class="forgot-container">
	<div class="forgot-wrapper">
		<div class="forgot-card">
			{#if step === "complete"}
				<div class="success-state" in:fade={{ duration: 300 }}>
					<div class="success-icon">✅</div>
					<h2>Passwort erfolgreich zurückgesetzt!</h2>
					<p>Sie können sich jetzt mit Ihrem neuen Passwort anmelden.</p>
					<div class="loading-dots">
						<span></span>
						<span></span>
						<span></span>
					</div>
				</div>
			{:else}
				<div class="header">
					<button class="back-button" on:click={goBack} aria-label="Zurück">
						←
					</button>

					{#if step === "request"}
						<div class="lock-icon">🔒</div>
						<h1>Passwort vergessen?</h1>
						<p>
							Kein Problem! Geben Sie Ihre E-Mail-Adresse ein und wir senden
							Ihnen einen Code zum Zurücksetzen.
						</p>
					{:else if step === "code"}
						<div class="key-icon">🔑</div>
						<h1>Neues Passwort erstellen</h1>
						<p>Geben Sie den Code aus der E-Mail und Ihr neues Passwort ein.</p>
					{/if}
				</div>

				{#if error}
					<div
						class="error-message"
						in:fly={{ y: -10, duration: 300 }}
						on:click={clearError}
					>
						<span class="error-icon">⚠️</span>
						<span>{error}</span>
						<button class="error-close" aria-label="Fehlermeldung schließen"
							>✕</button
						>
					</div>
				{/if}

				{#if step === "request"}
					<form
						on:submit|preventDefault={handleForgotPassword}
						class="forgot-form"
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
								autofocus
								autocomplete="email"
								class="input"
							/>
						</div>

						<button
							type="submit"
							class="submit-button"
							disabled={loading || !email}
						>
							{#if loading}
								<div class="spinner"></div>
								<span>Code wird gesendet...</span>
							{:else}
								<span>Reset-Code senden</span>
							{/if}
						</button>
					</form>

					{#if success}
						<div class="success-message" in:fly={{ y: 10, duration: 300 }}>
							<div>
								<strong>E-Mail gesendet!</strong>
								<p>Prüfen Sie Ihr Postfach und geben Sie den Code unten ein.</p>
							</div>
						</div>
					{/if}
				{:else if step === "code"}
					<form
						on:submit|preventDefault={handleResetPassword}
						class="forgot-form"
					>
						<div class="input-group">
							<label for="email-readonly">E-Mail-Adresse</label>
							<input
								id="email-readonly"
								type="email"
								value={email}
								readonly
								class="input readonly"
							/>
						</div>

						<div class="input-group">
							<label for="resetCode">Reset-Code</label>
							<input
								id="resetCode"
								type="text"
								bind:value={resetCode}
								on:keydown={handleKeydown}
								on:input={clearError}
								placeholder="123456"
								required
								class="input code-input"
								maxlength="6"
								pattern="[0-9]{'{'}6{'}'}"
							/>
							<small class="input-hint">6-stelliger Code aus der E-Mail</small>
						</div>

						<div class="input-group">
							<label for="newPassword">Neues Passwort</label>
							<input
								id="newPassword"
								type="password"
								bind:value={newPassword}
								on:keydown={handleKeydown}
								on:input={clearError}
								placeholder="Mindestens 8 Zeichen"
								required
								autocomplete="new-password"
								class="input"
								minlength="8"
							/>
						</div>

						<div class="input-group">
							<label for="confirmPassword">Passwort bestätigen</label>
							<input
								id="confirmPassword"
								type="password"
								bind:value={confirmPassword}
								on:keydown={handleKeydown}
								on:input={clearError}
								placeholder="Passwort wiederholen"
								required
								autocomplete="new-password"
								class="input"
								class:error={confirmPassword && newPassword !== confirmPassword}
							/>
							{#if confirmPassword && newPassword !== confirmPassword}
								<small class="validation-error"
									>Passwörter stimmen nicht überein</small
								>
							{/if}
						</div>

						<button
							type="submit"
							class="submit-button"
							disabled={loading ||
								!resetCode ||
								!newPassword ||
								!confirmPassword ||
								newPassword !== confirmPassword}
						>
							{#if loading}
								<div class="spinner"></div>
								<span>Passwort wird zurückgesetzt...</span>
							{:else}
								<span>Passwort zurücksetzen</span>
							{/if}
						</button>
					</form>
				{/if}

				<div class="footer-links">
					<a href="/login" class="footer-link">← Zurück zur Anmeldung</a>
					<a href="/register" class="footer-link">Neues Konto erstellen →</a>
				</div>

				{#if step === "request"}
					<div class="info-box">
						<div class="info-icon">💡</div>
						<div class="info-content">
							<strong>Tipp:</strong> Prüfen Sie auch Ihren Spam-Ordner, falls Sie
							keine E-Mail erhalten.
						</div>
					</div>
				{/if}
			{/if}
		</div>
	</div>
</div>

<style>
	.forgot-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
	}

	.forgot-wrapper {
		width: 100%;
		max-width: 500px;
	}

	.forgot-card {
		background: var(--bg-white);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
		padding: 3rem;
		position: relative;
	}

	.back-button {
		position: absolute;
		top: 1.5rem;
		left: 1.5rem;
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: var(--text-light);
		padding: 0.5rem;
		border-radius: var(--radius);
		transition: all 0.3s ease;
	}

	.back-button:hover {
		background: var(--bg-light);
		color: var(--text-dark);
	}

	.header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.lock-icon,
	.key-icon {
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
		text-align: center;
		padding: 2rem 0;
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

	.success-message {
		background: #d4edda;
		border: 1px solid #c3e6cb;
		border-radius: var(--radius);
		padding: 1rem;
		margin-top: 1.5rem;
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		color: #155724;
	}

	.success-message p {
		margin: 0.25rem 0 0 0;
		font-size: 0.875rem;
	}

	.error-close {
		background: none;
		border: none;
		color: inherit;
		cursor: pointer;
		margin-left: auto;
		padding: 0.25rem;
	}

	.forgot-form {
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

	.input.readonly {
		background: var(--bg-light);
		color: var(--text-light);
	}

	.input.error {
		border-color: #dc3545;
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

	.validation-error {
		color: #dc3545;
		font-size: 0.75rem;
		margin-top: 0.25rem;
	}

	.submit-button {
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

	.submit-button:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(123, 254, 132, 0.3);
	}

	.submit-button:disabled {
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

	.footer-links {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--border-color);
	}

	.footer-link {
		color: var(--primary-dark);
		text-decoration: none;
		font-size: 0.875rem;
		transition: color 0.3s ease;
	}

	.footer-link:hover {
		color: var(--primary-color);
		text-decoration: underline;
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
		.forgot-container {
			padding: 0.5rem;
		}

		.forgot-card {
			padding: 2rem;
		}

		.header h1 {
			font-size: 1.5rem;
		}

		.lock-icon,
		.key-icon {
			font-size: 3rem;
		}

		.footer-links {
			flex-direction: column;
			gap: 1rem;
			text-align: center;
		}
	}
</style>
