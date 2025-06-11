<!-- src/lib/components/RegistrationModal.svelte - FUNCTIONAL VERSION -->
<script>
	import { createEventDispatcher, onMount } from "svelte";
	import { fade, fly, scale } from "svelte/transition";
	import { goto } from "$app/navigation";

	// Import the auth functions
	import { signUpUser } from "$lib/stores/authStore.js";

	export let show = false;
	export let justCreatedInvoice = null;

	const dispatch = createEventDispatcher();

	let email = "";
	let password = "";
	let confirmPassword = "";
	let acceptTerms = false;
	let loading = false;
	let transition = false;
	let error = "";
	let registrationStep = "form"; // "form" | "success" | "confirmation"
	let confirmationCode = "";
	let confirmationLoading = false;
	let confirmationError = "";

	// Password validation
	$: passwordsMatch = password === confirmPassword;
	$: isFormValid =
		email &&
		password &&
		confirmPassword &&
		passwordsMatch &&
		acceptTerms &&
		password.length >= 8;

	async function handleRegister() {
		if (!isFormValid) {
			error = "Bitte füllen Sie alle Felder korrekt aus.";
			return;
		}

		loading = true;
		error = "";

		try {
			const result = await signUpUser(email, password);

			if (result.success) {
				// Registration successful - show success state
				registrationStep = "success";

				// Auto-transition to confirmation after 3 seconds
				setTimeout(() => {
					registrationStep = "confirmation";
				}, 3000);
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

	async function handleConfirmation() {
		if (!confirmationCode || confirmationCode.length !== 6) {
			confirmationError =
				"Bitte geben Sie den 6-stelligen Bestätigungscode ein.";
			return;
		}

		confirmationLoading = true;
		confirmationError = "";

		try {
			// Import the confirmation function
			const { confirmSignUpUser } = await import("$lib/stores/authStore.js");
			const result = await confirmSignUpUser(email, confirmationCode);

			if (result.success) {
				// Registration and confirmation complete
				const userData = {
					email,
					tier: "free",
					invoices: justCreatedInvoice ? [justCreatedInvoice] : [],
					registeredAt: new Date().toISOString()
				};

				// Save to localStorage as backup
				localStorage.setItem("user_backup", JSON.stringify(userData));

				// Dispatch success event
				dispatch("registered", userData);

				// Show success message and redirect
				registrationStep = "complete";
				setTimeout(() => {
					skipRegistration(); // Close modal
					goto("/login?registered=true");
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

	async function resendConfirmationCode() {
		try {
			// Import the resend function

			const result = await auth.resendConfirmation(email);

			if (result.success) {
				confirmationError = "";
				// Show success message briefly
				const tempSuccess = "Neuer Bestätigungscode wurde gesendet!";
				confirmationError = "";
				setTimeout(() => {
					if (confirmationError === tempSuccess) confirmationError = "";
				}, 3000);
			} else {
				confirmationError = result.message || "Fehler beim Senden des Codes.";
			}
		} catch (err) {
			console.error("Resend error:", err);
			confirmationError = "Fehler beim Senden des Codes.";
		}
	}

	function skipRegistration() {
		dispatch("skip");
		transition = false;
		show = false;
		resetForm();
	}

	function goToLogin() {
		skipRegistration();
		goto("/login");
	}

	function resetForm() {
		email = "";
		password = "";
		confirmPassword = "";
		confirmationCode = "";
		acceptTerms = false;
		error = "";
		confirmationError = "";
		registrationStep = "form";
	}

	function goBackToForm() {
		registrationStep = "form";
		confirmationError = "";
	}

	onMount(() => {
		transition = true;

		// Pre-fill email if available from localStorage
		const rememberedEmail = localStorage.getItem("remembered_email");
		if (rememberedEmail && !email) {
			email = rememberedEmail;
		}
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
			{#if registrationStep === "form"}
				<!-- Registration Form -->
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
						<h2>Rechnung erfolgreich erstellt!</h2>
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

				<div class="content">
					<div class="form-column">
						<div class="form-header">
							<h3>Nie wieder Daten eingeben</h3>
							<p>
								Erstellen Sie ein kostenloses Konto und speichern Sie Zeit bei
								jeder Rechnung.
							</p>
						</div>

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
									disabled={loading}
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
									disabled={loading}
								/>
								<small class="password-hint">
									Mindestens 8 Zeichen mit Groß- und Kleinbuchstaben, Zahlen und
									Sonderzeichen
								</small>
							</div>

							<div class="input-group">
								<label for="confirm-password">Passwort bestätigen</label>
								<input
									id="confirm-password"
									type="password"
									bind:value={confirmPassword}
									placeholder="Passwort wiederholen"
									minlength="8"
									required
									class="input"
									class:error={confirmPassword && !passwordsMatch}
									disabled={loading}
								/>
								{#if confirmPassword && !passwordsMatch}
									<small class="error-text"
										>Passwörter stimmen nicht überein</small
									>
								{/if}
							</div>

							<div class="checkbox-group">
								<label class="checkbox-label">
									<input
										type="checkbox"
										bind:checked={acceptTerms}
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

							{#if error}
								<div class="error" in:fly={{ y: -10, duration: 200 }}>
									{error}
									{#if error.includes("bereits")}
										<div class="error-actions">
											<button
												type="button"
												class="link-btn"
												on:click={goToLogin}
											>
												Zur Anmeldung
											</button>
										</div>
									{/if}
								</div>
							{/if}

							<button
								type="submit"
								class="btn-primary"
								disabled={loading || !isFormValid}
							>
								{#if loading}
									<div class="spinner"></div>
									Konto wird erstellt...
								{:else}
									Kostenloses Konto erstellen
								{/if}
							</button>
						</form>

						<div class="footer">
							<button class="link-btn" on:click={goToLogin}>
								Bereits ein Konto? <span>Anmelden</span>
							</button>
							<button class="skip-btn" on:click={skipRegistration}>
								Später
							</button>
						</div>
					</div>

					<div class="value-column">
						<div class="value-content">
							<h3>Das ist in Ihrem kostenlosen Konto enthalten:</h3>

							<div class="benefits-list">
								<div class="benefit">
									<div class="benefit-icon">💾</div>
									<div class="benefit-text">
										<h4>Firmendaten & Rechnung speichern</h4>
										<p>
											Ihre Firmendaten und die gerade erstellte Rechnung werden
											sicher gespeichert und sind jederzeit abrufbar.
										</p>
									</div>
								</div>

								<div class="benefit">
									<div class="benefit-icon">🔒</div>
									<div class="benefit-text">
										<h4>100% sicher & DSGVO</h4>
										<p>
											Ihre Daten werden verschlüsselt auf deutschen Servern
											gespeichert und vertraulich behandelt.
										</p>
									</div>
								</div>

								<div class="benefit">
									<div class="benefit-icon">⚡</div>
									<div class="benefit-text">
										<h4>Automatische Vervollständigung</h4>
										<p>
											Bei der nächsten Rechnung sind Ihre Daten bereits
											ausgefüllt.
										</p>
									</div>
								</div>
							</div>

							<button class="pro-teaser" on:click={() => goto("/preise")}>
								<div class="pro-teaser-header">
									<h4>Mehr Funktionen mit Premium</h4>
								</div>
								<p>
									Upgraden Sie für erweiterte Funktionen wie <strong
										>unbegrenzte Rechnungen</strong
									>,
									<strong>Kundenverwaltung</strong>
									und <strong>Cloud-Speicherung</strong>.
								</p>
								<p class="teaser-cta">Mehr erfahren</p>
							</button>
						</div>
					</div>
				</div>
			{:else if registrationStep === "success"}
				<!-- Registration Success -->
				<div class="success-state" in:fade={{ duration: 300 }}>
					<div class="success-icon-large">✅</div>
					<h2>Registrierung erfolgreich!</h2>
					<p>
						Wir haben Ihnen eine E-Mail mit einem Bestätigungscode gesendet.
					</p>
					<div class="loading-dots">
						<span></span>
						<span></span>
						<span></span>
					</div>
				</div>
			{:else if registrationStep === "confirmation"}
				<!-- Email Confirmation -->
				<div class="confirmation-step">
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
							<small class="input-hint">6-stelliger Code aus der E-Mail</small>
						</div>

						{#if confirmationError}
							<div class="error" in:fly={{ y: -10, duration: 200 }}>
								{confirmationError}
							</div>
						{/if}

						<button
							type="submit"
							class="btn-primary"
							disabled={confirmationLoading || confirmationCode.length !== 6}
						>
							{#if confirmationLoading}
								<div class="spinner"></div>
								Wird bestätigt...
							{:else}
								E-Mail bestätigen
							{/if}
						</button>
					</form>

					<div class="confirmation-footer">
						<button class="link-btn" on:click={resendConfirmationCode}>
							Code erneut senden
						</button>
						<button class="link-btn" on:click={goBackToForm}>
							← Zurück zur Registrierung
						</button>
						<button class="skip-btn" on:click={skipRegistration}>
							Später
						</button>
					</div>
				</div>
			{:else if registrationStep === "complete"}
				<!-- Registration Complete -->
				<div class="success-state" in:fade={{ duration: 300 }}>
					<div class="success-icon-large">🎉</div>
					<h2>Willkommen bei kostenlose-erechnung.de!</h2>
					<p>
						Ihr Konto wurde erfolgreich erstellt. Sie werden zur Anmeldung
						weitergeleitet.
					</p>
					<div class="loading-dots">
						<span></span>
						<span></span>
						<span></span>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	/* Enhanced styles for the functional registration modal */
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
		max-width: 900px;
		width: 95%;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow:
			0 20px 40px -12px rgba(0, 0, 0, 0.2),
			0 0 0 1px rgba(0, 0, 0, 0.05);
		position: relative;
	}

	.success-header {
		background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
		padding: 1.5rem 2rem;
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

	.content {
		display: grid;
		grid-template-columns: 1fr 1fr;
		min-height: 500px;
	}

	.form-column {
		padding: 2rem;
		border-right: 1px solid #f1f3f4;
		display: flex;
		flex-direction: column;
	}

	.form-header {
		margin-bottom: 1.5rem;
	}

	.form-header h3 {
		font-size: 1.375rem;
		font-weight: 600;
		color: #1a1a1a;
		margin: 0 0 0.5rem 0;
		line-height: 1.3;
	}

	.form-header p {
		color: #6c757d;
		font-size: 0.95rem;
		margin: 0;
		line-height: 1.5;
	}

	.form {
		flex: 1;
		margin-bottom: 1.5rem;
	}

	.input-group {
		margin-bottom: 1rem;
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

	.input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.input.error {
		border-color: #dc3545;
	}

	.input::placeholder {
		color: #adb5bd;
	}

	.password-hint,
	.input-hint {
		font-size: 0.75rem;
		color: #6c757d;
		margin-top: 0.25rem;
		line-height: 1.4;
	}

	.error-text {
		font-size: 0.75rem;
		color: #dc3545;
		margin-top: 0.25rem;
	}

	.checkbox-group {
		margin: 1.5rem 0;
	}

	.checkbox-label {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		cursor: pointer;
		font-size: 0.875rem;
		line-height: 1.5;
	}

	.checkbox-label input {
		accent-color: #7bfe84;
		margin-top: 0.25rem;
		flex-shrink: 0;
	}

	.checkbox-text a {
		color: #1a1a1a;
		text-decoration: none;
	}

	.checkbox-text a:hover {
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
		line-height: 1.4;
	}

	.error-actions {
		margin-top: 0.5rem;
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

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 1rem;
		border-top: 1px solid #f8f9fa;
		margin-top: auto;
	}

	.link-btn {
		background: none;
		border: none;
		color: #6c757d;
		font-size: 0.85rem;
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
		font-size: 0.85rem;
		cursor: pointer;
		transition: color 0.2s ease;
	}

	.skip-btn:hover {
		color: #6c757d;
	}

	/* Success State */
	.success-state {
		text-align: center;
		padding: 4rem 2rem;
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
		background: #7bfe84;
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
		padding: 2rem;
		text-align: center;
		min-height: 400px;
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
		margin: 0 auto 2rem;
	}

	.code-input {
		text-align: center;
		font-size: 1.25rem;
		font-weight: 600;
		letter-spacing: 0.5rem;
		font-family: monospace;
	}

	.confirmation-footer {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		align-items: center;
	}

	/* Value Column */
	.value-column {
		background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
		padding: 2rem;
		overflow-y: auto;
	}

	.value-content h3 {
		font-size: 1.375rem;
		font-weight: 600;
		color: #1a1a1a;
		margin: 0 0 1.5rem 0;
		text-align: left;
	}

	.benefits-list {
		margin-bottom: 2rem;
	}

	.benefit {
		display: flex;
		gap: 1rem;
		margin-bottom: 1.5rem;
		align-items: flex-start;
	}

	.benefit-icon {
		font-size: 1.5rem;
		flex-shrink: 0;
		width: 40px;
		height: 40px;
		background: #ffffff;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.benefit-text h4 {
		font-size: 0.95rem;
		font-weight: 600;
		color: #1a1a1a;
		margin: 0 0 0.25rem 0;
	}

	.benefit-text p {
		font-size: 0.85rem;
		color: #6c757d;
		margin: 0;
		line-height: 1.5;
	}

	.pro-teaser {
		text-align: justify;
		margin-top: 2rem;
		padding: 1.25rem;
		background: #ffffff;
		border-radius: 12px;
		border: 2px solid #e9ecef;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.pro-teaser:hover {
		border-color: #7bfe84;
		transform: translateY(-2px);
	}

	.pro-teaser-header h4 {
		font-size: 1rem;
		font-weight: 600;
		color: #1a1a1a;
		margin: 0 0 0.5rem 0;
		text-decoration: underline;
		text-decoration-color: #7bfe84;
		text-decoration-thickness: 3px;
	}

	.pro-teaser p {
		font-size: 0.9rem;
		color: #495057;
		margin: 0;
		line-height: 1.5;
	}

	.pro-teaser strong {
		color: #000;
	}

	.teaser-cta {
		text-decoration: underline;
		font-weight: 600;
		margin-top: 0.5rem;
	}

	/* Mobile Responsiveness */
	@media (max-width: 768px) {
		.modal {
			margin: 0.5rem;
			max-height: 95vh;
			max-width: 95%;
		}

		.content {
			grid-template-columns: 1fr;
		}

		.form-column {
			border-right: none;
			border-bottom: 1px solid #f1f3f4;
			padding: 1.5rem;
		}

		.value-column {
			padding: 1.5rem;
		}

		.success-header {
			padding: 1.25rem 1.5rem;
			flex-direction: column;
			text-align: center;
			gap: 1rem;
		}

		.close-btn {
			position: absolute;
			top: 1rem;
			right: 1rem;
		}

		.form-header h3,
		.value-content h3 {
			font-size: 1.25rem;
		}

		.footer {
			flex-direction: column;
			gap: 1rem;
			text-align: center;
		}

		.confirmation-footer {
			gap: 0.75rem;
		}
	}
</style>
