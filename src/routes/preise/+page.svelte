<!-- src/routes/preise/+page.svelte - INSPIRIERT VON PROFESSIONELLEM SAAS-DESIGN -->
<script>
	import { onMount } from "svelte";
	import { slide } from "svelte/transition";

	// Pricing Configuration - Inspiriert von der Referenz
	const PRICING_CONFIG = {
		plans: [
			{
				id: "starter",
				name: "Starter",
				subtitle: "Für den Einstieg",
				badge: null,
				price: { monthly: 0, yearly: 0 },
				originalPrice: null,
				savings: null,
				popular: false,
				description:
					"Perfekt für alle, die die Anwendung testen oder nur sehr selten eine E-Rechnung erstellen müssen.",
				features: [
					"Bis zu 3 Rechnungen pro Monat",
					"XRechnung (XML) erstellen",
					"Upload & Prüfung von E-Rechnungen",
					"Community Support",
					"'Erstellt mit...' Branding"
				],
				limitations: [],
				cta: "Kostenlos starten",
				ctaStyle: "secondary",
				ctaLink: "/erstellen"
			},
			{
				id: "bus",
				name: "Unternehmen",
				subtitle: "Für kleine Unternehmen",
				badge: "Empfohlen",
				price: { monthly: 14.99, yearly: 149 },
				originalPrice: { monthly: 29.99, yearly: 299 },
				savings: "17% gespart",
				popular: true,
				description:
					"Kleine Unternehmen, Agenturen und Power-User, die unlimitierte Funktionalität und priorisierten Support benötigen.",
				features: [
					"Alle Freelancer-Features inklusive",
					"Unbegrenzte Rechnungen",
					"Statistiken & Berichte",
					"ZUGFeRD (PDF + XML) erstellen",
					"Jährliche Option mit Rabatt"
				],
				limitations: [],
				cta: "Jetzt wachsen",
				ctaStyle: "primary",
				ctaLink: "/register?plan=wachstum"
			},
			{
				id: "freelancer",
				name: "Freelancer",
				subtitle: "Für Selbstständige",
				badge: null,
				price: { monthly: 9.99, yearly: 99 },
				originalPrice: { monthly: 12.99, yearly: 129 },
				savings: "17% gespart",
				popular: false,
				description:
					"Die Kernzielgruppe. Selbstständige und Freelancer, die eine zuverlässige, aber kostengünstige Lösung benötigen.",
				features: [
					"Bis zu 15 Rechnungen pro Monat",
					"Alle Starter-Features inklusive",
					"Kunden- & Kontaktdaten speichern",
					"Eigenes Logo auf Rechnungen",
					"Monatlich kündbar"
				],
				limitations: [],
				cta: "Freelancer wählen",
				ctaStyle: "primary",
				ctaLink: "/register?plan=freelancer"
			}
		],

		commonFeatures: [
			{
				icon: "🛡️",
				title: "DSGVO-konformer Datenschutz",
				description: "Höchste Sicherheitsstandards und vollständige Compliance"
			},
			{
				icon: "🇩🇪",
				title: "Server in Deutschland",
				description:
					"Alle Daten werden ausschließlich in deutschen Rechenzentren verarbeitet"
			},
			{
				icon: "🔧",
				title: "Kontinuierliche Updates",
				description:
					"Regelmäßige Verbesserungen und neue Features ohne Aufpreis"
			}
		],

		detailedFeatures: [
			{
				category: "Rechnungserstellung",
				items: [
					{
						name: "Rechnungen pro Monat",
						starter: "3",
						freelancer: "15",
						wachstum: "Unbegrenzt",
						important: true
					},
					{
						name: "XRechnung (XML) erstellen",
						starter: "✓",
						freelancer: "✓",
						wachstum: "✓"
					},
					{
						name: "ZUGFeRD (PDF + XML)",
						starter: "❌",
						freelancer: "✓",
						wachstum: "✓",
						badge: "Neu"
					},
					{
						name: "Upload & Prüfungen pro Monat",
						starter: "5",
						freelancer: "Unbegrenzt",
						wachstum: "Unbegrenzt"
					},
					{
						name: "Rechnungsvorlagen",
						starter: "❌",
						freelancer: "Basic",
						wachstum: "Erweitert"
					}
				]
			},
			{
				category: "Anpassung & Verwaltung",
				items: [
					{
						name: "Kundendaten speichern",
						starter: "❌",
						freelancer: "✓",
						wachstum: "✓"
					},
					{
						name: "Eigenes Logo",
						starter: "❌",
						freelancer: "✓",
						wachstum: "✓"
					},
					{
						name: "Branding entfernen",
						starter: "❌",
						freelancer: "✓",
						wachstum: "✓"
					},
					{
						name: "Cloud-Speicherung",
						starter: "❌",
						freelancer: "20 Rechnungen",
						wachstum: "Unbegrenzt"
					},
					{
						name: "Kündigungsfrist",
						starter: "Jederzeit",
						freelancer: "Monatlich",
						wachstum: "Monatlich"
					}
				]
			}
		]
	};

	// Component State
	let selectedPeriod = "yearly"; // Standardmäßig jährlich für bessere Deals
	let activeFaq = null;
	let loading = false;

	// FAQ Data
	const faqs = [
		{
			question: "Kann ich meinen Plan jederzeit ändern?",
			answer:
				"Ja, Sie können jederzeit zwischen den Plänen wechseln. Upgrades werden sofort wirksam, bei Downgrades am Ende der aktuellen Abrechnungsperiode. Eine anteilige Rückerstattung ist bei jährlichen Plänen nicht möglich."
		},
		{
			question: "Welche Zahlungsmethoden werden akzeptiert?",
			answer:
				"Wir akzeptieren alle gängigen Zahlungsmethoden: Kreditkarte (Visa, Mastercard), SEPA-Lastschrift, PayPal und Sofortüberweisung. Die Abrechnung erfolgt über unseren sicheren Partner Stripe."
		},
		{
			question: "Sind meine Daten sicher?",
			answer:
				"Alle Daten werden End-to-End verschlüsselt und ausschließlich auf deutschen Servern gespeichert. Wir sind vollständig DSGVO-konform."
		},
		{
			question: "Was passiert, wenn ich mein Rechnungslimit erreiche?",
			answer:
				"Sie können dann entweder auf einen höheren Plan upgraden oder bis zum nächsten Monat warten. Ihre bestehenden Rechnungen bleiben jederzeit verfügbar."
		},
		{
			question: "Gibt es eine kostenlose Testphase?",
			answer:
				"Der Starter-Plan ist dauerhaft kostenlos für bis zu 3 Rechnungen pro Monat. Premium-Pläne können Sie 14 Tage lang kostenlos und unverbindlich testen."
		},
		{
			question: "Kann ich meine Daten exportieren?",
			answer:
				"Ja, Sie haben jederzeit Zugriff auf alle Ihre Daten. Export ist in verschiedenen Formaten möglich (XML, CSV, PDF). Bei einer Kündigung bleiben Ihre Daten 30 Tage lang abrufbar."
		}
	];

	// Event Handlers
	function toggleFaq(index) {
		activeFaq = activeFaq === index ? null : index;
	}

	function handlePlanSelection(plan) {
		if (plan.id === "starter") {
			window.location.href = plan.ctaLink;
		} else {
			// Hier würde die Checkout-Logik stehen
			window.location.href = `${plan.ctaLink}&period=${selectedPeriod}`;
		}
	}

	function formatPrice(price) {
		return new Intl.NumberFormat("de-DE", {
			style: "currency",
			currency: "EUR",
			minimumFractionDigits: 2
		}).format(price);
	}

	function formatOriginalPrice(price) {
		return new Intl.NumberFormat("de-DE", {
			style: "currency",
			currency: "EUR",
			minimumFractionDigits: 2
		}).format(price);
	}

	// Animation on mount
	onMount(() => {
		console.log("Pricing page loaded");
	});
