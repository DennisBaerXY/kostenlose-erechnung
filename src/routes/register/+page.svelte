<!-- src/routes/register/+page.svelte -->
<script>
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { browser } from "$app/environment";
	import { fade, fly } from "svelte/transition";
	import { signUpUser, isAuthenticated } from "$lib/stores/auth.js";

	let email = "";
	let password = "";
	let confirmPassword = "";

	let acceptTerms = false;
	let loading = false;
	let error = "";
	let success = false;
	let showPassword = false;
	let showConfirmPassword = false;

	// Redirect if already authenticated
	onMount(() => {
		if (browser && $isAuthenticated) {
			goto("/dashboard");
		}
	});

	async function handleRegister() {
		// Validation
		if (!email || !password || !confirmPassword) {
			error = "Bitte füllen Sie alle Pflichtfelder aus.";
			return;
		}

		if (password !== confirmPassword) {
			error = "Die Passwörter stimmen nicht überein.";
			return;
		}

		if (password.length < 8) {
			error = "Das Passwort muss mindestens 8 Zeichen lang sein.";
			return;
		}

		if (!acceptTerms) {
			error = "Bitte akzeptieren Sie die Nutzungsbedingungen.";
			return;
		}

		loading = true;
		error = "";

		try {
			const result = await signUpUser(email, password);

			if (result.success) {
				success = true;
				// Redirect to confirmation page or show success message
				setTimeout(() => {
					goto(`/confirm-email?email=${encodeURIComponent(email)}`);
				}, 2000);
			} else {
				error =
					result.message ||
					"Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.";
			}
		} catch (err) {
			console.error("Registration error:", err);
			error =
				"Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.";
		} finally {
			loading = false;
		}
	}

	function handleKeydown(event) {
		if (event.key === "Enter") {
			handleRegister();
		}
	}

	function clearError() {
		error = "";
	}

	function togglePasswordVisibility(field) {
		if (field === "password") {
			showPassword = !showPassword;
		} else {
			showConfirmPassword = !showConfirmPassword;
		}
	}

	// Password strength validation
	$: passwordStrength = getPasswordStrength(password);

	function getPasswordStrength(pass) {
		if (!pass) return { score: 0, text: "", color: "" };

		let score = 0;
		if (pass.length >= 8) score++;
		if (/[a-z]/.test(pass)) score++;
		if (/[A-Z]/.test(pass)) score++;
		if (/[0-9]/.test(pass)) score++;
		if (/[^A-Za-z0-9]/.test(pass)) score++;

		const levels = [
			{ score: 0, text: "", color: "" },
			{ score: 1, text: "Sehr schwach", color: "#dc3545" },
			{ score: 2, text: "Schwach", color: "#fd7e14" },
			{ score: 3, text: "Mittel", color: "#ffc107" },
			{ score: 4, text: "Stark", color: "#28a745" },
			{ score: 5, text: "Sehr stark", color: "#28a745" }
		];

		return levels[score] || levels[0];
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
		<!-- Left side - Benefits -->
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
		<!-- Right side - Form -->
		<div class="form-section">
			<div class="form-container">
				{#if success}
					<div class="success-state" in:fade={{ duration: 300 }}>
						<div class="success-icon">✅</div>
						<h2>Registrierung erfolgreich!</h2>
						<p>
							Wir haben Ihnen eine Bestätigungs-E-Mail gesendet. Bitte prüfen
							Sie Ihr Postfach.
						</p>
						<div class="loading-dots">
							<span></span>
							<span></span>
							<span></span>
						</div>
					</div>
				{:else}
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

					<form on:submit|preventDefault={handleRegister} class="register-form">
						<div class="input-group">
							<label for="email">E-Mail-Adresse *</label>
							<input
								id="email"
								type="email"
								bind:value={email}
								on:keydown={handleKeydown}
								on:input={clearError}
								placeholder="max@mustermann.de"
								required
								autocomplete="email"
								class="input"
							/>
						</div>

						<div class="input-group">
							<label for="password">Passwort *</label>
							<div class="password-input-wrapper">
								<input
									id="password"
									type={showPassword ? "text" : "password"}
									bind:value={password}
									on:keydown={handleKeydown}
									on:input={clearError}
									placeholder="Mindestens 8 Zeichen"
									required
									autocomplete="new-password"
									class="input password-input"
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
							{#if password && passwordStrength.score > 0}
								<div
									class="password-strength"
									style="color: {passwordStrength.color}"
								>
									<div class="strength-bar">
										<div
											class="strength-fill"
											style="width: {passwordStrength.score *
												20}%; background: {passwordStrength.color}"
										></div>
									</div>
									<span class="strength-text">{passwordStrength.text}</span>
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
									on:keydown={handleKeydown}
									on:input={clearError}
									placeholder="Passwort wiederholen"
									required
									autocomplete="new-password"
									class="input password-input"
									class:error={confirmPassword && password !== confirmPassword}
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
							{#if confirmPassword && password !== confirmPassword}
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
								/>
								<span class="checkbox-text">
									Ich akzeptiere die <a href="/agb" target="_blank">AGB</a> und
									die
									<a href="/datenschutz" target="_blank">Datenschutzerklärung</a
									>
								</span>
							</label>
						</div>

						<button
							type="submit"
							class="register-button"
							disabled={loading || !acceptTerms || password !== confirmPassword}
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
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
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

	/* Form Section */
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
		gap: 1.5rem;
	}

	.name-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
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

	.password-strength {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}

	.strength-bar {
		flex: 1;
		height: 4px;
		background: #e9ecef;
		border-radius: 2px;
		overflow: hidden;
	}

	.strength-fill {
		height: 100%;
		transition: all 0.3s ease;
	}

	.strength-text {
		font-size: 0.75rem;
		font-weight: 500;
		min-width: 80px;
	}

	.validation-error {
		color: #dc3545;
		font-size: 0.75rem;
		margin-top: 0.25rem;
	}

	.terms-section {
		margin: 0.5rem 0;
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
		margin-top: 2rem;
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

	/* Benefits Section */
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

	/* Mobile Responsiveness */
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
		}

		.form-section,
		.benefits-section {
			padding: 2rem;
		}

		.name-row {
			grid-template-columns: 1fr;
		}

		.benefits-list {
			gap: 1rem;
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
