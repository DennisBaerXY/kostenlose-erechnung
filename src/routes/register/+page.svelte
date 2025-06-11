<script>
	import { onMount, onDestroy } from "svelte";
	import { goto } from "$app/navigation";
	import { browser } from "$app/environment";
	import { page } from "$app/stores";
	import { fade, fly } from "svelte/transition";

	// Import auth functions
	import {
		signUpUser,
		confirmSignUpUser,
		isAuthenticated,
		authStore
	} from "$lib/stores/authStore.js";
	import { auth } from "$lib/api/auth.js"; // For resend functionality

	// --- Component State ---
	let email = "";
	let password = "";
	let confirmPassword = "";
	let acceptTerms = false;
	let loading = false;
	let error = "";

	// Multi-step registration state
	let registrationStep = "form"; // "form" | "confirmation" | "complete"

	// --- Confirmation-specific state ---
	let confirmationCode = "";
	let confirmationLoading = false;
	let confirmationError = "";

	// --- Resend Cooldown State ---
	let resendCooldown = 0; // Cooldown timer in seconds
	let canResend = true; // Controls if the resend button is clickable
	let cooldownInterval; // Holds the interval ID for the timer

	// Password visibility toggles
	let showPassword = false;
	let showConfirmPassword = false;

	// Check if user came from invoice creation
	let fromInvoiceCreation = false;
	let successMessage = "";

	// --- Validation ---
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

	// --- Lifecycle ---
	onMount(() => {
		if (browser) {
			// Restore and manage cooldown state on page load
			const cooldownEndTime = localStorage.getItem("cooldownEndTime");
			if (cooldownEndTime) {
				const now = new Date().getTime();
				const remainingTime = Math.round((cooldownEndTime - now) / 1000);
				if (remainingTime > 0) {
					startCooldown(remainingTime);
				} else {
					localStorage.removeItem("cooldownEndTime");
				}
			}

			// Check if user came from invoice creation
			const urlParams = $page.url.searchParams;
			fromInvoiceCreation = urlParams.get("from") === "invoice-created";

			if (fromInvoiceCreation) {
				successMessage =
					"🎉 E-Rechnung erfolgreich erstellt und heruntergeladen!";
			}

			// Redirect if already authenticated
			if ($isAuthenticated) {
				goto("/dashboard", { replaceState: true });
			}

			// Pre-fill email from localStorage if available
			const rememberedEmail = localStorage.getItem("remembered_email");
			if (rememberedEmail && !email) {
				email = rememberedEmail;
			}
		}
	});

	// Clear interval when the component is destroyed
	onDestroy(() => {
		if (cooldownInterval) {
			clearInterval(cooldownInterval);
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
				if (browser) {
					localStorage.setItem("remembered_email", email);
				}
				startCooldown(60); // Start a 60-second cooldown for resend
				registrationStep = "confirmation";
			} else {
				// Handle specific Cognito errors
				if (
					result.message?.includes("UsernameExistsException") ||
					result.message?.includes("already exists")
				) {
					error =
						"Ein Konto mit dieser E-Mail-Adresse existiert bereits. Möchten Sie sich stattdessen anmelden?";
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
				registrationStep = "complete";
				const redirectPath = fromInvoiceCreation
					? "/dashboard"
					: "/login?registered=true";

				setTimeout(() => {
					goto(redirectPath);
				}, 2000);
			} else {
				if (result.message?.includes("CodeMismatchException")) {
					confirmationError =
						"Ungültiger Bestätigungscode. Bitte überprüfen Sie den Code aus Ihrer E-Mail.";
				} else if (result.message?.includes("ExpiredCodeException")) {
					confirmationError =
						"Der Bestätigungscode ist abgelaufen. Bitte fordern Sie einen neuen Code an.";
				} else if (result.message?.includes("NotAuthorizedException")) {
					confirmationError =
						"Zu viele Versuche. Bitte warten Sie einen Moment und versuchen Sie es erneut.";
				} else {
					confirmationError =
						result.message ||
						"Bestätigung fehlgeschlagen. Bitte versuchen Sie es erneut.";
				}
			}
		} catch (err) {
			console.error("Confirmation error:", err);
			confirmationError =
				"Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.";
		} finally {
			confirmationLoading = false;
		}
	}

	// --- Cooldown Logic ---
	function startCooldown(seconds) {
		canResend = false;
		resendCooldown = seconds;
		const endTime = new Date().getTime() + seconds * 1000;
		if (browser) {
			localStorage.setItem("cooldownEndTime", endTime);
		}

		cooldownInterval = setInterval(() => {
			resendCooldown -= 1;
			if (resendCooldown <= 0) {
				clearInterval(cooldownInterval);
				canResend = true;
				if (browser) {
					localStorage.removeItem("cooldownEndTime");
				}
			}
		}, 1000);
	}

	// --- Resend Code Handler ---
	async function handleResendCode() {
		if (!canResend) return;

		confirmationLoading = true;
		confirmationError = "";

		try {
			const result = await auth.resendConfirmation(email);

			if (result.success) {
				startCooldown(60); // Start a 60-second cooldown
				confirmationError = "✅ Ein neuer Code wurde gesendet!";
				setTimeout(() => {
					if (confirmationError === "✅ Ein neuer Code wurde gesendet!") {
						confirmationError = "";
					}
				}, 4000);
			} else {
				// Handle specific Cognito error for rate limiting
				if (result.message?.includes("LimitExceededException")) {
					confirmationError =
						"Zu viele Anfragen. Bitte versuchen Sie es später erneut.";
				} else {
					confirmationError = result.message || "Fehler beim Senden des Codes.";
				}
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

	function goBackToForm() {
		registrationStep = "form";
		confirmationError = "";
		confirmationCode = "";
	}

	function goToLogin() {
		goto("/login");
	}

	// Auto-focus the confirmation input when the step changes
	$: if (registrationStep === "confirmation" && browser) {
		setTimeout(() => {
			const codeInput = document.getElementById("confirmation-code");
			if (codeInput) {
				codeInput.focus();
			}
		}, 100);
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
		{#if fromInvoiceCreation && successMessage}
			<div class="success-banner" in:fly={{ y: -20, duration: 300 }}>
				<span>{successMessage}</span>
			</div>
		{/if}

		<div class="benefits-section">
			<div class="benefits-content">
				<div class="benefits-header">
					<h2>Warum kostenlose-erechnung.de?</h2>
					<p>Made in Germany mit 💚</p>
				</div>
				<div class="benefits-list">
					<div class="benefit-item">
						<div class="benefit-icon">✓</div>
						<div class="benefit-text">
							<h3>Komplett kostenlos</h3>
							<p>
								Keine versteckten Kosten, keine Limitierungen bei der
								Grundfunktion
							</p>
						</div>
					</div>
					<div class="benefit-item">
						<div class="benefit-icon">✓</div>
						<div class="benefit-text">
							<h3>Sofort einsatzbereit</h3>
							<p>Erstellen Sie Ihre erste E-Rechnung in unter 5 Minuten</p>
						</div>
					</div>
					<div class="benefit-item">
						<div class="benefit-icon">✓</div>
						<div class="benefit-text">
							<h3>Gesetzeskonform</h3>
							<p>XRechnung und ZUGFeRD - alle Standards für B2B und B2G</p>
						</div>
					</div>
					<div class="benefit-item">
						<div class="benefit-icon">✓</div>
						<div class="benefit-text">
							<h3>DSGVO-konform</h3>
							<p>Deutsche Server, höchste Sicherheitsstandards</p>
						</div>
					</div>
					<div class="benefit-item">
						<div class="benefit-icon">✓</div>
						<div class="benefit-text">
							<h3>Professionell</h3>
							<p>Saubere, normkonforme Rechnungen für Ihr Business</p>
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
				{#key registrationStep}
					{#if registrationStep === "form"}
						<div
							in:fly={{ y: 20, duration: 400, delay: 100 }}
							out:fly={{ y: -20, duration: 300 }}
						>
							<div class="form-header">
								<h2>Kostenloses Konto erstellen</h2>
								<p>
									{#if fromInvoiceCreation}
										Speichern Sie Ihre Rechnung und verwalten Sie künftige
										Rechnungen einfacher
									{:else}
										Starten Sie in wenigen Minuten mit professionellen
										E-Rechnungen
									{/if}
								</p>
							</div>

							{#if error}
								<div
									class="error-message"
									on:click={clearError}
									in:fly={{ y: -10, duration: 300 }}
								>
									<span>{error}</span>
									<button
										class="error-close"
										aria-label="Fehlermeldung schließen">✕</button
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

									{#if password}
										<div
											class="password-requirements"
											in:fade={{ duration: 200 }}
										>
											<small class="requirement" class:met={hasMinLength}>
												{hasMinLength ? "✔" : "❌"} Mindestens 8 Zeichen
											</small>
											<small class="requirement" class:met={hasUpperCase}>
												{hasUpperCase ? "✔" : "❌"} Großbuchstabe
											</small>
											<small class="requirement" class:met={hasLowerCase}>
												{hasLowerCase ? "✔" : "❌"} Kleinbuchstabe
											</small>
											<small class="requirement" class:met={hasNumber}>
												{hasNumber ? "✔" : "❌"} Zahl
											</small>
											<small class="requirement" class:met={hasSpecialChar}>
												{hasSpecialChar ? "✔" : "❌"} Sonderzeichen
											</small>
										</div>
									{/if}
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
										<span class="checkbox-text">
											Ich akzeptiere die <a href="/agb" target="_blank">AGB</a>
											und die
											<a href="/datenschutz" target="_blank"
												>Datenschutzerklärung</a
											>
										</span>
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
								<a href="/login" class="login-link">Jetzt anmelden</a>
							</div>

							{#if fromInvoiceCreation}
								<div class="alternative-actions">
									<p class="divider">oder</p>
									<a href="/erstellen" class="skip-link">
										<span>Später registrieren und neue Rechnung erstellen</span>
									</a>
								</div>
							{/if}
						</div>
					{:else if registrationStep === "confirmation"}
						<div
							class="confirmation-step"
							in:fly={{ y: 20, duration: 400, delay: 100 }}
							out:fly={{ y: -20, duration: 300 }}
						>
							<div class="confirmation-header">
								<div class="email-icon">📧</div>
								<h2>E-Mail bestätigen</h2>
								<p>
									Ein 6-stelliger Code wurde an <strong>{email}</strong> gesendet.
								</p>
								<div class="success-hint">
									<span class="success-icon">✅</span>
									<span
										>Registrierung erfolgreich! Prüfen Sie Ihr E-Mail-Postfach.</span
									>
								</div>
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
										inputmode="numeric"
										bind:value={confirmationCode}
										placeholder="123456"
										maxlength="6"
										pattern="[0-9]{'{'}6{'}'}"
										class="input code-input"
										disabled={confirmationLoading}
										autocomplete="one-time-code"
									/>
									<small class="input-hint"
										>6-stelliger Code aus der E-Mail</small
									>
								</div>

								{#if confirmationError}
									<div
										class="error-message small"
										class:success={confirmationError.startsWith("✅")}
										transition:fly={{ y: -10, duration: 200 }}
									>
										<span>{confirmationError}</span>
									</div>
								{/if}

								<button
									type="submit"
									class="register-button"
									style="width: 100%;"
									disabled={confirmationLoading ||
										confirmationCode.length !== 6}
								>
									{#if confirmationLoading && !confirmationError.startsWith("✅")}
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
									disabled={!canResend || confirmationLoading}
								>
									{#if !canResend}
										Erneut senden in {resendCooldown}s
									{:else}
										Code erneut senden
									{/if}
								</button>
								<button class="link-btn" on:click={goBackToForm}>
									← Zurück zur Registrierung
								</button>
							</div>
						</div>
					{:else if registrationStep === "complete"}
						<div class="success-state" in:fly={{ y: 20, duration: 400 }}>
							<div class="success-icon-large">🎉</div>
							<h2>Willkommen bei kostenlose-erechnung.de!</h2>
							<p>
								Ihr Konto wurde erfolgreich erstellt.
								{#if fromInvoiceCreation}
									Sie werden zu Ihrem Dashboard weitergeleitet.
								{:else}
									Sie werden zur Anmeldung weitergeleitet.
								{/if}
							</p>
							<div class="loading-dots">
								<span />
								<span />
								<span />
							</div>
						</div>
					{/if}
				{/key}
			</div>
		</div>
	</div>
</div>

<style>
	/* Base Styles (unchanged) */
	.register-container {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
		overflow: hidden;
	}
	.success-banner {
		background: #d4edda;
		color: #155724;
		padding: 1rem 2rem;
		border-radius: var(--radius);
		margin-bottom: 1rem;
		border: 1px solid #c3e6cb;
		text-align: center;
		font-weight: 500;
		width: 100%;
		max-width: 1100px;
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

	/* Benefits Section (unchanged) */
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

	/* Form Section (unchanged) */
	.form-section {
		padding: 3rem;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
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
		line-height: 1.5;
	}

	/* Error Handling (unchanged) */
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
		position: relative;
	}
	.error-message.small {
		padding: 0.75rem;
		font-size: 0.9rem;
		margin-top: 1rem;
	}
	.error-message.success {
		background: #d4edda;
		border-color: #c3e6cb;
		color: #155724;
		cursor: default;
	}
	.error-close {
		background: none;
		border: none;
		color: inherit;
		cursor: pointer;
		margin-left: auto;
		padding: 0.25rem;
	}
	.error-actions {
		position: absolute;
		bottom: -2.5rem;
		left: 0;
		right: 0;
	}

	/* Form Styling (unchanged) */
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
		box-sizing: border-box;
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
	.password-requirements {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.25rem;
	}
	.requirement {
		font-size: 0.75rem;
		color: #dc3545;
		transition: color 0.3s ease;
	}
	.requirement.met {
		color: #28a745;
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

	/* Buttons (unchanged) */
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
	.link-btn {
		background: none;
		border: none;
		color: #6c757d;
		font-size: 0.9rem;
		cursor: pointer;
		transition: color 0.2s ease;
		text-decoration: none;
		padding: 0.5rem;
	}
	.link-btn:hover:not(:disabled) {
		color: #1a1a1a;
		text-decoration: underline;
	}
	.link-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
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

	/* Footer (unchanged) */
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
	.alternative-actions {
		margin-top: 1.5rem;
	}
	.divider {
		text-align: center;
		margin: 1.5rem 0;
		color: var(--text-light);
		font-size: 0.875rem;
	}
	.skip-link {
		display: block;
		text-align: center;
		padding: 0.25rem;
		color: var(--text-dark);
		text-decoration: none;
		font-size: 0.875rem;
	}
	.skip-link:hover {
		text-decoration: underline;
		text-decoration-thickness: 0.1rem;
		text-decoration-color: var(--primary-color);
	}

	/* Success States (unchanged) */
	.success-state {
		text-align: center;
		padding: 2rem 0;
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

	/* --- MODIFIED: Confirmation Step --- */
	.confirmation-step {
		padding: 1rem 0; /* Adjusted padding */
		text-align: center;
		display: flex;
		flex-direction: column;
		justify-content: center;
		height: 100%; /* Ensure it takes full height of the container */
	}
	.confirmation-header {
		margin-bottom: 2rem;
	}
	.email-icon {
		font-size: 3.5rem; /* Slightly smaller icon */
		margin-bottom: 1rem;
	}
	.confirmation-header h2 {
		font-size: 1.5rem; /* Adjusted font size */
		font-weight: 700;
		color: #1a1a1a;
		margin: 0 0 0.75rem 0;
	}
	.confirmation-header p {
		color: #6c757d;
		margin: 0 auto 1.5rem auto; /* Added margin and auto for centering */
		line-height: 1.6;
		max-width: 90%; /* Prevent text from touching edges */
	}
	.success-hint {
		display: inline-flex; /* Use inline-flex for better alignment */
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		background: #e6f9e9; /* Lighter success color */
		color: #155724;
		padding: 0.75rem 1.25rem;
		border-radius: var(--radius);
		font-size: 0.875rem;
		font-weight: 500;
		border: 1px solid #c3e6cb;
	}
	.success-icon {
		font-size: 1rem;
	}
	.confirmation-form {
		max-width: 320px; /* Wider form area */
		margin: 0 auto 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem; /* Added gap between form elements */
	}
	.code-input {
		text-align: center;
		font-size: 1.75rem; /* Larger font for code */
		font-weight: 600;
		letter-spacing: 0.75rem; /* Increased letter spacing */
		font-family: monospace;
		padding: 1rem 0.75rem;
	}
	.code-input::placeholder {
		letter-spacing: normal;
	}
	.input-hint {
		color: var(--text-light);
		font-size: 0.8rem;
		text-align: center;
		margin-top: 0.25rem;
	}
	.confirmation-footer {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		align-items: center;
		margin-top: 1rem; /* Add space above footer */
	}

	/* --- MODIFIED: Responsive Design --- */
	@media (max-width: 992px) {
		/* Changed breakpoint for better layout */
		.register-wrapper {
			grid-template-columns: 1fr;
			min-height: auto;
		}
		.benefits-section {
			order: 2; /* Move benefits below form on mobile */
			text-align: center;
		}
		.benefit-item {
			text-align: left;
		}
		.trust-indicators {
			justify-content: center;
		}
		.form-section,
		.benefits-section {
			padding: 2.5rem;
		}
	}
	@media (max-width: 480px) {
		.register-container {
			padding: 0;
		}
		.register-wrapper {
			border-radius: 0;
		}
		.form-section,
		.benefits-section {
			padding: 2rem 1.5rem;
		}
		.success-banner {
			margin: 0;
			border-radius: 0;
			border-left: none;
			border-right: none;
		}
	}
</style>
