<script>
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { browser } from "$app/environment";
	import { fade, fly } from "svelte/transition";

	// Import the new, robust authentication modules
	import { isAuthenticated } from "$lib/stores/authStore";
	import { auth } from "$lib/api/auth";

	// --- Component State ---
	let email = "";
	let password = "";
	let error = "";
	let loginInProgress = false; // For managing the button's loading state
	let showPassword = false;
	let rememberMe = false;

	// --- Reactive Statements ---

	// This block will run automatically whenever isAuthenticated changes.
	// If the user becomes authenticated, it redirects them to the dashboard.
	$: if ($isAuthenticated) {
		if (browser) {
			goto("/dashboard", { replaceState: true });
		}
	}

	// --- Lifecycle ---

	onMount(() => {
		// Load remembered email from localStorage when the component mounts
		if (browser) {
			const rememberedEmail = localStorage.getItem("remembered_email");
			if (rememberedEmail) {
				email = rememberedEmail;
				rememberMe = true;
			}
		}
	});

	// --- Event Handlers ---

	async function handleLogin() {
		// Prevent multiple submissions
		if (loginInProgress) return;

		loginInProgress = true;
		error = ""; // Clear previous errors

		try {
			const result = await auth.login(email, password);

			if (result.success) {
				// Handle "Remember Me" functionality
				if (browser) {
					if (rememberMe) {
						localStorage.setItem("remembered_email", email);
					} else {
						localStorage.removeItem("remembered_email");
					}
				}
				// The reactive statement `$: if ($isAuthenticated)` will handle the redirect.
			} else {
				// Display the error message from the backend
				error =
					result.message ||
					"Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Eingaben.";
			}
		} catch (e) {
			console.error("Login exception:", e);
			error = "Ein unerwarteter Fehler ist aufgetreten.";
		} finally {
			loginInProgress = false;
		}
	}

	/**
	 * Allows submitting the form by pressing Enter in the password field.
	 */
	function handleKeydown(event) {
		if (event.key === "Enter") {
			handleLogin();
		}
	}

	function togglePasswordVisibility() {
		showPassword = !showPassword;
	}

	function clearError() {
		error = "";
	}
</script>

<svelte:head>
	<title>Anmelden | kostenlose-erechnung.de</title>
	<meta
		name="description"
		content="Melden Sie sich bei Ihrem kostenlosen E-Rechnung Konto an und verwalten Sie Ihre Rechnungen und Kunden."
	/>
</svelte:head>

