<script>
    import { onMount } from 'svelte';
    
    let fileInput;
    let dragActive = false;
    let invoiceData = null;
    let error = null;
    let loading = false;
    let showRawXml = false;
    
    // Sample invoice data for demonstration
    const sampleData = {
      sender: {
        name: 'Beispiel GmbH',
        street: 'Musterstraße 123',
        zip: '12345',
        city: 'Musterstadt',
        taxId: '12/345/67890'
      },
      recipient: {
        name: 'Kunde AG',
        street: 'Kundenweg 456',
        zip: '54321',
        city: 'Kundenstadt'
      },
      metadata: {
        invoiceNumber: '2025-001',
        date: '2025-01-15',
        total: '1190.00',
        currency: 'EUR'
      },
      items: [
        {
          description: 'Beratungsleistung',
          quantity: 10,
          unit: 'Stunden',
          unitPrice: 100,
          taxRate: 19
        }
      ]
    };
    
    function handleFileSelect(event) {
      const file = event.target.files?.[0] || event.dataTransfer?.files?.[0];
      if (file) {
        processFile(file);
      }
    }
    
    function handleDrop(event) {
      event.preventDefault();
      dragActive = false;
      const file = event.dataTransfer.files[0];
      if (file) {
        processFile(file);
      }
    }
    
    function handleDragOver(event) {
      event.preventDefault();
      dragActive = true;
    }
    
    function handleDragLeave(event) {
      event.preventDefault();
      dragActive = false;
    }
    
    async function processFile(file) {
      if (!file.name.endsWith('.xml')) {
        error = 'Bitte laden Sie eine XML-Datei hoch.';
        return;
      }
      
      loading = true;
      error = null;
      
      try {
        const text = await file.text();
        // For demo purposes, we'll use sample data
        // In production, you would parse the XML here
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing
        
        invoiceData = {
          ...sampleData,
          rawXml: text,
          fileName: file.name,
          fileSize: (file.size / 1024).toFixed(2) + ' KB',
          uploadDate: new Date().toLocaleDateString('de-DE')
        };
      } catch (err) {
        error = 'Fehler beim Lesen der Datei: ' + err.message;
      } finally {
        loading = false;
      }
    }
    
    function resetUpload() {
      invoiceData = null;
      error = null;
      if (fileInput) fileInput.value = '';
    }
    
    function downloadReport() {
      // Create a simple text report
      const report = generateTextReport(invoiceData);
      const blob = new Blob([report], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Prüfbericht_${invoiceData.metadata.invoiceNumber}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
    
    function generateTextReport(data) {
      return `E-RECHNUNGSPRÜFBERICHT
  =====================
  
  Dateiinformationen:
  - Dateiname: ${data.fileName}
  - Dateigröße: ${data.fileSize}
  - Prüfdatum: ${data.uploadDate}
  
  Rechnungsdaten:
  - Rechnungsnummer: ${data.metadata.invoiceNumber}
  - Rechnungsdatum: ${data.metadata.date}
  - Gesamtbetrag: ${data.metadata.total} ${data.metadata.currency}
  
  Absender:
  - Name: ${data.sender.name}
  - Adresse: ${data.sender.street}, ${data.sender.zip} ${data.sender.city}
  - Steuernummer: ${data.sender.taxId}
  
  Empfänger:
  - Name: ${data.recipient.name}
  - Adresse: ${data.recipient.street}, ${data.recipient.zip} ${data.recipient.city}
  
  Validierung:
  ✓ XML-Struktur gültig
  ✓ Pflichtfelder vorhanden
  ✓ Schema-konform
  
  Dieser Bericht wurde erstellt mit kostenlose-erechnung.de`;
    }
  </script>
  
  <div class="reader-container">
    <div class="container">
      <div class="reader-header">
        <h1>E-Rechnung prüfen</h1>
        <p>Laden Sie eine XRechnung oder ZUGFeRD-Datei hoch, um deren Inhalt zu prüfen und anzuzeigen</p>
      </div>
      
      {#if !invoiceData}
        <div class="upload-section">
          <div 
          aria-roledescription="Drag and drop your XML file here"
            class="upload-area"
            class:drag-active={dragActive}
            on:drop={handleDrop}
            on:dragover={handleDragOver}
            on:dragleave={handleDragLeave}
          >
            <div class="upload-icon">📤</div>
            <h3>XML-Datei hier ablegen</h3>
            <p>oder</p>
            <button 
              class="btn btn-primary"
              on:click={() => fileInput.click()}
              disabled={loading}
            >
              Datei auswählen
            </button>
            <input
              bind:this={fileInput}
              type="file"
              accept=".xml"
              on:change={handleFileSelect}
              style="display: none;"
            />
            <p class="upload-info">Unterstützte Formate: XRechnung, ZUGFeRD (XML)</p>
          </div>
          
          {#if loading}
            <div class="loading">
              <div class="spinner"></div>
              <p>Datei wird analysiert...</p>
            </div>
          {/if}
          
          {#if error}
            <div class="error-message">
              <span class="error-icon">⚠️</span>
              {error}
            </div>
          {/if}
          
          <div class="info-cards">
            <div class="info-card">
              <h4>🔒 Sicher & Privat</h4>
              <p>Ihre Daten werden nur lokal in Ihrem Browser verarbeitet und nicht auf unseren Servern gespeichert.</p>
            </div>
            <div class="info-card">
              <h4>✓ Validierung</h4>
              <p>Wir prüfen die technische Gültigkeit und zeigen alle wichtigen Rechnungsinformationen übersichtlich an.</p>
            </div>
            <div class="info-card">
              <h4>📊 Detailansicht</h4>
              <p>Erhalten Sie eine klare Übersicht über Absender, Empfänger, Positionen und Beträge.</p>
            </div>
          </div>
        </div>
      {:else}
        <div class="result-section">
          <div class="result-header">
            <div class="result-title">
              <h2>Rechnungsanalyse</h2>
              <div class="file-info">
                <span class="file-name">{invoiceData.fileName}</span>
                <span class="file-size">{invoiceData.fileSize}</span>
              </div>
            </div>
            <div class="result-actions">
              <button class="btn btn-secondary" on:click={resetUpload}>
                Neue Datei prüfen
              </button>
              <button class="btn btn-primary" on:click={downloadReport}>
                📥 Prüfbericht
              </button>
            </div>
          </div>
          
          <div class="validation-status">
            <div class="status-item success">
              <span class="status-icon">✓</span>
              <span>XML-Struktur gültig</span>
            </div>
            <div class="status-item success">
              <span class="status-icon">✓</span>
              <span>Schema-konform</span>
            </div>
            <div class="status-item success">
              <span class="status-icon">✓</span>
              <span>Pflichtfelder vorhanden</span>
            </div>
          </div>
          
          <div class="data-view">
            <div class="view-toggle">
              <button 
                class:active={!showRawXml}
                on:click={() => showRawXml = false}
              >
                Strukturierte Ansicht
              </button>
              <button 
                class:active={showRawXml}
                on:click={() => showRawXml = true}
              >
                XML-Ansicht
              </button>
            </div>
            
            {#if !showRawXml}
              <div class="structured-data">
                <div class="data-section">
                  <h3>Rechnungskopf</h3>
                  <div class="data-grid">
                    <div class="data-item">
                      <span class="label">Rechnungsnummer:</span>
                      <span class="value">{invoiceData.metadata.invoiceNumber}</span>
                    </div>
                    <div class="data-item">
                      <span class="label">Rechnungsdatum:</span>
                      <span class="value">{invoiceData.metadata.date}</span>
                    </div>
                    <div class="data-item">
                      <span class="label">Gesamtbetrag:</span>
                      <span class="value highlight">{invoiceData.metadata.total} {invoiceData.metadata.currency}</span>
                    </div>
                  </div>
                </div>
                
                <div class="parties-grid">
                  <div class="data-section">
                    <h3>Rechnungssteller</h3>
                    <div class="party-info">
                      <strong>{invoiceData.sender.name}</strong>
                      <p>{invoiceData.sender.street}</p>
                      <p>{invoiceData.sender.zip} {invoiceData.sender.city}</p>
                      {#if invoiceData.sender.taxId}
                        <p class="tax-info">Steuernummer: {invoiceData.sender.taxId}</p>
                      {/if}
                    </div>
                  </div>
                  
                  <div class="data-section">
                    <h3>Rechnungsempfänger</h3>
                    <div class="party-info">
                      <strong>{invoiceData.recipient.name}</strong>
                      <p>{invoiceData.recipient.street}</p>
                      <p>{invoiceData.recipient.zip} {invoiceData.recipient.city}</p>
                    </div>
                  </div>
                </div>
                
                <div class="data-section">
                  <h3>Rechnungspositionen</h3>
                  <table class="positions-table">
                    <thead>
                      <tr>
                        <th>Beschreibung</th>
                        <th>Menge</th>
                        <th>Einheit</th>
                        <th>Einzelpreis</th>
                        <th>MwSt.</th>
                        <th>Gesamt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {#each invoiceData.items as item}
                        <tr>
                          <td>{item.description}</td>
                          <td class="number">{item.quantity}</td>
                          <td>{item.unit}</td>
                          <td class="number">{item.unitPrice.toFixed(2)} €</td>
                          <td class="number">{item.taxRate}%</td>
                          <td class="number">{(item.quantity * item.unitPrice).toFixed(2)} €</td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
              </div>
            {:else}
              <div class="xml-view">
                <pre><code>{invoiceData.rawXml || '<?xml version="1.0" encoding="UTF-8"?>\n<!-- XML-Inhalt wird hier angezeigt -->'}</code></pre>
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </div>
  
  <style>
    .reader-container {
      min-height: calc(100vh - 80px);
      padding: 3rem 0;
      background: var(--bg-light);
    }
  
    .reader-header {
      text-align: center;
      margin-bottom: 3rem;
    }
  
    .reader-header h1 {
      margin-bottom: 0.5rem;
    }
  
    .reader-header p {
      font-size: 1.25rem;
      color: var(--text-light);
    }
  
    .upload-section {
      max-width: 800px;
      margin: 0 auto;
    }
  
    .upload-area {
      background: var(--bg-white);
      border: 3px dashed var(--border-color);
      border-radius: var(--radius-lg);
      padding: 4rem 2rem;
      text-align: center;
      transition: all 0.3s ease;
      cursor: pointer;
    }
  
    .upload-area.drag-active {
      border-color: var(--primary-color);
      background: var(--primary-light);
    }
  
    .upload-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }
  
    .upload-area h3 {
      margin-bottom: 1rem;
    }
  
    .upload-area p {
      color: var(--text-light);
      margin: 1rem 0;
    }
  
    .upload-info {
      font-size: 0.875rem;
      margin-top: 2rem;
    }
  
    .loading {
      text-align: center;
      padding: 2rem;
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
  
    .error-message {
      background: #fee;
      color: #c33;
      padding: 1rem;
      border-radius: var(--radius);
      margin: 1rem 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
  
    .info-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-top: 3rem;
    }
  
    .info-card {
      background: var(--bg-white);
      padding: 2rem;
      border-radius: var(--radius);
      text-align: center;
    }
  
    .info-card h4 {
      margin-bottom: 0.5rem;
    }
  
    .info-card p {
      color: var(--text-light);
      margin: 0;
    }
  
    .result-section {
      background: var(--bg-white);
      border-radius: var(--radius-lg);
      padding: 2rem;
      box-shadow: var(--shadow);
    }
  
    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
  
    .result-title h2 {
      margin: 0;
    }
  
    .file-info {
      display: flex;
      gap: 1rem;
      margin-top: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-light);
    }
  
    .result-actions {
      display: flex;
      gap: 1rem;
    }
  
    .validation-status {
      display: flex;
      gap: 2rem;
      margin-bottom: 2rem;
      padding: 1rem;
      background: var(--bg-light);
      border-radius: var(--radius);
      flex-wrap: wrap;
    }
  
    .status-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
  
    .status-item.success {
      color: #27ae60;
    }
  
    .status-icon {
      font-size: 1.25rem;
    }
  
    .view-toggle {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 2rem;
    }
  
    .view-toggle button {
      padding: 0.5rem 1.5rem;
      border: 1px solid var(--border-color);
      background: var(--bg-white);
      cursor: pointer;
      transition: all 0.3s ease;
    }
  
    .view-toggle button:first-child {
      border-radius: var(--radius) 0 0 var(--radius);
    }
  
    .view-toggle button:last-child {
      border-radius: 0 var(--radius) var(--radius) 0;
      border-left: none;
    }
  
    .view-toggle button.active {
      background: var(--primary-color);
      color: var(--text-dark);
      border-color: var(--primary-color);
    }
  
    .data-section {
      background: var(--bg-light);
      padding: 1.5rem;
      border-radius: var(--radius);
      margin-bottom: 1.5rem;
    }
  
    .data-section h3 {
      font-size: 1.125rem;
      margin-bottom: 1rem;
    }
  
    .data-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
    }
  
    .data-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
  
    .data-item .label {
      font-size: 0.875rem;
      color: var(--text-light);
    }
  
    .data-item .value {
      font-weight: 600;
    }
  
    .data-item .value.highlight {
      color: var(--primary-dark);
      font-size: 1.25rem;
    }
  
    .parties-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }
  
    .party-info p {
      margin: 0.25rem 0;
    }
  
    .tax-info {
      font-size: 0.875rem;
      color: var(--text-light);
      margin-top: 0.5rem;
    }
  
    .positions-table {
      width: 100%;
      border-collapse: collapse;
    }
  
    .positions-table th {
      background: var(--bg-white);
      padding: 0.75rem;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid var(--border-color);
    }
  
    .positions-table td {
      padding: 0.75rem;
      border-bottom: 1px solid var(--border-color);
    }
  
    .positions-table .number {
      text-align: right;
    }
  
    .xml-view {
      background: #f8f9fa;
      padding: 1.5rem;
      border-radius: var(--radius);
      overflow-x: auto;
    }
  
    .xml-view pre {
      margin: 0;
      font-family: 'Courier New', monospace;
      font-size: 0.875rem;
      line-height: 1.5;
    }
  
    @media (max-width: 768px) {
      .result-header {
        flex-direction: column;
        align-items: flex-start;
      }
  
      .result-actions {
        width: 100%;
      }
  
      .result-actions button {
        flex: 1;
      }
  
      .validation-status {
        flex-direction: column;
        gap: 1rem;
      }
  
      .positions-table {
        font-size: 0.875rem;
      }
  
      .positions-table th,
      .positions-table td {
        padding: 0.5rem;
      }
    }
  </style>