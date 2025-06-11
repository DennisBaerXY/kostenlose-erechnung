<script>
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { browser } from "$app/environment";
	import { fade, fly } from "svelte/transition";

	// Import the auth functions from the more detailed authStore
	import {
		signUpUser,
		confirmSignUpUser,
		resendConfirmationCode,
		isAuthenticated
	} from "$lib/stores/authStore.js";

	// State variables merged from the modal and the original page
	let email = "";
	let password = "";
	let confirmPassword = "";
	let acceptTerms = false;
	let loading = false;
	let error = "";

	// Multi-step registration state
	let registrationStep = "form"; // "form" | "success" | "confirmation" | "complete"

	// Confirmation-specific state
	let confirmationCode = "";
	let confirmationLoading = false;
	let confirmationError = "";

	// Password visibility toggles
	let showPassword = false;
	let showConfirmPassword = false;

	// --- Validation ---
	// Combined validation logic similar to the modal
	$: passwordsMatch = password === confirmPassword;
	$: hasMinLength = password.length >= 8;
	$: hasUpperCase = /[A-Z]/.test(password);
	$: hasLowerCase = /[a-z]/.test(password);
	$: hasNumber = /[0-9]/.test(password);
	$: hasSpecialChar = /[^A-Za-z0-9]/.test(password);
	$: isPasswordStrong =
		hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
	$: isFormValid =
		email &&
		password &&
		confirmPassword &&
		passwordsMatch &&
		acceptTerms &&
		isPasswordStrong;

	// Redirect if already authenticated
	onMount(() => {
		if (browser && $isAuthenticated) {
			goto("/dashboard", { replaceState: true });
		}
	});

	// --- Main Registration Handler ---
	async function handleRegister() {
		if (!isFormValid) {
			error =
				"Bitte füllen Sie alle Felder korrekt aus und stellen Sie sicher, dass das Passwort den Anforderungen entspricht.";
			return;
		}

		loading = true;
		error = "";

		try {
			const result = await signUpUser(email, password);

			if (result.success) {
				// Registration successful, show success state
				registrationStep = "success";

				// Auto-transition to the confirmation code input after 3 seconds
				setTimeout(() => {
					registrationStep = "confirmation";
				}, 3000);
			} else {
				// Handle specific Cognito errors from the modal logic
				if (result.message?.includes("UsernameExistsException")) {
					error = "Ein Konto mit dieser E-Mail-Adresse existiert bereits.";
				} else if (result.message?.includes("InvalidPasswordException")) {
					error =
						"Das Passwort entspricht nicht den Sicherheitsanforderungen. Bitte verwenden Sie mindestens 8 Zeichen mit Groß- und Kleinbuchstaben, Zahlen und Sonderzeichen.";
				} else if (result.message?.includes("InvalidParameterException")) {
					error =
						"Ungültige E-Mail-Adresse. Bitte überprüfen Sie Ihre Eingabe.";
				} else {
					error =
						result.message ||
						"Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.";
				}
			}
		} catch (err) {
			console.error("Registration error:", err);
			error =
				"Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.";
		} finally {
			loading = false;
		}
	}

	// --- Confirmation Code Handler ---
	async function handleConfirmation() {
		if (!confirmationCode || confirmationCode.length !== 6) {
			confirmationError =
				"Bitte geben Sie den 6-stelligen Bestätigungscode ein.";
			return;
		}

		confirmationLoading = true;
		confirmationError = "";

		try {
			const result = await confirmSignUpUser(email, confirmationCode);

			if (result.success) {
				// Registration and confirmation complete
				registrationStep = "complete";

				// Redirect to login page with a success indicator after 2 seconds
				setTimeout(() => {
					goto("/login?registered=true");
				}, 2000);
			} else {
				// Handle specific confirmation errors
				if (result.message?.includes("CodeMismatchException")) {
					confirmationError =
						"Ungültiger Bestätigungscode. Bitte überprüfen Sie den Code.";
				} else if (result.message?.includes("ExpiredCodeException")) {
					confirmationError =
						"Der Code ist abgelaufen. Bitte fordern Sie einen neuen an.";
				} else if (result.message?.includes("NotAuthorizedException")) {
					confirmationError =
						"Zu viele Versuche. Bitte warten Sie einen Moment.";
				} else {
					confirmationError =
						result.message ||
						"Bestätigung fehlgeschlagen. Bitte versuchen Sie es erneut.";
				}
			}
		} catch (err) {
			console.error("Confirmation error:", err);
			confirmationError = "Ein unerwarteter Fehler ist aufgetreten.";
		} finally {
			confirmationLoading = false;
		}
	}

	// --- Resend Code Handler ---
	async function handleResendCode() {
		confirmationLoading = true;
		confirmationError = "";
		try {
			const result = await resendConfirmationCode(email);
			if (result.success) {
				// Provide temporary feedback
				confirmationError = "Ein neuer Code wurde gesendet!";
				setTimeout(() => {
					if (confirmationError === "Ein neuer Code wurde gesendet!") {
						confirmationError = "";
					}
				}, 3000);
			} else {
				confirmationError = result.message || "Fehler beim Senden des Codes.";
			}
		} catch (err) {
			console.error("Resend error:", err);
			confirmationError = "Fehler beim Senden des Codes.";
		} finally {
			confirmationLoading = false;
		}
	}

	// --- Helper Functions ---
	function clearError() {
		error = "";
		confirmationError = "";
	}

	function togglePasswordVisibility(field) {
		if (field === "password") {
			showPassword = !showPassword;
		} else {
			showConfirmPassword = !showConfirmPassword;
		}
	}