<div class="login-container">
	<div class="login-wrapper">
		<!-- Left side - Branding/Info -->
		<div class="brand-section">
			<div class="brand-content">
				<div class="logo-section">
					<span class="logo-icon">📄</span>
					<h1>kostenlose-erechnung.de</h1>
				</div>
				<div class="welcome-text">
					<h2>Willkommen zurück!</h2>
					<p>
						Melden Sie sich an, um Ihre E-Rechnungen zu verwalten und neue
						Kunden anzulegen.
					</p>
				</div>
				<div class="features-list">
					<div class="feature-item">
						<span class="feature-icon">✓</span>
						<span>Unbegrenzte kostenlose E-Rechnungen</span>
					</div>
					<div class="feature-item">
						<span class="feature-icon">✓</span>
						<span>XRechnung & ZUGFeRD konform</span>
					</div>
					<div class="feature-item">
						<span class="feature-icon">✓</span>
						<span>Sichere Cloud-Speicherung</span>
					</div>
					<div class="feature-item">
						<span class="feature-icon">✓</span>
						<span>DSGVO-konform</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Right side - Login Form -->
		<div class="form-section">
			<div class="form-container">
				<div class="form-header">
					<h2>Anmelden</h2>
					<p>Geben Sie Ihre Anmeldedaten ein</p>
				</div>

				{#if error}
					<div
						class="error-message"
						in:fly={{ y: -10, duration: 300 }}
						on:click={clearError}
						role="alert"
					>
						<span class="error-icon">⚠️</span>
						<span>{error}</span>
						<button class="error-close" aria-label="Fehlermeldung schließen"
							>✕</button
						>
					</div>
				{/if}

				<form on:submit|preventDefault={handleLogin} class="login-form">
					<div class="input-group">
						<label for="email">E-Mail-Adresse</label>
						<input
							id="email"
							type="email"
							bind:value={email}
							on:input={clearError}
							placeholder="ihre@email.de"
							required
							autocomplete="email"
							class="input"
							class:error
						/>
					</div>

					<div class="input-group">
						<label for="password">Passwort</label>
						<div class="password-input-wrapper">
							<input
								id="password"
								type={showPassword ? "text" : "password"}
								bind:value={password}
								on:input={clearError}
								on:keydown={handleKeydown}
								placeholder="Ihr Passwort"
								required
								autocomplete="current-password"
								class="input password-input"
								class:error
							/>
							<button
								type="button"
								class="password-toggle"
								on:click={togglePasswordVisibility}
								aria-label={showPassword
									? "Passwort verbergen"
									: "Passwort anzeigen"}
							>
								{showPassword ? "👁️" : "👁️‍🗨️"}
							</button>
						</div>
					</div>

					<div class="form-options">
						<label class="checkbox-label">
							<input
								type="checkbox"
								bind:checked={rememberMe}
								class="checkbox"
							/>
							<span class="checkbox-text">E-Mail merken</span>
						</label>

						<a href="/forgot-password" class="forgot-link"
							>Passwort vergessen?</a
						>
					</div>

					<button
						type="submit"
						class="login-button"
						disabled={loginInProgress || !email || !password}
					>
						{#if loginInProgress}
							<div class="spinner"></div>
							<span>Wird angemeldet...</span>
						{:else}
							<span>Anmelden</span>
						{/if}
					</button>
				</form>

				<div class="form-footer">
					<p>Noch kein Konto?</p>
					<a href="/register" class="register-link">Kostenlos registrieren</a>
				</div>

				<div class="alternative-actions">
					<p class="divider">oder</p>
					<a href="/erstellen" class="guest-link">
						<span>ohne Anmeldung fortfahren</span>
					</a>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	/* Your existing styles are excellent and have been preserved */
	.login-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
	}

	.login-wrapper {
		background: var(--bg-white, #fff);
		border-radius: var(--radius-lg, 12px);
		box-shadow: var(
			--shadow-lg,
			0 10px 15px -3px rgba(0, 0, 0, 0.1),
			0 4px 6px -2px rgba(0, 0, 0, 0.05)
		);
		display: grid;
		grid-template-columns: 1fr 1fr;
		max-width: 1000px;
		width: 100%;
		min-height: 600px;
		overflow: hidden;
	}

	/* Brand Section */
	.brand-section {
		background: linear-gradient(
			135deg,
			var(--text-dark, #1a1a1a) 0%,
			#2a2a2a 100%
		);
		color: var(--bg-white, #fff);
		padding: 3rem;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	.logo-section {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.logo-icon {
		font-size: 2.5rem;
	}

	.logo-section h1 {
		font-size: 1.5rem;
		font-weight: 700;
		margin: 0;
	}

	.welcome-text {
		margin-bottom: 2rem;
	}

	.welcome-text h2 {
		font-size: 2rem;
		font-weight: 700;
		margin: 0 0 1rem 0;
		line-height: 1.2;
	}

	.welcome-text p {
		opacity: 0.9;
		font-size: 1.125rem;
		line-height: 1.6;
		margin: 0;
	}

	.features-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.feature-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.feature-icon {
		color: var(--primary-color, #7bfe84);
		font-weight: 600;
		font-size: 1.125rem;
	}

	/* Form Section */
	.form-section {
		padding: 3rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.form-container {
		width: 100%;
		max-width: 400px;
	}

	.form-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.form-header h2 {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--text-dark, #1a1a1a);
		margin: 0 0 0.5rem 0;
	}

	.form-header p {
		color: var(--text-light, #6c757d);
		margin: 0;
	}

	.error-message {
		background: #f8d7da;
		border: 1px solid #f5c6cb;
		border-radius: var(--radius, 6px);
		padding: 1rem;
		margin-bottom: 1.5rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		color: #721c24;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.error-message:hover {
		background: #f1aeb5;
	}

	.error-close {
		background: none;
		border: none;
		color: inherit;
		cursor: pointer;
		margin-left: auto;
		padding: 0.25rem;
		border-radius: 50%;
		font-size: 0.875rem;
	}

	.login-form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.input-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.input-group label {
		font-weight: 500;
		color: var(--text-dark, #1a1a1a);
		font-size: 0.875rem;
	}

	.input {
		padding: 0.875rem 1rem;
		border: 2px solid var(--border-color, #dee2e6);
		border-radius: var(--radius, 6px);
		font-size: 1rem;
		transition: all 0.3s ease;
		background: var(--bg-white, #fff);
	}

	.input:focus {
		outline: none;
		border-color: var(--primary-color, #7bfe84);
		box-shadow: 0 0 0 3px rgba(123, 254, 132, 0.1);
	}

	.input.error {
		border-color: #dc3545;
	}

	.password-input-wrapper {
		position: relative;
	}

	.password-input {
		padding-right: 3rem;
		width: 100%;
		box-sizing: border-box;
	}

	.password-toggle {
		position: absolute;
		right: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.25rem;
		border-radius: var(--radius, 6px);
		font-size: 1.125rem;
		transition: all 0.3s ease;
	}

	.password-toggle:hover {
		background: var(--bg-light, #f8f9fa);
	}

	.form-options {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin: -0.5rem 0;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		font-size: 0.875rem;
	}

	.checkbox {
		accent-color: var(--primary-color, #7bfe84);
	}

	.forgot-link {
		color: var(--primary-dark, #5cb85c);
		font-size: 0.875rem;
		text-decoration: none;
		transition: color 0.3s ease;
	}

	.forgot-link:hover {
		color: var(--primary-color, #7bfe84);
		text-decoration: underline;
	}

	.login-button {
		background: linear-gradient(
			135deg,
			var(--primary-color, #7bfe84) 0%,
			var(--primary-dark, #5cb85c) 100%
		);
		color: var(--text-dark, #1a1a1a);
		border: none;
		border-radius: var(--radius, 6px);
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

	.login-button:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(123, 254, 132, 0.3);
	}

	.login-button:disabled {
		opacity: 0.7;
		cursor: not-allowed;
		transform: none;
	}

	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(26, 26, 26, 0.3);
		border-top: 2px solid var(--text-dark, #1a1a1a);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.form-footer {
		text-align: center;
		margin-top: 2rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--border-color, #dee2e6);
	}

	.form-footer p {
		color: var(--text-light, #6c757d);
		margin: 0 0 0.5rem 0;
		font-size: 0.875rem;
	}

	.register-link {
		color: var(--primary-dark, #5cb85c);
		font-weight: 600;
		text-decoration: none;
		transition: color 0.3s ease;
	}

	.register-link:hover {
		color: var(--primary-color, #7bfe84);
		text-decoration: underline;
	}

	.alternative-actions {
		margin-top: 1.5rem;
	}

	.divider {
		text-align: center;
		margin: 1.5rem 0;
		color: var(--text-light, #6c757d);
		font-size: 0.875rem;
	}

	.guest-link {
		display: block;
		text-align: center;
		padding: 0.25rem;
		color: var(--text-dark, #1a1a1a);
		text-decoration: none;
	}

	.guest-link:hover {
		text-decoration: underline;
		text-decoration-thickness: 0.1rem;
		text-decoration-color: var(--primary-color, #7bfe84);
	}

	/* Mobile Responsiveness */
	@media (max-width: 992px) {
		.login-wrapper {
			grid-template-columns: 1fr;
			min-height: auto;
		}
		.brand-section {
			display: none; /* Hide the brand section on tablets and smaller screens */
		}
		.form-section {
			padding: 2rem;
		}
	}

	@media (max-width: 480px) {
		.login-container {
			padding: 0;
		}
		.login-wrapper {
			border-radius: 0;
		}
		.form-section {
			padding: 1.5rem;
		}
		.form-header h2 {
			font-size: 1.5rem;
		}
	}
</style>