</script>

<svelte:head>
	<title
		>Ein Plan, der mit dir wächst - Transparente Preise |
		kostenlose-erechnung.de</title
	>
	<meta
		name="description"
		content="Transparente Preise für professionelle E-Rechnungen. Starter kostenlos, Freelancer 9,99€/Monat, Wachstum 14,99€/Monat. Jederzeit kündbar."
	/>
	<meta
		property="og:title"
		content="Ein Plan, der mit dir wächst - Transparente Preise"
	/>
	<meta
		property="og:description"
		content="Von kostenlos bis professionell - finde den passenden Plan für deine E-Rechnungen."
	/>
</svelte:head>

<div class="pricing-page">
	<!-- Hero Section -->
	<section class="hero">
		<div class="container">
			<div class="hero-content">
				<h1>Ein Plan, der mit dir wächst</h1>
				<p class="hero-description">
					Wähle den passenden Plan für deine Anforderungen. Jederzeit kündbar,
					faire Konditionen.
				</p>

				<!-- Period Toggle - wie in der Referenz -->
				<div class="period-toggle">
					<button
						class="period-option"
						class:active={selectedPeriod === "monthly"}
						on:click={() => (selectedPeriod = "monthly")}
					>
						1 Monat
					</button>
					<button
						class="period-option"
						class:active={selectedPeriod === "yearly"}
						on:click={() => (selectedPeriod = "yearly")}
					>
						12 Monate
						<span class="savings-label">2 Monate geschenkt</span>
					</button>
				</div>
			</div>
		</div>
	</section>

	<section class="pricing-cards">
		<div class="container">
			<div class="cards-grid">
				{#each PRICING_CONFIG.plans as plan}
					<div class="pricing-card" class:popular={plan.popular}>
						{#if plan.badge}
							<div class="plan-badge {plan.badge.toLowerCase()}">
								{plan.badge}
							</div>
						{/if}

						<div class="plan-header">
							<h3 class="plan-name">{plan.name}</h3>
							<p class="plan-subtitle">{plan.subtitle}</p>
						</div>

						<div class="pricing-section">
							<div class="price-display">
								{#if plan.savings && selectedPeriod === "yearly"}
									<div class="discount-badge">-{plan.savings}</div>
								{/if}

								{#if plan.price[selectedPeriod] === 0}
									<span class="current-price">0,00 €</span>
								{:else}
									<span class="current-price"
										>{formatPrice(plan.price[selectedPeriod])}</span
									>
								{/if}
							</div>

							<div class="price-details">
								{#if plan.price[selectedPeriod] === 0}
									<span class="price-period">Dauerhaft kostenlos.</span>
									<span class="price-note">Keine Kreditkarte erforderlich.</span
									>
								{:else}
									<span class="price-period"> pro Monat (zzgl. MwSt.) </span>
									<span class="price-note">
										{selectedPeriod === "yearly"
											? "Abrechnung erfolgt alle zwei Jahre."
											: "Abrechnung erfolgt monatlich."}
									</span>
								{/if}
							</div>
						</div>

						<div class="plan-description">
							<p>{plan.description}</p>
						</div>

						<!-- CTA Button -->
						<div class="plan-action">
							<button
								class="plan-button {plan.ctaStyle}"
								on:click={() => handlePlanSelection(plan)}
								disabled={loading}
							>
								{plan.cta}
							</button>
						</div>

						<!-- Features List - detailliert wie in Referenz -->
						<div class="plan-features">
							<div class="features-included">
								{#if plan.id === "wachstum"}
									<h4>
										← Alle Funktionen aus <span class="inherit-from"
											>Freelancer</span
										> sowie:
									</h4>
								{:else}
									<h4>
										Diese Funktionen sind im Tarif <span class="plan-highlight"
											>{plan.name}</span
										> enthalten:
									</h4>
								{/if}
							</div>

							<ul class="features-list">
								{#each plan.features as feature}
									<li class="feature-item">
										<span class="feature-check">✓</span>
										<span class="feature-text">{feature}</span>
									</li>
								{/each}
							</ul>

							{#if plan.limitations.length > 0}
								<ul class="limitations-list">
									{#each plan.limitations as limitation}
										<li class="limitation-item">
											<span class="limitation-icon">❌</span>
											<span class="limitation-text">{limitation}</span>
										</li>
									{/each}
								</ul>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Common Features Section - wie "In allen Tarifen enthalten" -->
	<section class="common-features">
		<div class="container">
			<div class="section-header">
				<h2>In allen Tarifen enthalten</h2>
			</div>

			<div class="common-features-grid">
				{#each PRICING_CONFIG.commonFeatures as feature}
					<div class="common-feature">
						<span class="feature-icon">{feature.icon}</span>
						<h3>{feature.title}</h3>
						<p>{feature.description}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Detailed Comparison Table - wie in Referenz -->
	<section class="detailed-comparison">
		<div class="container">
			<div class="section-header">
				<h2>Alle Tarife im Vergleich</h2>
			</div>

			<div class="comparison-wrapper">
				<!-- Header mit Preisen -->
				<div class="comparison-header">
					<div class="comparison-cell plan-header"></div>
					<div class="comparison-cell plan-header">Starter</div>
					<div class="comparison-cell plan-header popular">Freelancer</div>
					<div class="comparison-cell plan-header">Wachstum</div>
				</div>

				<div class="comparison-prices">
					<div class="comparison-cell price-cell"></div>
					<div class="comparison-cell price-cell">Kostenlos</div>
					<div class="comparison-cell price-cell popular">
						{formatPrice(PRICING_CONFIG.plans[1].price[selectedPeriod])}
					</div>
					<div class="comparison-cell price-cell">
						{formatPrice(PRICING_CONFIG.plans[2].price[selectedPeriod])}
					</div>
				</div>

				<div class="comparison-cta-row">
					<div class="comparison-cell"></div>
					<div class="comparison-cell">
						<button class="comparison-cta secondary">Kostenlos testen</button>
					</div>
					<div class="comparison-cell popular">
						<button class="comparison-cta primary">Kostenlos testen</button>
					</div>
					<div class="comparison-cell">
						<button class="comparison-cta primary">Kostenlos testen</button>
					</div>
				</div>

				<!-- Feature Categories -->
				{#each PRICING_CONFIG.detailedFeatures as category}
					<div class="comparison-category">
						<div class="category-title">{category.category}</div>

						{#each category.items as item}
							<div class="comparison-row" class:important={item.important}>
								<div class="comparison-cell feature-name">
									{item.name}
									{#if item.badge}
										<span class="feature-badge">{item.badge}</span>
									{/if}
								</div>
								<div class="comparison-cell feature-value">{item.starter}</div>
								<div class="comparison-cell feature-value popular">
									{item.wachstum}
								</div>
								<div class="comparison-cell feature-value">
									{item.freelancer}
								</div>
							</div>
						{/each}
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- FAQ Section -->
	<section class="faq">
		<div class="container">
			<div class="section-header">
				<h2>Häufig gestellte Fragen</h2>
				<p>Antworten auf die wichtigsten Fragen zu unseren Plänen</p>
			</div>

			<div class="faq-list">
				{#each faqs as faq, i}
					<div class="faq-item" class:active={activeFaq === i}>
						<button class="faq-question" on:click={() => toggleFaq(i)}>
							<span class="question-text">{faq.question}</span>
							<span class="question-icon" class:rotated={activeFaq === i}>
								<svg
									viewBox="0 0 24 24"
									width="20"
									height="20"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<polyline points="6,9 12,15 18,9" />
								</svg>
							</span>
						</button>
						{#if activeFaq === i}
							<div class="faq-answer" transition:slide={{ duration: 300 }}>
								<p>{faq.answer}</p>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Final CTA -->
	<section class="final-cta">
		<div class="container">
			<div class="cta-content">
				<h2>Noch unsicher?</h2>
				<p>
					Starte mit unserem kostenlosen Plan und überzeuge dich selbst. Kein
					Risiko, keine Kreditkarte erforderlich.
				</p>
				<div class="cta-actions">
					<a href="/erstellen" class="btn btn-primary btn-large">
						Jetzt kostenlos starten
					</a>
				</div>
			</div>
		</div>
	</section>
</div>

<style>
	/* Design System inspiriert von der Referenz */
	:root {
		--section-padding: clamp(3rem, 8vw, 6rem);
		--container-padding: clamp(1rem, 4vw, 2rem);
		--card-padding: clamp(1.5rem, 4vw, 2rem);
		--border-radius-card: 12px;
		--shadow-card: 0 2px 20px rgba(0, 0, 0, 0.08);
		--shadow-card-hover: 0 8px 40px rgba(0, 0, 0, 0.12);
		--color-success: #10b981;
		--color-warning: #f59e0b;
		--color-error: #ef4444;
		--transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	/* Container */
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 var(--container-padding);
		width: 100%;
	}

	/* Page Layout */
	.pricing-page {
		display: flex;
		flex-direction: column;
	}

	/* Hero Section */
	.hero {
		text-align: center;
		background: linear-gradient(135deg, var(--bg-white) 0%, #fafbfc 100%);
		padding: var(--section-padding) 0 0 0;
	}

	.hero-content {
		max-width: 700px;
		margin: 0 auto;
	}

	.hero h1 {
		font-size: clamp(2.5rem, 5vw, 3.5rem);
		font-weight: 800;
		color: var(--text-dark);
		margin-bottom: 1.5rem;
		line-height: 1.1;
	}

	.hero-description {
		font-size: clamp(1.125rem, 2.5vw, 1.375rem);
		color: var(--text-light);
		margin-bottom: 3rem;
		line-height: 1.5;
	}

	/* Period Toggle - Design wie in Referenz */
	.period-toggle {
		display: inline-flex;
		background: #f1f5f9;
		border-radius: 8px;
		padding: 6px;
		margin-bottom: 2rem;
	}

	.period-option {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: transparent;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 600;
		color: #64748b;
		white-space: nowrap;
		position: relative;
	}

	.period-option.active {
		background: var(--primary-color);
		color: var(--text-darkte);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.savings-label {
		position: absolute;
		top: -50%;
		right: -10px;
		background: #ef4444;
		color: white;
		padding: 0.125rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 700;
		margin-left: 0.5rem;
	}

	/* Pricing Cards */
	.pricing-cards {
		padding: var(--section-padding) 0;
		background: white;
	}

	.cards-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		gap: 2rem;
		align-items: stretch;
	}

	.pricing-card {
		background: white;
		border: 2px solid #f1f5f9;
		border-radius: var(--border-radius-card);
		padding: 0;
		position: relative;
		transition: var(--transition);
		display: flex;
		flex-direction: column;
		height: 100%;
		box-shadow: var(--shadow-card);
		overflow: hidden;
	}

	.pricing-card:hover {
		transform: translateY(-4px);
		box-shadow: var(--shadow-card-hover);
		border-color: var(--primary-color);
	}

	.pricing-card.popular {
		border-color: var(--primary-color);
		transform: scale(1.05);
		position: relative;
	}

	.pricing-card.popular:hover {
		transform: scale(1.05) translateY(-4px);
	}

	.plan-badge {
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		background: var(--primary-color);
		color: var(--text-dark);
		padding: 0.5rem 1.5rem;
		border-radius: 0 0 8px 8px;
		font-size: 0.875rem;
		font-weight: 600;
		z-index: 10;
	}

	.plan-badge.beliebt {
		background: var(--primary-color);
	}

	/* Plan Header */
	.plan-header {
		text-align: center;
		padding: var(--card-padding) var(--card-padding) 1rem;
		margin-top: 1rem;
	}

	.plan-name {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-dark);
		margin: 0 0 0.5rem 0;
	}

	.plan-subtitle {
		color: var(--text-light);
		margin: 0;
		font-size: 1rem;
	}

	/* Pricing Section - wie in Referenz */
	.pricing-section {
		text-align: center;
		padding: 0 var(--card-padding) 1.5rem;
	}

	.discount-badge {
		background: #6366f1;
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		display: inline-block;

		position: absolute;

		right: 0%;
		top: -10%;
	}

	.price-display {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1rem 0;
		margin-bottom: 0.75rem;
	}

	.current-price {
		font-size: clamp(2.5rem, 5vw, 3.5rem);
		font-weight: 800;
		color: var(--text-dark);
		line-height: 1;
	}

	.price-details {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.price-period {
		color: var(--text-light);
		font-size: 1rem;
		font-weight: 500;
	}

	.price-note {
		color: #9ca3af;
		font-size: 0.875rem;
	}

	/* Plan Description */
	.plan-description {
		padding: 0 var(--card-padding) 1.5rem;
		flex-grow: 1;
	}

	.plan-description p {
		color: var(--text-light);
		line-height: 1.6;
		margin: 0;
		font-size: 0.95rem;
	}

	/* Plan Action */
	.plan-action {
		padding: 0 var(--card-padding) 1.5rem;
		margin-top: auto;
	}

	.plan-button {
		width: 100%;
		padding: 1rem 1.5rem;
		font-size: 1rem;
		font-weight: 600;
		border-radius: 8px;
		border: none;
		cursor: pointer;
		transition: var(--transition);
		font-family: inherit;
	}

	.plan-button.primary {
		background: var(--primary-color);
		color: black;
	}

	.plan-button.primary:hover {
		background: var(--primary-color);
		transform: translateY(-1px);
	}

	.plan-button.secondary {
		background: transparent;
		color: var(--primary-color);
		border: 2px solid var(--primary-color);
	}

	.plan-button.secondary:hover {
		background: var(--primary-color);
		color: black;
	}

	/* Plan Features */
	.plan-features {
		padding: 0 var(--card-padding) var(--card-padding);
		border-top: 1px solid #f1f5f9;
		margin-top: auto;
	}

	.features-included {
		margin-bottom: 1rem;
	}

	.features-included h4 {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-light);
		margin: 0.75rem 0;
	}

	.inherit-from {
		color: var(--primary-color);
		font-weight: 700;
	}

	.plan-highlight {
		color: var(--text-dark);
		font-weight: 700;
	}

	.features-list,
	.limitations-list {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin: 0;
		padding: 0;
	}

	.feature-item,
	.limitation-item {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		font-size: 0.9rem;
		line-height: 1.5;
	}

	.feature-check {
		color: var(--color-success);
		font-weight: 600;
		flex-shrink: 0;
		margin-top: 0.125rem;
	}

	.limitation-icon {
		flex-shrink: 0;
		margin-top: 0.125rem;
		opacity: 0.6;
	}

	.feature-text {
		color: var(--text-dark);
	}

	.limitation-text {
		color: var(--text-light);
		font-style: italic;
	}

	/* Common Features */
	.common-features {
		background: #f8fafc;
		padding: var(--section-padding) 0;
	}

	.common-features-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 2rem;
	}

	.common-feature {
		text-align: center;
		padding: 1.5rem;
	}

	.common-feature .feature-icon {
		font-size: 2.5rem;
		display: block;
		margin-bottom: 1rem;
	}

	.common-feature h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-dark);
		margin: 0 0 0.5rem 0;
	}

	.common-feature p {
		color: var(--text-light);
		margin: 0;
		font-size: 0.9rem;
		line-height: 1.5;
	}

	/* Detailed Comparison */
	.detailed-comparison {
		background: white;
		padding: var(--section-padding) 0;
	}

	.section-header {
		text-align: center;
		margin-bottom: 3rem;
		max-width: 600px;
		margin-left: auto;
		margin-right: auto;
	}

	.section-header h2 {
		font-size: clamp(1.75rem, 4vw, 2.5rem);
		font-weight: 700;
		color: var(--text-dark);
		margin-bottom: 0.5rem;
	}

	.section-header p {
		color: var(--text-light);
		font-size: 1.125rem;
		margin: 0;
	}

	.comparison-wrapper {
		background: white;
		border: 1px solid #f1f5f9;
		border-radius: var(--border-radius-card);
		overflow: hidden;
		box-shadow: var(--shadow-card);
	}

	.comparison-header,
	.comparison-prices,
	.comparison-cta-row {
		display: grid;
		grid-template-columns: 2fr 1fr 1fr 1fr;
		border-bottom: 1px solid #f1f5f9;
	}

	.comparison-cell {
		padding: 1rem;
		text-align: center;
		border-right: 1px solid #f1f5f9;
	}

	.comparison-cell:last-child {
		border-right: none;
	}

	.feature-header {
		background: #f8fafc;
		font-weight: 600;
		text-align: left !important;
	}

	.plan-header {
		background: #f8fafc;
		font-weight: 600;
		font-size: 1.125rem;
	}

	.plan-header.popular {
		background: rgba(123, 254, 132, 0.1);
		position: relative;
	}

	.price-cell {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--text-dark);
	}

	.price-cell.popular {
		background: rgba(123, 254, 132, 0.1);
	}

	.comparison-cta {
		padding: 0.5rem 1rem;
		border-radius: 6px;
		border: none;
		font-weight: 600;
		cursor: pointer;
		transition: var(--transition);
		font-size: 0.875rem;
	}

	.comparison-cta.primary {
		background: var(--primary-dark);
		color: rgb(255, 255, 255);
	}

	.comparison-cta.secondary {
		background: transparent;
		color: var(--primary-color);
		border: 1px solid var(--primary-color);
	}

	.comparison-category {
		border-bottom: 1px solid #f1f5f9;
	}

	.category-title {
		background: #f1f5f9;
		padding: 1rem;
		font-weight: 600;
		color: var(--text-dark);
		border-bottom: 1px solid #e2e8f0;
	}

	.comparison-row {
		display: grid;
		grid-template-columns: 2fr 1fr 1fr 1fr;
	}

	.comparison-row.important {
		background: #fefce8;
	}

	.feature-name {
		text-align: left !important;
		font-weight: 500;
		color: var(--text-dark);
		padding: 1rem;
		border-right: 1px solid #f1f5f9;
	}

	.feature-badge {
		background: #3b82f6;
		color: white;
		padding: 0.125rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		margin-left: 0.5rem;
	}

	.feature-value {
		font-weight: 500;
		color: var(--text-dark);
		padding: 1rem;
		border-right: 1px solid #f1f5f9;
	}

	.feature-value:last-child {
		border-right: none;
	}

	.feature-value.popular {
		background: rgba(123, 254, 132, 0.05);
	}

	/* FAQ Section */
	.faq {
		background: #f8fafc;
		padding: var(--section-padding) 0;
	}

	.faq-list {
		max-width: 800px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.faq-item {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		overflow: hidden;
		transition: var(--transition);
	}

	.faq-item.active {
		border-color: var(--primary-color);
		box-shadow: 0 0 0 1px rgba(123, 254, 132, 0.2);
	}

	.faq-question {
		width: 100%;
		background: none;
		border: none;
		padding: 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		cursor: pointer;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-dark);
		transition: var(--transition);
		text-align: left;
	}

	.faq-question:hover {
		background: #f8fafc;
	}

	.question-icon {
		color: var(--primary-color);
		transition: var(--transition);
		flex-shrink: 0;
		margin-left: 1rem;
	}

	.question-icon.rotated {
		transform: rotate(180deg);
	}

	.faq-answer {
		padding: 0 1.5rem 1.5rem;
		color: var(--text-light);
		line-height: 1.6;
	}

	.faq-answer p {
		margin: 0;
	}

	/* Final CTA */
	.final-cta {
		background: linear-gradient(135deg, var(--text-dark) 0%, #374151 100%);
		color: white;
		padding: var(--section-padding) 0;
		text-align: center;
	}

	.cta-content {
		max-width: 600px;
		margin: 0 auto;
	}

	.cta-content h2 {
		font-size: clamp(1.75rem, 4vw, 2.5rem);
		color: white;
		margin-bottom: 1rem;
	}

	.cta-content p {
		font-size: 1.125rem;
		opacity: 0.9;
		margin-bottom: 2rem;
		line-height: 1.6;
	}

	.cta-actions {
		display: flex;
		justify-content: center;
	}

	.btn-large {
		padding: 1rem 2rem;
		font-size: 1.125rem;
		min-width: 200px;
	}

	/* Responsive Design */
	@media (max-width: 968px) {
		.cards-grid {
			grid-template-columns: 1fr;
			max-width: 400px;
			margin: 0 auto;
		}

		.pricing-card.popular {
			transform: none;
		}

		.pricing-card.popular:hover {
			transform: translateY(-4px);
		}

		.comparison-wrapper {
			overflow-x: auto;
		}

		.comparison-header,
		.comparison-prices,
		.comparison-cta-row,
		.comparison-row {
			min-width: 600px;
		}

		.common-features-grid {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 640px) {
		.period-toggle {
			flex-direction: column;
			width: 100%;
			max-width: 300px;
		}

		.period-option {
			width: 100%;
			justify-content: center;
		}

		.comparison-cell {
			padding: 0.75rem 0.5rem;
			font-size: 0.875rem;
		}
	}

	/* Button Styles */
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.75rem 2rem;
		border-radius: 8px;
		text-decoration: none;
		font-weight: 600;
		transition: var(--transition);
		cursor: pointer;
		border: none;
		font-size: 1rem;
		min-height: 48px;
	}

	.btn-primary {
		background: var(--primary-color);
		color: var(--text-dark);
	}

	.btn-primary:hover {
		background: var(--primary-dark);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(123, 254, 132, 0.3);
	}

	/* Accessibility */
	@media (prefers-reduced-motion: reduce) {
		.pricing-card,
		.faq-item,
		.period-option,
		.question-icon {
			transition: none;
		}

		.pricing-card:hover,
		.pricing-card.popular {
			transform: none;
		}
	}

	.plan-button:focus-visible,
	.faq-question:focus-visible,
	.period-option:focus-visible {
		outline: 2px solid var(--primary-color);
		outline-offset: 2px;
	}
</style>
