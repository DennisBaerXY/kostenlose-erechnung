<script>
	import { onMount } from "svelte";
	import { slide } from "svelte/transition";

	let currentFeature = 0;
	const features = [
		{
			icon: "✓",
			title: "XRechnung & ZUGFeRD konform",
			description:
				"Erstellen Sie gesetzeskonforme E-Rechnungen nach allen aktuellen deutschen und EU-Standards."
		},
		{
			icon: "⚡",
			title: "Serverstandort Deutschland",
			description:
				"Ihre Daten werden ausschließlich auf deutschen Servern verarbeitet - DSGVO-konform."
		},
		{
			icon: "🔒",
			title: "DSGVO konform",
			description:
				"Höchste Datenschutzstandards und vollständige Compliance mit europäischen Richtlinien."
		},
		{
			icon: "🏢",
			title: "E-Rechnung nach EN-16931",
			description:
				"Erfüllt alle Anforderungen für öffentliche Auftraggeber und B2B-Geschäfte."
		}
	];

	const howItWorksSteps = [
		{
			number: "1",
			title: "Daten eingeben",
			description:
				"Füllen Sie das intuitive Formular mit Ihren Rechnungsdaten aus. Unser Wizard führt Sie Schritt für Schritt durch den Prozess, damit keine wichtigen Informationen vergessen werden.",
			imageSrc: "/step1-form.png", // <-- BITTE ERSETZEN
			imageAlt: "Screenshot des Rechnungsformulars"
		},
		{
			number: "2",
			title: "Vorschau prüfen",
			description:
				"Kontrollieren Sie alle Ihre Eingaben in einer klaren Live-Vorschau. Wechseln Sie mit nur einem Klick zwischen der menschenlesbaren PDF-Ansicht und dem maschinenlesbaren XML-Code.",
			imageSrc: "/step2-preview.png", // <-- BITTE ERSETZEN
			imageAlt: "Live-Vorschau der erstellten E-Rechnung"
		},
		{
			number: "3",
			title: "Herunterladen & Versenden",
			description:
				"Laden Sie Ihre fertige, valide E-Rechnung als XML-Datei herunter. Sie ist sofort bereit für den Versand per E-Mail oder den Upload in Rechnungsportale von Unternehmen und Behörden.",
			imageSrc: "/step3-download.png", // <-- BITTE ERSETZEN
			imageAlt: "Herunterladen der fertigen E-Rechnung"
		}
	];

	let stats = [
		{ value: 0, target: 5, label: "Minuten pro Rechnung", suffix: "" },
		{ value: 0, target: 100, label: "Kostenlos", suffix: "%" }
	];

	// FAQ data
	// FAQ data - bleibt unverändert
	const faqs = [
		{
			question: "Ist der Service wirklich kostenlos?",
			answer:
				"Ja, die Grundfunktionen zum Erstellen und Prüfen von E-Rechnungen sind dauerhaft kostenlos. Keine versteckten Gebühren."
		},
		{
			question: "Wie kann dieser Service kostenlos sein?",
			answer:
				"Unser Ziel ist es, den Einstieg in die E-Rechnung für Freelancer und Kleinunternehmer so einfach wie möglich zu machen. Wir bieten die Basisfunktionen kostenlos an, um die Digitalisierung zu fördern. Zukünftig planen wir, optionale Premium-Funktionen anzubieten, die unser Projekt finanzieren."
		},
		{
			question: "Muss ich mich registrieren?",
			answer:
				"Nein, Sie können sofort und ohne Registrierung E-Rechnungen erstellen und prüfen."
		},
		{
			question: "Welche Formate werden unterstützt?",
			answer:
				"Wir unterstützen die aktuellsten Versionen von XRechnung(Cii und UBL) und ZUGFeRD (ab 2.1.1, Profil EN 16931). Damit sind Sie für den Rechnungsaustausch mit Behörden (B2G) und Unternehmen (B2B) bestens gerüstet."
		},
		{
			question: "Sind meine Daten sicher?",
			answer:
				"Absolut. Ihre Sicherheit hat für uns höchste Priorität. Die gesamte Datenverarbeitung findet nur temporär in Ihrem Browser statt und wird niemals auf unseren Servern gespeichert. Die Verbindung zu unserer Seite ist durchgehend SSL/TLS-verschlüsselt. Sie behalten die volle Kontrolle über Ihre Daten."
		}
	];

	let activeFaq = null;
	const toggleFaq = (index) => {
		if (activeFaq === index) {
			activeFaq = null;
		} else {
			activeFaq = index;
		}
	};

	onMount(() => {
		// Animate stats
		stats.forEach((stat, index) => {
			setTimeout(() => {
				const interval = setInterval(() => {
					if (stat.value < stat.target) {
						stat.value = Math.min(
							stat.value + Math.ceil(stat.target / 50),
							stat.target
						);
						stats = stats;
					} else {
						clearInterval(interval);
					}
				}, 30);
			}, index * 200);
		});

		// Rotate features
		setInterval(() => {
			currentFeature = (currentFeature + 1) % features.length;
		}, 3000);
	});
