<!-- src/routes/dashboard/+page.svelte -->
<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { user, isPremium } from '$lib/auth/auth0.js';
    import { 
      savedInvoices, 
      templates, 
      customers, 
      loadInvoices, 
      loadTemplates, 
      loadCustomers,
      loading 
    } from '$lib/stores/premium.js';
    
    let activeTab = 'overview';
    let stats = {
      invoicesCount: 0,
      customersCount: 0,
      templatesCount: 0,
      lastInvoiceDate: null
    };
    
    onMount(async () => {
      // Check if user is premium
      
      
      // Load user data
      try {
        await Promise.all([
          loadInvoices(),
          loadTemplates(),
          loadCustomers()
        ]);
        
        updateStats();
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    });
    
    function updateStats() {
      stats = {
        invoicesCount: $savedInvoices.length,
        customersCount: $customers.length,
        templatesCount: $templates.length,
        lastInvoiceDate: $savedInvoices[0]?.createdAt || null
      };
    }
    
    function formatDate(dateString) {
      if (!dateString) return 'Noch keine';
      return new Date(dateString).toLocaleDateString('de-DE');
    }
  </script>
  
  <svelte:head>
    <title>Premium Dashboard | kostenlose-erechnung.de</title>
  </svelte:head>
  
  <div class="dashboard-container">
    <div class="dashboard-header">
      <div class="welcome">
        <h1>Willkommen zurück, {$user?.name || 'Premium-Nutzer'}</h1>
        <p>Verwalten Sie Ihre E-Rechnungen, Kunden und Vorlagen</p>
      </div>
      
      <div class="actions">
        <a href="/erstellen" class="btn btn-primary">
          + Neue Rechnung
        </a>
      </div>
    </div>
    
    {#if $loading}
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>Lade Ihre Daten...</p>
      </div>
    {:else}
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📄</div>
          <div class="stat-content">
            <div class="stat-value">{stats.invoicesCount}</div>
            <div class="stat-label">Rechnungen</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <div class="stat-value">{stats.customersCount}</div>
            <div class="stat-label">Kunden</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">📋</div>
          <div class="stat-content">
            <div class="stat-value">{stats.templatesCount}</div>
            <div class="stat-label">Vorlagen</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">📅</div>
          <div class="stat-content">
            <div class="stat-value">{formatDate(stats.lastInvoiceDate)}</div>
            <div class="stat-label">Letzte Rechnung</div>
          </div>
        </div>
      </div>
      
      <div class="dashboard-content">
        <nav class="tabs">
          <button 
            class="tab" 
            class:active={activeTab === 'overview'}
            on:click={() => activeTab = 'overview'}
          >
            Übersicht
          </button>
          <button 
            class="tab" 
            class:active={activeTab === 'invoices'}
            on:click={() => activeTab = 'invoices'}
          >
            Rechnungen
          </button>
          <button 
            class="tab" 
            class:active={activeTab === 'customers'}
            on:click={() => activeTab = 'customers'}
          >
            Kunden
          </button>
          <button 
            class="tab" 
            class:active={activeTab === 'templates'}
            on:click={() => activeTab = 'templates'}
          >
            Vorlagen
          </button>
          <button 
            class="tab" 
            class:active={activeTab === 'api'}
            on:click={() => activeTab = 'api'}
          >
            API
          </button>
        </nav>
        
        <div class="tab-content">
          {#if activeTab === 'overview'}
            <div class="overview-section">
              <h2>Schnellzugriff</h2>
              
              <div class="quick-actions">
                <a href="/erstellen" class="quick-action">
                  <span class="icon">📄</span>
                  <span>Neue Rechnung erstellen</span>
                </a>
                
                <a href="/dashboard/customers/new" class="quick-action">
                  <span class="icon">👤</span>
                  <span>Neuen Kunden anlegen</span>
                </a>
                
                <a href="/dashboard/templates/new" class="quick-action">
                  <span class="icon">📋</span>
                  <span>Neue Vorlage erstellen</span>
                </a>
                
                <a href="/auslesen" class="quick-action">
                  <span class="icon">🔍</span>
                  <span>Rechnung prüfen</span>
                </a>
              </div>
              
              {#if $savedInvoices.length > 0}
                <h3>Letzte Rechnungen</h3>
                <div class="recent-invoices">
                  {#each $savedInvoices.slice(0, 5) as invoice}
                    <div class="invoice-item">
                      <div class="invoice-info">
                        <strong>{invoice.metadata.invoiceNumber}</strong>
                        <span>{invoice.recipient.name}</span>
                      </div>
                      <div class="invoice-meta">
                        <span>{formatDate(invoice.metadata.date)}</span>
                        <span class="amount">{invoice.total?.toFixed(2)} €</span>
                      </div>
                      <div class="invoice-actions">
                        <button class="btn-icon" title="Bearbeiten">✏️</button>
                        <button class="btn-icon" title="Duplizieren">📋</button>
                        <button class="btn-icon" title="Herunterladen">⬇️</button>
                      </div>
                    </div>
                  {/each}
                </div>
              {:else}
                <div class="empty-state">
                  <p>Sie haben noch keine Rechnungen erstellt.</p>
                  <a href="/erstellen" class="btn btn-primary">Erste Rechnung erstellen</a>
                </div>
              {/if}
            </div>
            
          {:else if activeTab === 'invoices'}
            <div class="invoices-section">
              <div class="section-header">
                <h2>Alle Rechnungen</h2>
                <div class="filters">
                  <input type="search" placeholder="Suchen..." class="search-input" />
                  <select class="filter-select">
                    <option>Alle</option>
                    <option>Diesen Monat</option>
                    <option>Letzten Monat</option>
                    <option>Dieses Jahr</option>
                  </select>
                </div>
              </div>
              
              {#if $savedInvoices.length > 0}
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Nr.</th>
                      <th>Kunde</th>
                      <th>Datum</th>
                      <th>Betrag</th>
                      <th>Status</th>
                      <th>Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each $savedInvoices as invoice}
                      <tr>
                        <td>{invoice.metadata.invoiceNumber}</td>
                        <td>{invoice.recipient.name}</td>
                        <td>{formatDate(invoice.metadata.date)}</td>
                        <td class="amount">{invoice.total?.toFixed(2)} €</td>
                        <td>
                          <span class="status paid">Bezahlt</span>
                        </td>
                        <td>
                          <div class="table-actions">
                            <button class="btn-icon" title="Anzeigen">👁️</button>
                            <button class="btn-icon" title="Bearbeiten">✏️</button>
                            <button class="btn-icon" title="Herunterladen">⬇️</button>
                            <button class="btn-icon danger" title="Löschen">🗑️</button>
                          </div>
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              {:else}
                <div class="empty-state">
                  <p>Keine Rechnungen vorhanden.</p>
                  <a href="/erstellen" class="btn btn-primary">Neue Rechnung erstellen</a>
                </div>
              {/if}
            </div>
            
          {:else if activeTab === 'customers'}
            <div class="customers-section">
              <div class="section-header">
                <h2>Kundenverwaltung</h2>
                <a href="/dashboard/customers/new" class="btn btn-primary">
                  + Neuer Kunde
                </a>
              </div>
              
              {#if $customers.length > 0}
                <div class="customers-grid">
                  {#each $customers as customer}
                    <div class="customer-card">
                      <div class="customer-header">
                        <h4>{customer.name}</h4>
                        <div class="customer-actions">
                          <button class="btn-icon" title="Bearbeiten">✏️</button>
                          <button class="btn-icon danger" title="Löschen">🗑️</button>
                        </div>
                      </div>
                      <div class="customer-details">
                        <p>{customer.street}</p>
                        <p>{customer.zip} {customer.city}</p>
                        {#if customer.email}
                          <p class="email">📧 {customer.email}</p>
                        {/if}
                        {#if customer.ustId}
                          <p class="tax-id">USt-IdNr.: {customer.ustId}</p>
                        {/if}
                      </div>
                      <button class="btn btn-secondary full-width">
                        Neue Rechnung
                      </button>
                    </div>
                  {/each}
                </div>
              {:else}
                <div class="empty-state">
                  <p>Keine Kunden vorhanden.</p>
                  <a href="/dashboard/customers/new" class="btn btn-primary">Ersten Kunden anlegen</a>
                </div>
              {/if}
            </div>
            
          {:else if activeTab === 'templates'}
            <div class="templates-section">
              <div class="section-header">
                <h2>Rechnungsvorlagen</h2>
                <a href="/dashboard/templates/new" class="btn btn-primary">
                  + Neue Vorlage
                </a>
              </div>
              
              {#if $templates.length > 0}
                <div class="templates-grid">
                  {#each $templates as template}
                    <div class="template-card">
                      <h4>{template.name}</h4>
                      <p class="template-desc">{template.description}</p>
                      <div class="template-meta">
                        <span>Erstellt: {formatDate(template.createdAt)}</span>
                        <span>{template.itemsCount} Positionen</span>
                      </div>
                      <div class="template-actions">
                        <button class="btn btn-secondary">Verwenden</button>
                        <button class="btn-icon" title="Bearbeiten">✏️</button>
                        <button class="btn-icon danger" title="Löschen">🗑️</button>
                      </div>
                    </div>
                  {/each}
                </div>
              {:else}
                <div class="empty-state">
                  <p>Keine Vorlagen vorhanden.</p>
                  <a href="/dashboard/templates/new" class="btn btn-primary">Erste Vorlage erstellen</a>
                </div>
              {/if}
            </div>
            
          {:else if activeTab === 'api'}
            <div class="api-section">
              <h2>API-Zugang</h2>
              <p>Integrieren Sie die E-Rechnungserstellung in Ihre eigenen Anwendungen.</p>
              
              <div class="api-info">
                <h3>Ihre API-Endpunkte</h3>
                <div class="endpoint-list">
                  <div class="endpoint">
                    <code>POST /api/v1/invoices</code>
                    <span>Neue Rechnung erstellen</span>
                  </div>
                  <div class="endpoint">
                    <code>GET /api/v1/invoices</code>
                    <span>Rechnungen abrufen</span>
                  </div>
                  <div class="endpoint">
                    <code>GET /api/v1/customers</code>
                    <span>Kunden abrufen</span>
                  </div>
                  <div class="endpoint">
                    <code>POST /api/v1/validate</code>
                    <span>Rechnung validieren</span>
                  </div>
                </div>
              </div>
              
              <div class="api-keys">
                <h3>API-Schlüssel</h3>
                <div class="api-key-list">
                  <div class="api-key-item">
                    <div class="key-info">
                      <strong>Production API Key</strong>
                      <span>Erstellt am {formatDate(new Date())}</span>
                    </div>
                    <div class="key-value">
                      <code>sk_live_****************************</code>
                      <button class="btn-icon" title="Kopieren">📋</button>
                    </div>
                  </div>
                </div>
                
                <button class="btn btn-secondary">
                  + Neuen API-Schlüssel generieren
                </button>
              </div>
              
              <div class="api-docs">
                <h3>Dokumentation</h3>
                <p>Vollständige API-Dokumentation mit Beispielen in verschiedenen Programmiersprachen.</p>
                <a href="/api-docs" class="btn btn-primary">
                  API-Dokumentation öffnen
                </a>
              </div>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
  
  <style>
    .dashboard-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }
    
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }
    
    .welcome h1 {
      margin-bottom: 0.5rem;
    }
    
    .welcome p {
      color: var(--text-light);
    }
    
    .loading-spinner {
      text-align: center;
      padding: 4rem;
    }
    
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid var(--border-color);
      border-top-color: var(--primary-color);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }
    
    .stat-card {
      background: var(--bg-white);
      padding: 1.5rem;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      gap: 1.5rem;
      transition: all 0.3s ease;
    }
    
    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }
    
    .stat-icon {
      font-size: 2.5rem;
      width: 60px;
      height: 60px;
      background: var(--bg-light);
      border-radius: var(--radius);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-dark);
    }
    
    .stat-label {
      color: var(--text-light);
      font-size: 0.875rem;
    }
    
    .tabs {
      display: flex;
      gap: 1rem;
      border-bottom: 2px solid var(--border-color);
      margin-bottom: 2rem;
    }
    
    .tab {
      background: none;
      border: none;
      padding: 0.75rem 1.5rem;
      font-weight: 500;
      color: var(--text-light);
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
    }
    
    .tab:hover {
      color: var(--text-dark);
    }
    
    .tab.active {
      color: var(--primary-dark);
    }
    
    .tab.active::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      right: 0;
      height: 2px;
      background: var(--primary-color);
    }
    
    .tab-content {
      min-height: 400px;
    }
    
    .quick-actions {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 3rem;
    }
    
    .quick-action {
      background: var(--bg-light);
      padding: 1.5rem;
      border-radius: var(--radius);
      text-align: center;
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      color: var(--text-dark);
      text-decoration: none;
    }
    
    .quick-action:hover {
      background: var(--primary-light);
      transform: translateY(-2px);
    }
    
    .quick-action .icon {
      font-size: 2rem;
    }
    
    .recent-invoices {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .invoice-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: var(--bg-light);
      border-radius: var(--radius);
    }
    
    .invoice-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    
    .invoice-meta {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      text-align: right;
    }
    
    .amount {
      font-weight: 600;
      color: var(--primary-dark);
    }
    
    .invoice-actions {
      display: flex;
      gap: 0.5rem;
    }
    
    .btn-icon {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.25rem;
      padding: 0.25rem;
      transition: transform 0.2s ease;
    }
    
    .btn-icon:hover {
      transform: scale(1.1);
    }
    
    .btn-icon.danger:hover {
      color: #e74c3c;
    }
    
    .empty-state {
      text-align: center;
      padding: 3rem;
      color: var(--text-light);
    }
    
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }
    
    .filters {
      display: flex;
      gap: 1rem;
    }
    
    .search-input {
      padding: 0.5rem 1rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius);
      min-width: 250px;
    }
    
    .filter-select {
      padding: 0.5rem 1rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius);
      background: var(--bg-white);
    }
    
    .data-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .data-table th,
    .data-table td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }
    
    .data-table th {
      font-weight: 600;
      background: var(--bg-light);
    }
    
    .table-actions {
      display: flex;
      gap: 0.5rem;
    }
    
    .status {
      padding: 0.25rem 0.75rem;
      border-radius: 50px;
      font-size: 0.875rem;
      font-weight: 500;
    }
    
    .status.paid {
      background: #d4edda;
      color: #155724;
    }
    
    .customers-grid,
    .templates-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }
    
    .customer-card,
    .template-card {
      background: var(--bg-white);
      padding: 1.5rem;
      border-radius: var(--radius);
      border: 1px solid var(--border-color);
    }
    
    .customer-header,
    .template-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }
    
    .customer-details {
      margin-bottom: 1rem;
      color: var(--text-light);
    }
    
    .customer-details p {
      margin: 0.25rem 0;
    }
    
    .email {
      color: var(--primary-dark);
    }
    
    .full-width {
      width: 100%;
    }
    
    .template-desc {
      color: var(--text-light);
      margin-bottom: 1rem;
    }
    
    .template-meta {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1rem;
      font-size: 0.875rem;
      color: var(--text-light);
    }
    
    .template-actions {
      display: flex;
      gap: 0.5rem;
    }
    
    .api-info,
    .api-keys,
    .api-docs {
      background: var(--bg-light);
      padding: 2rem;
      border-radius: var(--radius);
      margin-bottom: 2rem;
    }
    
    .endpoint-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-top: 1rem;
    }
    
    .endpoint {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: var(--bg-white);
      border-radius: var(--radius);
    }
    
    .endpoint code {
      font-family: monospace;
      font-weight: 600;
      color: var(--primary-dark);
    }
    
    .api-key-item {
      background: var(--bg-white);
      padding: 1rem;
      border-radius: var(--radius);
      margin-bottom: 1rem;
    }
    
    .key-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }
    
    .key-value {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .key-value code {
      flex: 1;
      padding: 0.5rem;
      background: var(--bg-light);
      border-radius: var(--radius);
      font-family: monospace;
    }
    
    @media (max-width: 768px) {
      .dashboard-header {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }
      
      .stats-grid {
        grid-template-columns: 1fr;
      }
      
      .tabs {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }
      
      .data-table {
        font-size: 0.875rem;
      }
      
      .filters {
        flex-direction: column;
      }
      
      .search-input {
        min-width: auto;
        width: 100%;
      }
    }
  </style>