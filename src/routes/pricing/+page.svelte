<!-- src/routes/pricing/+page.svelte -->
<script>
    import { onMount } from 'svelte';
    import { isAuthenticated, login } from '$lib/auth/auth0.js';
    import { createSubscription, PLANS } from '$lib/payments/mollie.js';
    
    let loading = false;
    let selectedPlan = 'monthly';
    
    async function handleSubscribe(planId) {
      if (!$isAuthenticated) {
        await login('/pricing');
        return;
      }
      
      loading = true;
      try {
        await createSubscription(planId);
      } catch (error) {
        console.error('Subscription error:', error);
        alert('Fehler beim Erstellen des Abonnements. Bitte versuchen Sie es erneut.');
      } finally {
        loading = false;
      }
    }
    
    const features = [
      { name: 'E-Rechnungen erstellen', free: '5 pro Monat', premium: 'Unbegrenzt' },
      { name: 'Cloud-Speicherung', free: '❌', premium: '✅ Unbegrenzt' },
      { name: 'Rechnungsvorlagen', free: '❌', premium: '✅ Unbegrenzt' },
      { name: 'Kundenverwaltung', free: '❌', premium: '✅ Mit Autofill' },
      { name: 'API-Zugang', free: '❌', premium: '✅ REST API' },
      { name: 'Datenexport', free: 'PDF/XML', premium: 'PDF/XML/CSV/Excel' },
      { name: 'Support', free: 'Community', premium: 'Priorität' },
      { name: 'Datenspeicherung', free: 'Lokal', premium: 'Cloud (verschlüsselt)' }
    ];
  </script>
  
  <svelte:head>
    <title>Preise & Premium-Features | kostenlose-erechnung.de</title>
    <meta name="description" content="Upgraden Sie auf Premium für unbegrenzte E-Rechnungen, Cloud-Speicherung, Vorlagen und API-Zugang. Ab 9,99€/Monat." />
  </svelte:head>
  
  <div class="pricing-container">
    <div class="pricing-header">
      <h1>Wählen Sie Ihren Plan</h1>
      <p>Starten Sie kostenlos oder upgraden Sie für erweiterte Funktionen</p>
    </div>
    
    <div class="pricing-toggle">
      <button 
        class="toggle-option" 
        class:active={selectedPlan === 'monthly'}
        on:click={() => selectedPlan = 'monthly'}
      >
        Monatlich
      </button>
      <button 
        class="toggle-option" 
        class:active={selectedPlan === 'yearly'}
        on:click={() => selectedPlan = 'yearly'}
      >
        Jährlich
        <span class="badge">-17%</span>
      </button>
    </div>
    
    <div class="pricing-grid">
      <!-- Free Plan -->
      <div class="pricing-card">
        <div class="plan-header">
          <h2>Kostenlos</h2>
          <div class="price">
            <span class="amount">0€</span>
            <span class="period">für immer</span>
          </div>
        </div>
        
        <div class="plan-features">
          <ul>
            <li>
              <span class="icon">✅</span>
              5 E-Rechnungen pro Monat
            </li>
            <li>
              <span class="icon">✅</span>
              XRechnung & ZUGFeRD
            </li>
            <li>
              <span class="icon">✅</span>
              PDF & XML Export
            </li>
            <li>
              <span class="icon">✅</span>
              Rechnungsprüfung
            </li>
            <li>
              <span class="icon">✅</span>
              Keine Registrierung nötig
            </li>
          </ul>
        </div>
        
        <div class="plan-action">
          <a href="/erstellen" class="btn btn-secondary full-width">
            Jetzt starten
          </a>
        </div>
      </div>
      
      <!-- Premium Plan -->
      <div class="pricing-card featured">
        <div class="featured-badge">Beliebt</div>
        <div class="plan-header">
          <h2>Premium</h2>
          <div class="price">
            {#if selectedPlan === 'monthly'}
              <span class="amount">9,99€</span>
              <span class="period">pro Monat</span>
            {:else}
              <span class="amount">99,99€</span>
              <span class="period">pro Jahr</span>
              <span class="savings">Spare 19,89€</span>
            {/if}
          </div>
        </div>
        
        <div class="plan-features">
          <ul>
            <li>
              <span class="icon">✅</span>
              <strong>Unbegrenzte</strong> E-Rechnungen
            </li>
            <li>
              <span class="icon">✅</span>
              Cloud-Speicherung (verschlüsselt)
            </li>
            <li>
              <span class="icon">✅</span>
              Rechnungsvorlagen
            </li>
            <li>
              <span class="icon">✅</span>
              Kundenverwaltung mit Autofill
            </li>
            <li>
              <span class="icon">✅</span>
              API-Zugang
            </li>
            <li>
              <span class="icon">✅</span>
              Excel & CSV Export
            </li>
            <li>
              <span class="icon">✅</span>
              Prioritäts-Support
            </li>
            <li>
              <span class="icon">✅</span>
              DSGVO-konformer Datenexport
            </li>
          </ul>
        </div>
        
        <div class="plan-action">
          <button 
            class="btn btn-primary full-width" 
            on:click={() => handleSubscribe(selectedPlan === 'monthly' ? 'premium_monthly' : 'premium_yearly')}
            disabled={loading}
          >
            {#if loading}
              Wird geladen...
            {:else}
              Premium werden
            {/if}
          </button>
          <p class="trial-info">7 Tage kostenlos testen</p>
        </div>
      </div>
      
      <!-- Enterprise Plan -->
      <div class="pricing-card">
        <div class="plan-header">
          <h2>Enterprise</h2>
          <div class="price">
            <span class="amount">Individuell</span>
            <span class="period">auf Anfrage</span>
          </div>
        </div>
        
        <div class="plan-features">
          <ul>
            <li>
              <span class="icon">✅</span>
              Alle Premium-Features
            </li>
            <li>
              <span class="icon">✅</span>
              Mehrere Benutzer
            </li>
            <li>
              <span class="icon">✅</span>
              SSO Integration
            </li>
            <li>
              <span class="icon">✅</span>
              Dedizierte Server
            </li>
            <li>
              <span class="icon">✅</span>
              On-Premise Option
            </li>
            <li>
              <span class="icon">✅</span>
              SLA Garantie
            </li>
            <li>
              <span class="icon">✅</span>
              Persönlicher Account Manager
            </li>
            <li>
              <span class="icon">✅</span>
              Individuelle Anpassungen
            </li>
          </ul>
        </div>
        
        <div class="plan-action">
          <a href="mailto:enterprise@kostenlose-erechnung.de" class="btn btn-secondary full-width">
            Kontakt aufnehmen
          </a>
        </div>
      </div>
    </div>
    
    <!-- Feature Comparison Table -->
    <div class="comparison-section">
      <h2>Detaillierter Funktionsvergleich</h2>
      
      <table class="comparison-table">
        <thead>
          <tr>
            <th>Funktion</th>
            <th>Kostenlos</th>
            <th class="featured">Premium</th>
            <th>Enterprise</th>
          </tr>
        </thead>
        <tbody>
          {#each features as feature}
            <tr>
              <td class="feature-name">{feature.name}</td>
              <td>{feature.free}</td>
              <td class="featured">{feature.premium}</td>
              <td>✅ Erweitert</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    
    <!-- FAQ Section -->
    <div class="faq-section">
      <h2>Häufige Fragen zu Premium</h2>
      
      <div class="faq-grid">
        <div class="faq-item">
          <h3>Kann ich Premium kostenlos testen?</h3>
          <p>Ja! Sie können Premium 7 Tage lang kostenlos und unverbindlich testen. Eine Kündigung ist jederzeit möglich.</p>
        </div>
        
        <div class="faq-item">
          <h3>Welche Zahlungsmethoden werden akzeptiert?</h3>
          <p>Wir akzeptieren alle gängigen Zahlungsmethoden über Mollie: Kreditkarte, SEPA-Lastschrift, PayPal und Sofortüberweisung.</p>
        </div>
        
        <div class="faq-item">
          <h3>Kann ich jederzeit kündigen?</h3>
          <p>Ja, Sie können Ihr Abonnement jederzeit zum Ende der Laufzeit kündigen. Bei Jahreszahlungen erfolgt keine anteilige Rückerstattung.</p>
        </div>
        
        <div class="faq-item">
          <h3>Sind meine Daten sicher?</h3>
          <p>Absolut! Alle Daten werden verschlüsselt in deutschen Rechenzentren gespeichert. Wir sind vollständig DSGVO-konform.</p>
        </div>
        
        <div class="faq-item">
          <h3>Was passiert mit meinen Daten nach einer Kündigung?</h3>
          <p>Sie können alle Ihre Daten jederzeit exportieren. Nach der Kündigung bleiben Ihre Daten 30 Tage verfügbar, danach werden sie sicher gelöscht.</p>
        </div>
        
        <div class="faq-item">
          <h3>Gibt es eine API-Dokumentation?</h3>
          <p>Ja, Premium-Nutzer erhalten Zugang zu unserer vollständigen REST API mit ausführlicher Dokumentation und Code-Beispielen.</p>
        </div>
      </div>
    </div>
    
    <!-- Trust Section -->
    <div class="trust-section">
      <h2>Warum uns Tausende Unternehmen vertrauen</h2>
      
      <div class="trust-grid">
        <div class="trust-item">
          <span class="trust-icon">🔒</span>
          <h3>Höchste Sicherheit</h3>
          <p>256-Bit-Verschlüsselung, deutsche Server, DSGVO-konform</p>
        </div>
        
        <div class="trust-item">
          <span class="trust-icon">⚡</span>
          <h3>Immer verfügbar</h3>
          <p>99,9% Uptime-Garantie mit redundanten Systemen</p>
        </div>
        
        <div class="trust-item">
          <span class="trust-icon">🇩🇪</span>
          <h3>Made in Germany</h3>
          <p>Entwickelt und gehostet in Deutschland</p>
        </div>
        
        <div class="trust-item">
          <span class="trust-icon">🤝</span>
          <h3>Fairer Preis</h3>
          <p>Keine versteckten Kosten, jederzeit kündbar</p>
        </div>
      </div>
    </div>
  </div>
  
  <style>
    .pricing-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 4rem 2rem;
    }
    
    .pricing-header {
      text-align: center;
      margin-bottom: 3rem;
    }
    
    .pricing-header h1 {
      margin-bottom: 0.5rem;
    }
    
    .pricing-header p {
      font-size: 1.25rem;
      color: var(--text-light);
    }
    
    .pricing-toggle {
      display: flex;
      justify-content: center;
      gap: 0;
      margin-bottom: 3rem;
    }
    
    .toggle-option {
      padding: 0.75rem 2rem;
      background: var(--bg-light);
      border: 2px solid var(--border-color);
      cursor: pointer;
      transition: all 0.3s ease;
      font-weight: 500;
    }
    
    .toggle-option:first-child {
      border-radius: var(--radius) 0 0 var(--radius);
    }
    
    .toggle-option:last-child {
      border-radius: 0 var(--radius) var(--radius) 0;
      border-left: none;
    }
    
    .toggle-option.active {
      background: var(--primary-color);
      border-color: var(--primary-color);
      color: var(--text-dark);
    }
    
    .badge {
      background: #ff6b6b;
      color: white;
      padding: 0.125rem 0.5rem;
      border-radius: 50px;
      font-size: 0.75rem;
      margin-left: 0.5rem;
    }
    
    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 2rem;
      margin-bottom: 4rem;
    }
    
    .pricing-card {
      background: var(--bg-white);
      border: 2px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 2rem;
      position: relative;
      transition: all 0.3s ease;
    }
    
    .pricing-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
    }
    
    .pricing-card.featured {
      border-color: var(--primary-color);
      transform: scale(1.05);
    }
    
    .featured-badge {
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--primary-color);
      color: var(--text-dark);
      padding: 0.25rem 1rem;
      border-radius: 50px;
      font-size: 0.875rem;
      font-weight: 600;
    }
    
    .plan-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    
    .plan-header h2 {
      font-size: 1.5rem;
      margin-bottom: 1rem;
    }
    
    .price {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
    }
    
    .amount {
      font-size: 3rem;
      font-weight: 700;
      color: var(--text-dark);
    }
    
    .period {
      color: var(--text-light);
    }
    
    .savings {
      color: #27ae60;
      font-size: 0.875rem;
      font-weight: 600;
    }
    
    .plan-features {
      margin-bottom: 2rem;
    }
    
    .plan-features ul {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .plan-features li {
      display: flex;
      align-items: start;
      gap: 0.75rem;
    }
    
    .icon {
      flex-shrink: 0;
      color: var(--primary-color);
    }
    
    .full-width {
      width: 100%;
    }
    
    .trial-info {
      text-align: center;
      margin-top: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-light);
    }
    
    .comparison-section {
      margin-bottom: 4rem;
    }
    
    .comparison-section h2 {
      text-align: center;
      margin-bottom: 2rem;
    }
    
    .comparison-table {
      width: 100%;
      border-collapse: collapse;
      background: var(--bg-white);
      border-radius: var(--radius);
      overflow: hidden;
      box-shadow: var(--shadow);
    }
    
    .comparison-table th,
    .comparison-table td {
      padding: 1rem;
      text-align: center;
      border-bottom: 1px solid var(--border-color);
    }
    
    .comparison-table th {
      background: var(--bg-light);
      font-weight: 600;
    }
    
    .comparison-table th.featured,
    .comparison-table td.featured {
      background: var(--primary-light);
    }
    
    .feature-name {
      text-align: left !important;
      font-weight: 500;
    }
    
    .faq-section {
      margin-bottom: 4rem;
    }
    
    .faq-section h2 {
      text-align: center;
      margin-bottom: 3rem;
    }
    
    .faq-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
    }
    
    .faq-item {
      background: var(--bg-light);
      padding: 1.5rem;
      border-radius: var(--radius);
    }
    
    .faq-item h3 {
      font-size: 1.125rem;
      margin-bottom: 0.5rem;
    }
    
    .faq-item p {
      color: var(--text-light);
      margin: 0;
    }
    
    .trust-section {
      text-align: center;
    }
    
    .trust-section h2 {
      margin-bottom: 3rem;
    }
    
    .trust-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
    }
    
    .trust-item {
      text-align: center;
    }
    
    .trust-icon {
      font-size: 3rem;
      display: block;
      margin-bottom: 1rem;
    }
    
    .trust-item h3 {
      font-size: 1.25rem;
      margin-bottom: 0.5rem;
    }
    
    .trust-item p {
      color: var(--text-light);
      margin: 0;
    }
    
    @media (max-width: 968px) {
      .pricing-grid {
        grid-template-columns: 1fr;
        max-width: 400px;
        margin: 0 auto 4rem;
      }
      
      .pricing-card.featured {
        transform: none;
      }
    }
    
    @media (max-width: 768px) {
      .comparison-table {
        font-size: 0.875rem;
      }
      
      .comparison-table th,
      .comparison-table td {
        padding: 0.75rem 0.5rem;
      }
    }
  </style>