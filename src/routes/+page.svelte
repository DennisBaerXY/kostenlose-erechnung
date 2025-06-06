<script>
	import { onMount } from "svelte";

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

	let stats = [
		{ value: 0, target: 5, label: "Minuten pro Rechnung", suffix: "" },
		{ value: 0, target: 100, label: "Kostenlos", suffix: "%" }
	];

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

		<div class="steps-grid">
			<div class="step">
				<div class="step-number">1</div>
				<h3>Daten eingeben</h3>
				<p>
					Füllen Sie das intuitive Formular mit Ihren Rechnungsdaten aus. Unser
					Wizard führt Sie Schritt für Schritt durch den Prozess.
				</p>
			</div>

			<div class="step">
				<div class="step-number">2</div>
				<h3>Vorschau prüfen</h3>
				<p>
					Kontrollieren Sie Ihre Rechnung in der Live-Vorschau. Wechseln Sie
					zwischen PDF-Ansicht und XML-Code.
				</p>
			</div>

			<div class="step">
				<div class="step-number">3</div>
				<h3>Herunterladen</h3>
				<p>
					Laden Sie Ihre fertige E-Rechnung als XML-Datei herunter - bereit für
					den Versand an Ihre Kunden.
				</p>
			</div>
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

		<div class="faq-grid">
			<div class="faq-item">
				<h4>Ist der Service wirklich kostenlos?</h4>
				<p>
					Ja, die Grundfunktionen zum Erstellen und Prüfen von E-Rechnungen sind
					dauerhaft kostenlos. Keine versteckten Gebühren.
				</p>
			</div>

			<div class="faq-item">
				<h4>Muss ich mich registrieren?</h4>
				<p>
					Nein, Sie können sofort und ohne Registrierung E-Rechnungen erstellen
					und prüfen.
				</p>
			</div>

			<div class="faq-item">
				<h4>Welche Formate werden unterstützt?</h4>
				<p>
					Wir unterstützen XRechnung und ZUGFeRD - die beiden wichtigsten
					Standards für E-Rechnungen in Deutschland.
				</p>
			</div>

			<div class="faq-item">
				<h4>Sind meine Daten sicher?</h4>
				<p>
					Ihre Daten werden ausschließlich zur Erstellung der Rechnung verwendet
					und nicht gespeichert. Alles läuft verschlüsselt ab.
				</p>
			</div>
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
				<a href="/auslesen" class="btn btn-secondary btn-large">
					E-Rechnung prüfen
				</a>
			</div>
		</div>
	</div>
</section>

<style>
	.hero {
		padding: 6rem 0 4rem;
		background: linear-gradient(
			135deg,
			var(--bg-white) 0%,
			var(--bg-light) 100%
		);
		overflow: hidden;
	}

	.hero-content {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 4rem;
		align-items: center;
	}

	.hero-text h1 {
		margin-bottom: 1.5rem;
	}

	.highlight {
		text-decoration: underline;
		text-decoration-color: var(--primary-color);
		text-decoration-thickness: 1rem;
		text-underline-offset: 8px;
	}

	.hero-description {
		font-size: 1.25rem;
		color: var(--text-light);
		margin-bottom: 2rem;
	}

	.hero-actions {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.btn-large {
		padding: 1rem 2.5rem;
		font-size: 1.125rem;
	}

	.hero-image {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 400px;

		border-radius: var(--radius-lg);
		padding: 2rem;
	}

	.hero-image img {
		width: 100%;
		height: auto;
		filter: drop-shadow(0 4px 24px rgba(0, 0, 0, 0.1));
	}

	.features {
		padding: 4rem 0;
		background: var(--bg-white);
	}

	.features-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
	}

	.feature-card {
		background: var(--bg-light);
		padding: 2rem;
		border-radius: var(--radius-lg);
		text-align: center;
		transition: all 0.3s ease;
		border: 2px solid transparent;
	}

	.feature-card.active {
		background: var(--bg-white);
		border-color: var(--primary-color);
		transform: translateY(-4px);
		box-shadow: var(--shadow-lg);
	}

	.feature-icon {
		font-size: 3rem;
		display: block;
		margin-bottom: 1rem;
	}

	.feature-card h3 {
		font-size: 1.25rem;
		margin-bottom: 0.5rem;
	}

	.feature-card p {
		color: var(--text-light);
		margin: 0;
	}

	.stats {
		padding: 4rem 0;
		background: var(--text-dark);
		color: var(--bg-white);
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 3rem;
		text-align: center;
	}

	.stat-value {
		font-size: 3rem;
		font-weight: 800;
		color: var(--primary-color);
		margin-bottom: 0.5rem;
	}

	.stat-label {
		font-size: 1.125rem;
		opacity: 0.9;
	}

	.how-it-works {
		padding: 6rem 0;
		background: var(--bg-light);
	}

	.section-header {
		text-align: center;
		margin-bottom: 4rem;
	}

	.section-header h2 {
		margin-bottom: 0.5rem;
	}

	.section-header p {
		font-size: 1.25rem;
		color: var(--text-light);
		margin: 0;
	}

	.steps-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 3rem;
	}

	.step {
		text-align: center;
	}

	.step-number {
		width: 80px;
		height: 80px;
		background: var(--primary-color);
		color: var(--text-dark);
		font-size: 2rem;
		font-weight: 800;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 1.5rem;
		box-shadow: var(--shadow);
	}

	.step h3 {
		margin-bottom: 0.5rem;
	}

	.step p {
		color: var(--text-light);
		margin: 0;
	}

	.benefits {
		padding: 6rem 0;
		background: var(--bg-white);
	}

	.benefits-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 4rem;
		align-items: center;
	}

	.benefit-list {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		margin-top: 2rem;
	}

	.benefit-item {
		display: flex;
		gap: 1.5rem;
		align-items: flex-start;
	}

	.benefit-icon {
		font-size: 2rem;
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
		padding: 2rem;
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow);
	}

	.visual-header {
		font-weight: 600;
		margin-bottom: 1.5rem;
		text-align: center;
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

	.faq {
		padding: 6rem 0;
		background: var(--bg-light);
	}

	.faq-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 3rem;
	}

	.faq-item h4 {
		margin-bottom: 0.5rem;
	}

	.faq-item p {
		color: var(--text-light);
		margin: 0;
	}

	.cta {
		padding: 6rem 0;
		background: linear-gradient(135deg, var(--text-dark) 0%, #2a2a2a 100%);
		color: var(--bg-white);
		text-align: center;
	}

	.cta-content h2 {
		color: var(--bg-white);
		margin-bottom: 0.5rem;
	}

	.cta-content p {
		font-size: 1.25rem;
		opacity: 0.9;
		margin-bottom: 2rem;
	}

	.cta-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	@media (max-width: 968px) {
		.hero-content,
		.benefits-grid {
			grid-template-columns: 1fr;
			gap: 3rem;
		}

		.hero-image {
			order: -1;
			min-height: 300px;
		}

		.visual-card {
			display: none;
		}
	}

	@media (max-width: 768px) {
		.hero {
			padding: 4rem 0 3rem;
		}

		.hero-text h1 {
			font-size: 2rem;
		}

		.hero-description {
			font-size: 1.125rem;
		}

		.hero-actions {
			flex-direction: column;
		}

		.btn-large {
			width: 100%;
		}

		.stats-grid {
			grid-template-columns: repeat(2, 1fr);
			gap: 2rem;
		}

		.stat-value {
			font-size: 2rem;
		}
	}
</style>