</script>

<div class="hero">
	<div class="container">
		<div class="hero-content">
			<div class="hero-text">
				<h1>
					E-Rechnungen - <br />einfach und
					<span class="highlight">kostenlos.</span>
				</h1>
				<p class="hero-description">
					Erstellen und prüfen Sie XRechnungen und ZUGFeRD-konforme E-Rechnungen
					ohne komplizierte Software oder teure Gebühren. Intuitiv, schnell und
					direkt im Browser. Ideal für Freelancer und Kleinunternehmer.
				</p>
				<div class="hero-actions">
					<a href="/erstellen" class="btn btn-primary btn-large">
						Rechnung erstellen
					</a>
					<a href="/auslesen" class="btn btn-secondary btn-large">
						Rechnung prüfen
					</a>
				</div>
			</div>
			<div class="hero-image">
				<img src="/hero-image-man-standing.jpg" alt="E-Rechnung erstellen" />
			</div>
		</div>
	</div>
</div>

<section class="features">
	<div class="container">
		<div class="features-grid">
			{#each features as feature, i}
				<div class="feature-card" class:active={currentFeature === i}>
					<span class="feature-icon">{feature.icon}</span>
					<h3>{feature.title}</h3>
					<p>{feature.description}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<section class="stats">
	<div class="container">
		<div class="stats-grid">
			{#each stats as stat}
				<div class="stat-item">
					<div class="stat-value">
						{stat.value.toLocaleString()}{stat.suffix}
					</div>
					<div class="stat-label">{stat.label}</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<section class="how-it-works">
	<div class="container">
		<div class="section-header">
			<h2>So einfach funktioniert's</h2>
			<p>In nur drei Schritten zu Ihrer fertigen E-Rechnung</p>
		</div>

		<div class="steps-alternating">
			{#each howItWorksSteps as step, i}
				<div class="step-item-hero">
					<div class="step-text">
						<span class="step-number">{step.number}</span>
						<h3>{step.title}</h3>
						<p>{step.description}</p>
					</div>
					<div class="step-image">
						<img src={step.imageSrc} alt={step.imageAlt} />
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<section class="benefits">
	<div class="container">
		<div class="benefits-grid">
			<div class="benefit-content">
				<h2>Warum E-Rechnungen?</h2>
				<div class="benefit-list">
					<div class="benefit-item">
						<span class="benefit-icon">⚡</span>
						<div>
							<h4>Schnellere Bearbeitung</h4>
							<p>
								Automatisierte Verarbeitung reduziert Fehler und beschleunigt
								die Zahlungsabwicklung.
							</p>
						</div>
					</div>

					<div class="benefit-item">
						<span class="benefit-icon">💰</span>
						<div>
							<h4>Kosten sparen</h4>
							<p>
								Keine Druck- und Versandkosten, weniger manueller Aufwand in der
								Buchhaltung.
							</p>
						</div>
					</div>

					<div class="benefit-item">
						<span class="benefit-icon">🌱</span>
						<div>
							<h4>Umweltfreundlich</h4>
							<p>Papierlos arbeiten und aktiv zum Umweltschutz beitragen.</p>
						</div>
					</div>

					<div class="benefit-item">
						<span class="benefit-icon">📋</span>
						<div>
							<h4>Pflicht für B2G</h4>
							<p>
								Seit 2020 müssen Rechnungen an öffentliche Auftraggeber als
								E-Rechnung übermittelt werden.
							</p>
						</div>
					</div>
				</div>
			</div>

			<div class="benefit-visual">
				<div class="visual-card">
					<div class="visual-header">Intuitive Benutzeroberfläche</div>
					<div class="visual-content">
						<div class="mock-form">
							<div class="mock-input"></div>
							<div class="mock-input short"></div>
							<div class="mock-input"></div>
						</div>
						<div class="mock-preview">
							<div class="mock-line"></div>
							<div class="mock-line short"></div>
							<div class="mock-line"></div>
							<div class="mock-line short"></div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<section class="faq">
	<div class="container">
		<div class="section-header">
			<h2>Häufig gestellte Fragen</h2>
		</div>

		<div class="faq-accordion">
			{#each faqs as faq, i}
				<div class="faq-item" class:active={activeFaq === i}>
					<button class="faq-question" on:click={() => toggleFaq(i)}>
						<span>{faq.question}</span>
						<span class="faq-icon">{activeFaq === i ? "−" : "+"}</span>
					</button>
					{#if activeFaq === i}
						<div class="faq-answer" transition:slide|local={{ duration: 300 }}>
							<p>{faq.answer}</p>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</section>

<section class="cta">
	<div class="container">
		<div class="cta-content">
			<h2>Bereit für Ihre erste E-Rechnung?</h2>
			<p>Starten Sie jetzt - keine Registrierung erforderlich</p>
			<div class="cta-actions">
				<a href="/erstellen" class="btn btn-primary btn-large">
					Jetzt E-Rechnung erstellen
				</a>
				<a
					href="/auslesen"
					class="btn btn-secondary btn-large"
					style="color: #ffffff;"
				>
					E-Rechnung prüfen
				</a>
			</div>
		</div>
	</div>
</section>

<style>
	/* CSS Custom Properties für bessere Wartbarkeit */
	:root {
		/* Responsive spacing */
		--section-padding: clamp(3rem, 8vw, 4rem);
		--container-padding: clamp(1rem, 4vw, 2rem);
		--grid-gap: clamp(1rem, 3vw, 3rem);
	}

	/* Container mit fluid width */
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 var(--container-padding);
		width: 100%;
	}

	/* Responsive Typography */
	h1 {
		font-size: clamp(2rem, 5vw, 3.5rem);
		line-height: 1.2;
		font-weight: 800;
		color: var(--text-dark);
		margin-bottom: 1.5rem;
	}

	h2 {
		font-size: clamp(1.75rem, 4vw, 2.5rem);
		line-height: 1.3;
		font-weight: 700;
		color: var(--text-dark);
	}

	h3 {
		font-size: clamp(1.25rem, 3vw, 1.5rem);
		line-height: 1.4;
		font-weight: 600;
		color: var(--text-dark);
	}

	h4 {
		font-size: clamp(1.125rem, 2.5vw, 1.25rem);
		line-height: 1.4;
		font-weight: 600;
		color: var(--text-dark);
	}

	p {
		font-size: clamp(1rem, 2vw, 1.125rem);
		line-height: 1.6;
	}

	/* Button Styles */
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.875rem 2rem;
		border-radius: var(--radius);
		text-decoration: none;
		font-weight: 600;
		transition: all 0.3s ease;
		cursor: pointer;
		border: none;
		font-size: 1rem;
		min-height: 48px; /* Touch-friendly */
		white-space: nowrap;
	}

	.btn-large {
		padding: 1rem 2.5rem;
		font-size: clamp(1rem, 2.5vw, 1.125rem);
		min-height: 56px;
	}

	/* Hero Section */
	.hero {
		padding: var(--section-padding) 0;
		background: linear-gradient(
			135deg,
			var(--bg-white) 0%,
			var(--bg-light) 100%
		);
		overflow: hidden;
		min-height: 60vh;
		display: flex;
		align-items: center;
	}

	.hero-content {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--grid-gap);
		align-items: center;
	}

	.hero-text {
		max-width: 100%;
	}

	.highlight {
		text-decoration: underline;
		text-decoration-color: var(--primary-color);
		text-decoration-thickness: clamp(3px, 1vw, 8px);
		text-underline-offset: 8px;
	}

	.hero-description {
		font-size: clamp(1.125rem, 2.5vw, 1.25rem);
		color: var(--text-light);
		margin-bottom: 2rem;
		line-height: 1.6;
	}

	.hero-actions {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.hero-image {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;

		border-radius: var(--radius-lg);
		padding: 1rem;
		overflow: hidden;
	}

	.hero-image img {
		width: 100%;
		height: auto;
		max-width: clamp(250px, 35vw, 350px);
		max-height: 500px;
		object-fit: contain;
		object-position: center;
		filter: drop-shadow(0 4px 24px rgba(0, 0, 0, 0.1));
	}

	/* Features Section */
	.features {
		padding: var(--section-padding) 0;
		background: var(--bg-white);
	}

	.features-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: clamp(1rem, 3vw, 1.5rem);
	}

	.feature-card {
		background: var(--bg-light);
		padding: clamp(1.5rem, 4vw, 2rem);
		border-radius: var(--radius-lg);
		text-align: center;
		transition: all 0.3s ease;
		border: 2px solid transparent;
		min-height: 200px;
		display: flex;
		flex-direction: column;
		justify-content: center;

		width: 100%;
	}

	.feature-card.active {
		background: var(--bg-white);
		border-color: var(--primary-color);
		transform: translateY(-4px);
		box-shadow: var(--shadow-lg);
	}

	.feature-icon {
		font-size: clamp(2rem, 5vw, 3rem);
		display: block;
		margin-bottom: 1rem;
	}

	.feature-card h3 {
		margin-bottom: 0.5rem;
	}

	.feature-card p {
		color: var(--text-light);
		margin: 0;
		font-size: clamp(0.9rem, 2vw, 1rem);
	}

	/* Stats Section */
	.stats {
		padding: var(--section-padding) 0;
		background: var(--text-dark);
		color: var(--bg-white);
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--grid-gap);
		text-align: center;
	}

	.stat-value {
		font-size: clamp(2rem, 6vw, 3rem);
		font-weight: 800;
		color: var(--primary-color);
		margin-bottom: 0.5rem;
	}

	.stat-label {
		font-size: clamp(1rem, 2.5vw, 1.125rem);
		opacity: 0.9;
	}

	/* How it works Section */
	.how-it-works {
		padding: var(--section-padding) 0;
		background: var(--bg-light);
	}

	.steps-alternating {
		display: flex;
		flex-direction: column;
		gap: clamp(
			4rem,
			10vw,
			6rem
		); /* Größerer Abstand zwischen den vertikalen Schritten */
	}

	.step-item-hero {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: clamp(2rem, 5vw, 4rem);
		align-items: center;
	}

	/* Kehrt die Reihenfolge für jedes zweite Element um */
	.step-item-hero:nth-child(even) .step-text {
		order: 2;
	}
	.step-item-hero:nth-child(even) .step-image {
		order: 1;
	}

	.step-text {
		text-align: left;
	}

	.step-number {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		background: var(--primary-color);
		color: var(--text-dark);
		font-size: 1.5rem;
		font-weight: 700;
		border-radius: 50%;
		margin-bottom: 1.5rem;
	}

	.step-text h3 {
		margin-bottom: 1rem;
	}

	.step-text p {
		color: var(--text-light);
		margin: 0;
	}

	.step-image img {
		width: 100%;
		height: auto;
		border-radius: var(--radius-lg);
		box-shadow: var(
			--shadow-xl,
			0 20px 25px -5px rgba(0, 0, 0, 0.1),
			0 10px 10px -5px rgba(0, 0, 0, 0.04)
		);
		border: 1px solid #ddd;
	}

	/* Benefits Section */
	.benefits {
		padding: var(--section-padding) 0;
		background: var(--bg-white);
	}

	.benefits-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--grid-gap);
		align-items: center;
	}

	.benefit-list {
		display: flex;
		flex-direction: column;
		gap: clamp(1.5rem, 3vw, 2rem);
		margin-top: 2rem;
	}

	.benefit-item {
		display: flex;
		gap: 1.5rem;
		align-items: flex-start;
	}

	.benefit-icon {
		font-size: clamp(1.5rem, 3vw, 2rem);
		flex-shrink: 0;
	}

	.benefit-item h4 {
		margin-bottom: 0.25rem;
	}

	.benefit-item p {
		color: var(--text-light);
		margin: 0;
	}

	.visual-card {
		background: var(--bg-light);
		padding: clamp(1.5rem, 4vw, 2rem);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow);
	}

	.visual-header {
		font-weight: 600;
		margin-bottom: 1.5rem;
		text-align: center;
		font-size: clamp(1rem, 2.5vw, 1.125rem);
	}

	.visual-content {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.mock-form,
	.mock-preview {
		background: var(--bg-white);
		padding: 1rem;
		border-radius: var(--radius);
	}

	.mock-input,
	.mock-line {
		height: 12px;
		background: var(--border-color);
		border-radius: 4px;
		margin-bottom: 0.75rem;
	}

	.mock-input.short,
	.mock-line.short {
		width: 60%;
	}

	/* FAQ Section */
	.faq {
		padding: var(--section-padding) 0;
		background: var(--bg-light);
	}

	.faq-accordion {
		max-width: 800px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.faq-item {
		background: var(--bg-white);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow);
		border: 1px solid var(--border-color, #eee);
		transition: border-color 0.3s ease;
	}

	.faq-item.active {
		border-color: var(--primary-color);
	}

	.faq-question {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		text-align: left;
		padding: clamp(1.25rem, 3vw, 1.5rem);
		background: none;
		border: none;
		cursor: pointer;
		font-size: clamp(1.1rem, 2.5vw, 1.2rem);
		font-weight: 600;
		color: var(--text-dark);
	}

	.faq-icon {
		font-size: 1.5rem;
		font-weight: 500;
		color: var(--primary-color);
		transition: transform 0.2s ease;
	}

	.faq-item.active .faq-icon {
		transform: rotate(180deg);
	}

	.faq-answer {
		padding: 0 clamp(1.25rem, 3vw, 1.5rem) clamp(1.25rem, 3vw, 1.5rem);
		color: var(--text-light);
		/* The slide transition handles the animation */
	}

	.faq-answer p {
		margin: 0;
		padding-bottom: clamp(1.25rem, 3vw, 1.5rem);
	}

	/* CTA Section */
	.cta {
		padding: var(--section-padding) 0;
		background: linear-gradient(135deg, var(--text-dark) 0%, #2a2a2a 100%);
		color: var(--bg-white);
		text-align: center;
	}

	.cta-content h2 {
		color: var(--bg-white);
		margin-bottom: 0.5rem;
	}

	.cta-content p {
		font-size: clamp(1.125rem, 2.5vw, 1.25rem);
		opacity: 0.9;
		margin-bottom: 2rem;
	}

	.cta-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	/* Mobile First Media Queries */
	@media (max-width: 760px) {
		:root {
			--section-padding: clamp(2rem, 6vw, 4rem);
			--container-padding: 1rem;
			--grid-gap: clamp(1rem, 4vw, 2rem);
		}

		.hero-content,
		.benefits-grid {
			grid-template-columns: 1fr;
			gap: 2rem;
		}

		.hero-image {
			min-height: 200px;
			padding: 0.5rem;
		}

		.hero-image {
			min-height: 450px;
		}

		.hero-image img {
			max-width: 400px;
			max-height: 600px;
		}

		.hero-actions {
			flex-direction: column;
			align-items: stretch;
		}

		.btn-large {
			width: 100%;
			justify-content: center;
		}
		.step-item-hero {
			grid-template-columns: 1fr; /* Einzelne Spalte auf Mobilgeräten */
			text-align: center;
		}

		/* Auf Mobilgeräten die Reihenfolge zurücksetzen und zentrieren */
		.step-item-hero:nth-child(even) .step-text,
		.step-item-hero-item:nth-child(even) .step-image {
			order: initial;
		}

		.step-text {
			text-align: center;
		}

		.step-number {
			margin-left: auto;
			margin-right: auto;
		}

		.stats-grid {
			grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		}

		.features-grid {
			grid-template-columns: 1fr;
		}

		.steps-grid {
			grid-template-columns: 1fr;
		}

		.visual-card {
			display: none;
		}

		.benefit-item {
			flex-direction: column;
			text-align: center;
			gap: 1rem;
		}

		.cta-actions {
			flex-direction: column;
			align-items: stretch;
		}
	}

	@media (max-width: 480px) {
		.hero {
			min-height: auto;
		}

		.hero-image {
			display: none;
		}

		.feature-card {
			min-height: auto;
			padding: 1.5rem;
		}

		.step {
			padding: 0;
		}

		.faq-item {
			padding: 1.5rem;
		}

		.visual-content {
			grid-template-columns: 1fr;
		}
	}

	/* Large screen optimizations */
	@media (min-width: 1200px) {
		.container {
			padding: 0 2rem;
		}

		.hero-content {
			gap: 4rem;
		}

		.hero-image {
			min-height: 450px;
		}

		.hero-image img {
			max-width: 400px;
			max-height: 600px;
		}

		.features-grid {
			grid-template-columns: repeat(4, 1fr);
		}

		.steps-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	/* High DPI and print optimizations */
	@media (min-resolution: 2dppx) {
		.hero-image img {
			image-rendering: crisp-edges;
		}
	}

	/* Accessibility improvements */
	@media (prefers-reduced-motion: reduce) {
		.feature-card,
		.btn,
		.step-number {
			transition: none;
		}

		.feature-card.active {
			transform: none;
		}

		.btn:hover {
			transform: none;
		}
	}

	/* Focus styles for accessibility */
	.btn:focus-visible {
		outline: 2px solid var(--primary-color);
		outline-offset: 2px;
	}

	/* Dark mode support */
</style>