</script>

<svelte:head>
	<title>Registrieren | kostenlose-erechnung.de</title>
	<meta
		name="description"
		content="Erstellen Sie Ihr kostenloses Konto für E-Rechnungen und verwalten Sie Ihre Kunden und Rechnungen professionell."
	/>
</svelte:head>

<div class="register-container">
	<div class="register-wrapper">
		<div class="benefits-section">
			<div class="benefits-content">
				<div class="benefits-header">
					<h2>Warum kostenlose-erechnung.de?</h2>
					<p>Professionelle E-Rechnungen für alle, gemacht in Deutschland ❤️</p>
				</div>
				<div class="benefits-list">
					<div class="benefit-item">
						<div class="benefit-icon">🆓</div>
						<div class="benefit-text">
							<h3>Komplett kostenlos</h3>
							<p>
								Keine versteckten Kosten, keine Limitierungen bei der
								Grundfunktion
							</p>
						</div>
					</div>
					<div class="benefit-item">
						<div class="benefit-icon">⚡</div>
						<div class="benefit-text">
							<h3>Sofort einsatzbereit</h3>
							<p>Erstellen Sie Ihre erste E-Rechnung in unter 5 Minuten</p>
						</div>
					</div>
					<div class="benefit-item">
						<div class="benefit-icon">✅</div>
						<div class="benefit-text">
							<h3>Gesetzeskonform</h3>
							<p>XRechnung und ZUGFeRD - alle Standards für B2B und B2G</p>
						</div>
					</div>
					<div class="benefit-item">
						<div class="benefit-icon">🔒</div>
						<div class="benefit-text">
							<h3>DSGVO-konform</h3>
							<p>Deutsche Server, höchste Sicherheitsstandards</p>
						</div>
					</div>
					<div class="benefit-item">
						<div class="benefit-icon">💼</div>
						<div class="benefit-text">
							<h3>Professionell</h3>
							<p>Saubere, normkonforme Rechnungen für Ihr Business</p>
						</div>
					</div>
					<div class="benefit-item">
						<div class="benefit-icon">📱</div>
						<div class="benefit-text">
							<h3>Überall verfügbar</h3>
							<p>Funktioniert auf Desktop, Tablet und Smartphone</p>
						</div>
					</div>
				</div>
				<div class="trust-indicators">
					<div class="trust-item">
						<span class="trust-badge">🇩🇪 Made in Germany</span>
					</div>
					<div class="trust-item">
						<span class="trust-badge">🔐 SSL-verschlüsselt</span>
					</div>
					<div class="trust-item">
						<span class="trust-badge">⚡ Sofort aktiv</span>
					</div>
				</div>
			</div>
		</div>

		<div class="form-section">
			<div class="form-container">
				{#if registrationStep === "form"}
					<div
						in:fade={{ duration: 300, delay: 300 }}
						out:fade={{ duration: 200 }}
					>
						<div class="form-header">
							<h2>Kostenloses Konto erstellen</h2>
							<p>
								Starten Sie in wenigen Minuten mit professionellen E-Rechnungen
							</p>
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

						<form
							on:submit|preventDefault={handleRegister}
							class="register-form"
						>
							<div class="input-group">
								<label for="email">E-Mail-Adresse *</label>
								<input
									id="email"
									type="email"
									bind:value={email}
									on:input={clearError}
									placeholder="max@mustermann.de"
									required
									autocomplete="email"
									class="input"
									disabled={loading}
								/>
							</div>

							<div class="input-group">
								<label for="password">Passwort *</label>
								<div class="password-input-wrapper">
									<input
										id="password"
										type={showPassword ? "text" : "password"}
										bind:value={password}
										on:input={clearError}
										placeholder="Mindestens 8 Zeichen"
										required
										autocomplete="new-password"
										class="input password-input"
										disabled={loading}
									/>
									<button
										type="button"
										class="password-toggle"
										on:click={() => togglePasswordVisibility("password")}
										aria-label={showPassword
											? "Passwort verbergen"
											: "Passwort anzeigen"}
									>
										{showPassword ? "👁️" : "👁️‍🗨️"}
									</button>
								</div>
								<small class="password-hint"
									>Muss Groß- & Kleinbuchstaben, Zahlen und Sonderzeichen
									enthalten.</small
								>
							</div>

							<div class="input-group">
								<label for="confirmPassword">Passwort bestätigen *</label>
								<div class="password-input-wrapper">
									<input
										id="confirmPassword"
										type={showConfirmPassword ? "text" : "password"}
										bind:value={confirmPassword}
										on:input={clearError}
										placeholder="Passwort wiederholen"
										required
										autocomplete="new-password"
										class="input password-input"
										class:error={confirmPassword && !passwordsMatch}
										disabled={loading}
									/>
									<button
										type="button"
										class="password-toggle"
										on:click={() => togglePasswordVisibility("confirm")}
										aria-label={showConfirmPassword
											? "Passwort verbergen"
											: "Passwort anzeigen"}
									>
										{showConfirmPassword ? "👁️" : "👁️‍🗨️"}
									</button>
								</div>
								{#if confirmPassword && !passwordsMatch}
									<small class="validation-error"
										>Passwörter stimmen nicht überein</small
									>
								{/if}
							</div>

							<div class="terms-section">
								<label class="checkbox-label">
									<input
										type="checkbox"
										bind:checked={acceptTerms}
										class="checkbox"
										required
										disabled={loading}
									/>
									<span class="checkbox-text"
										>Ich akzeptiere die <a href="/agb" target="_blank">AGB</a>
										und die
										<a href="/datenschutz" target="_blank"
											>Datenschutzerklärung</a
										></span
									>
								</label>
							</div>

							<button
								type="submit"
								class="register-button"
								disabled={loading || !isFormValid}
							>
								{#if loading}
									<div class="spinner"></div>
									<span>Konto wird erstellt...</span>
								{:else}
									<span>Kostenloses Konto erstellen</span>
								{/if}
							</button>
						</form>

						<div class="form-footer">
							<p>Bereits ein Konto?</p>
							<a href="/login" class="login-link"> Jetzt anmelden </a>
						</div>
					</div>
				{:else if registrationStep === "success"}
					<div class="success-state" in:fade={{ duration: 300 }}>
						<div class="success-icon">✅</div>
						<h2>Registrierung erfolgreich!</h2>
						<p>
							Wir haben Ihnen eine E-Mail mit einem Bestätigungscode gesendet.
						</p>
						<div class="loading-dots">
							<span></span><span></span><span></span>
						</div>
					</div>
				{:else if registrationStep === "confirmation"}
					<div class="confirmation-step" in:fade={{ duration: 300 }}>
						<div class="confirmation-header">
							<div class="email-icon">📧</div>
							<h2>E-Mail bestätigen</h2>
							<p>
								Wir haben einen 6-stelligen Code an <strong>{email}</strong> gesendet.
							</p>
						</div>
						<form
							on:submit|preventDefault={handleConfirmation}
							class="confirmation-form"
						>
							<div class="input-group">
								<label for="confirmation-code">Bestätigungscode</label>
								<input
									id="confirmation-code"
									type="text"
									bind:value={confirmationCode}
									placeholder="123456"
									maxlength="6"
									pattern="[0-9]{6}"
									required
									class="input code-input"
									disabled={confirmationLoading}
								/>
							</div>

							{#if confirmationError}
								<div
									class="error-message small"
									in:fly={{ y: -10, duration: 200 }}
								>
									{confirmationError}
								</div>
							{/if}

							<button
								type="submit"
								class="register-button"
								disabled={confirmationLoading || confirmationCode.length !== 6}
							>
								{#if confirmationLoading && !confirmationError}
									<div class="spinner"></div>
									<span>Wird bestätigt...</span>
								{:else}
									E-Mail bestätigen
								{/if}
							</button>
						</form>
						<div class="confirmation-footer">
							<button
								class="link-btn"
								on:click={handleResendCode}
								disabled={confirmationLoading}>Code erneut senden</button
							>
						</div>
					</div>
				{:else if registrationStep === "complete"}
					<div class="success-state" in:fade={{ duration: 300 }}>
						<div class="success-icon-large">🎉</div>
						<h2>Willkommen!</h2>
						<p>
							Ihr Konto wurde erfolgreich erstellt. Sie werden zur Anmeldung
							weitergeleitet.
						</p>
						<div class="loading-dots">
							<span></span><span></span><span></span>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	/* Existing styles from register/+page.svelte */
	.register-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
	}
	.register-wrapper {
		background: var(--bg-white);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
		display: grid;
		grid-template-columns: 1fr 1fr;
		max-width: 1100px;
		width: 100%;
		min-height: 700px;
		overflow: hidden;
	}
	.form-section {
		padding: 3rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.form-container {
		width: 100%;
		max-width: 450px;
	}
	.form-header {
		text-align: center;
		margin-bottom: 2rem;
	}
	.form-header h2 {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--text-dark);
		margin: 0 0 0.5rem 0;
	}
	.form-header p {
		color: var(--text-light);
		margin: 0;
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
	.error-message.small {
		padding: 0.75rem;
		font-size: 0.9rem;
	}
	.error-close {
		background: none;
		border: none;
		color: inherit;
		cursor: pointer;
		margin-left: auto;
		padding: 0.25rem;
	}
	.register-form {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
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
		width: 100%;
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
	.input.error {
		border-color: #dc3545;
	}
	.password-input-wrapper {
		position: relative;
	}
	.password-input {
		padding-right: 3rem;
		width: 100%;
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
	}
	.password-hint {
		font-size: 0.75rem;
		color: #6c757d;
	}
	.validation-error {
		color: #dc3545;
		font-size: 0.75rem;
		margin-top: 0.25rem;
	}
	.terms-section {
		margin: 0.25rem 0;
	}
	.checkbox-label {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		cursor: pointer;
		font-size: 0.875rem;
		line-height: 1.5;
	}
	.checkbox {
		accent-color: var(--primary-color);
		margin-top: 0.25rem;
		flex-shrink: 0;
	}
	.checkbox-text a {
		color: var(--primary-dark);
		text-decoration: none;
	}
	.checkbox-text a:hover {
		text-decoration: underline;
	}
	.register-button {
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
	.register-button:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(123, 254, 132, 0.3);
	}
	.register-button:disabled {
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
	.form-footer {
		text-align: center;
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--border-color);
	}
	.form-footer p {
		color: var(--text-light);
		margin: 0 0 0.5rem 0;
		font-size: 0.875rem;
	}
	.login-link {
		color: var(--primary-dark);
		font-weight: 600;
		text-decoration: none;
	}
	.login-link:hover {
		text-decoration: underline;
	}
	.benefits-section {
		background: linear-gradient(135deg, var(--text-dark) 0%, #2a2a2a 100%);
		color: var(--bg-white);
		padding: 3rem;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}
	.benefits-header {
		margin-bottom: 2rem;
	}
	.benefits-header h2 {
		font-size: 1.75rem;
		font-weight: 700;
		margin: 0 0 1rem 0;
	}
	.benefits-header p {
		opacity: 0.9;
		margin: 0;
	}
	.benefits-list {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		margin-bottom: 2rem;
	}
	.benefit-item {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
	}
	.benefit-icon {
		font-size: 1.5rem;
		flex-shrink: 0;
	}
	.benefit-text h3 {
		font-size: 1rem;
		font-weight: 600;
		margin: 0 0 0.25rem 0;
	}
	.benefit-text p {
		font-size: 0.875rem;
		opacity: 0.9;
		margin: 0;
		line-height: 1.5;
	}
	.trust-indicators {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}
	.trust-badge {
		background: rgba(123, 254, 132, 0.2);
		color: var(--primary-color);
		padding: 0.5rem 1rem;
		border-radius: 50px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	/* New styles from RegistrationModal for success/confirmation states */
	.success-state {
		text-align: center;
		padding: 2rem 0;
	}
	.success-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}
	.success-icon-large {
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

	/* Confirmation Step */
	.confirmation-step {
		padding: 2rem 0;
		text-align: center;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}
	.confirmation-header {
		margin-bottom: 2rem;
	}
	.email-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}
	.confirmation-header h2 {
		font-size: 1.75rem;
		font-weight: 700;
		color: #1a1a1a;
		margin: 0 0 1rem 0;
	}
	.confirmation-header p {
		color: #6c757d;
		margin: 0;
		line-height: 1.6;
	}
	.confirmation-form {
		max-width: 300px;
		margin: 0 auto 1.5rem;
	}
	.code-input {
		text-align: center;
		font-size: 1.25rem;
		font-weight: 600;
		letter-spacing: 0.5rem;
		font-family: monospace;
		padding: 0.875rem 0.5rem;
	}
	.confirmation-footer {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		align-items: center;
	}
	.link-btn {
		background: none;
		border: none;
		color: #6c757d;
		font-size: 0.9rem;
		cursor: pointer;
		transition: color 0.2s ease;
	}
	.link-btn:hover:not(:disabled) {
		color: #1a1a1a;
		text-decoration: underline;
	}
	.link-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.register-wrapper {
			grid-template-columns: 1fr;
		}
		.benefits-section {
			order: -1;
		}
		.benefits-content {
			text-align: center;
		}
		.benefit-item {
			display: flex;
		}
		.benefit-item .benefit-text {
			flex: 1;
			text-align: left;
		}
		.form-section,
		.benefits-section {
			padding: 2rem;
		}
	}
	@media (max-width: 480px) {
		.register-container {
			padding: 0.5rem;
		}
		.form-section,
		.benefits-section {
			padding: 1.5rem;
		}
	}
</style>
