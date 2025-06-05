<script>
    import { invoiceData, currentStep } from '$lib/stores/invoice.js';
    import InvoicePreview from '$lib/components/InvoicePreview.svelte';
    import XmlViewer from '$lib/components/XmlViewer.svelte';
    
    let showXml = false;
    
    const steps = [
      { id: 1, name: 'Kontaktinformationen', icon: '👤' },
      { id: 2, name: 'Empfänger', icon: '📮' },
      { id: 3, name: 'Rechnungsdetails', icon: '📄' },
      { id: 4, name: 'Positionen', icon: '📋' },
      { id: 5, name: 'Abschluss', icon: '✓' }
    ];
    
    $: totalSteps = steps.length;
    
    function nextStep() {
      if ($currentStep < totalSteps) {
        $currentStep += 1;
      }
    }
    
    function prevStep() {
      if ($currentStep > 1) {
        $currentStep -= 1;
      }
    }
    
    function goToStep(step) {
      $currentStep = step;
    }
    
    // Form handlers
    function updateSender(field, value) {
      $invoiceData.sender[field] = value;
    }
    
    function updateRecipient(field, value) {
      $invoiceData.recipient[field] = value;
    }
    
    function updateMetadata(field, value) {
      $invoiceData.metadata[field] = value;
    }
    
    function addItem() {
      $invoiceData.items = [...$invoiceData.items, {
        description: '',
        quantity: 1,
        unit: 'Stück',
        unitPrice: 0,
        taxRate: 19
      }];
    }
    
    function removeItem(index) {
      $invoiceData.items = $invoiceData.items.filter((_, i) => i !== index);
    }
    
    function updateItem(index, field, value) {
      $invoiceData.items[index][field] = value;
      $invoiceData.items = $invoiceData.items;
    }
    
    $: subtotal = $invoiceData.items.reduce((sum, item) => 
      sum + (item.quantity * item.unitPrice), 0
    );
    
    $: taxAmount = $invoiceData.items.reduce((sum, item) => 
      sum + (item.quantity * item.unitPrice * item.taxRate / 100), 0
    );
    
    $: total = subtotal + taxAmount;
  </script>
  
  <div class="creator-container">
    <div class="wizard-section">
      <div class="wizard-header">
        <h1>E-Rechnung erstellen</h1>
        <div class="steps-indicator">
          {#each steps as step}
            <button 
              class="step-item" 
              class:active={$currentStep === step.id}
              class:completed={$currentStep > step.id}
              on:click={() => goToStep(step.id)}
              disabled={step.id > $currentStep}
            >
              <span class="step-icon">{step.icon}</span>
              <span class="step-name">{step.name}</span>
            </button>
          {/each}
        </div>
      </div>
      
      <div class="wizard-content">
        {#if $currentStep === 1}
          <div class="form-section">
            <h2>Ihre Angaben</h2>
            <p class="form-description">Geben Sie Ihre Kontaktinformationen ein</p>
            
            <div class="form-grid">
              <div class="form-group full">
                <label for="sender-name">Firmenname</label>
                <input 
                  id="sender-name"
                  type="text" 
                  value={$invoiceData.sender.name}
                  on:input={(e) => updateSender('name', e.target.value)}
                  placeholder="Mustermann GmbH"
                />
              </div>
              
              <div class="form-group">
                <label for="sender-street">Straße und Hausnummer</label>
                <input 
                  id="sender-street"
                  type="text" 
                  value={$invoiceData.sender.street}
                  on:input={(e) => updateSender('street', e.target.value)}
                  placeholder="Musterstraße 123"
                />
              </div>
              
              <div class="form-group half">
                <label for="sender-zip">Postleitzahl</label>
                <input 
                  id="sender-zip"
                  type="text" 
                  value={$invoiceData.sender.zip}
                  on:input={(e) => updateSender('zip', e.target.value)}
                  placeholder="12345"
                />
              </div>
              
              <div class="form-group half">
                <label for="sender-city">Ort</label>
                <input 
                  id="sender-city"
                  type="text" 
                  value={$invoiceData.sender.city}
                  on:input={(e) => updateSender('city', e.target.value)}
                  placeholder="Musterstadt"
                />
              </div>
              
              <div class="form-group">
                <label for="sender-email">E-Mail-Adresse</label>
                <input 
                  id="sender-email"
                  type="email" 
                  value={$invoiceData.sender.email}
                  on:input={(e) => updateSender('email', e.target.value)}
                  placeholder="info@mustermann.de"
                />
              </div>
              
              <div class="form-group">
                <label for="sender-phone">Telefonnummer</label>
                <input 
                  id="sender-phone"
                  type="tel" 
                  value={$invoiceData.sender.phone}
                  on:input={(e) => updateSender('phone', e.target.value)}
                  placeholder="+49 123 456789"
                />
              </div>
              
              <div class="form-group">
                <label for="sender-taxid">Steuernummer</label>
                <input 
                  id="sender-taxid"
                  type="text" 
                  value={$invoiceData.sender.taxId}
                  on:input={(e) => updateSender('taxId', e.target.value)}
                  placeholder="12/345/67890"
                />
              </div>
              
              <div class="form-group">
                <label for="sender-ustid">USt-IdNr. (optional)</label>
                <input 
                  id="sender-ustid"
                  type="text" 
                  value={$invoiceData.sender.ustId}
                  on:input={(e) => updateSender('ustId', e.target.value)}
                  placeholder="DE123456789"
                />
              </div>
            </div>
          </div>
        {/if}
        
        {#if $currentStep === 2}
          <div class="form-section">
            <h2>Empfänger</h2>
            <p class="form-description">Kontaktinformationen des Rechnungsempfängers</p>
            
            <div class="form-grid">
              <div class="form-group full">
                <label for="recipient-name">Firmenname / Name</label>
                <input 
                  id="recipient-name"
                  type="text" 
                  value={$invoiceData.recipient.name}
                  on:input={(e) => updateRecipient('name', e.target.value)}
                  placeholder="Kunde GmbH"
                />
              </div>
              
              <div class="form-group">
                <label for="recipient-street">Straße und Hausnummer</label>
                <input 
                  id="recipient-street"
                  type="text" 
                  value={$invoiceData.recipient.street}
                  on:input={(e) => updateRecipient('street', e.target.value)}
                  placeholder="Kundenstraße 456"
                />
              </div>
              
              <div class="form-group half">
                <label for="recipient-zip">Postleitzahl</label>
                <input 
                  id="recipient-zip"
                  type="text" 
                  value={$invoiceData.recipient.zip}
                  on:input={(e) => updateRecipient('zip', e.target.value)}
                  placeholder="54321"
                />
              </div>
              
              <div class="form-group half">
                <label for="recipient-city">Ort</label>
                <input 
                  id="recipient-city"
                  type="text" 
                  value={$invoiceData.recipient.city}
                  on:input={(e) => updateRecipient('city', e.target.value)}
                  placeholder="Kundenstadt"
                />
              </div>
              
              <div class="form-group">
                <label for="recipient-email">E-Mail-Adresse</label>
                <input 
                  id="recipient-email"
                  type="email" 
                  value={$invoiceData.recipient.email}
                  on:input={(e) => updateRecipient('email', e.target.value)}
                  placeholder="kontakt@kunde.de"
                />
              </div>
              
              <div class="form-group">
                <label for="recipient-reference">Ihre Referenz (optional)</label>
                <input 
                  id="recipient-reference"
                  type="text" 
                  value={$invoiceData.recipient.reference}
                  on:input={(e) => updateRecipient('reference', e.target.value)}
                  placeholder="Bestellnummer, Projektnummer, etc."
                />
              </div>
            </div>
          </div>
        {/if}
        
        {#if $currentStep === 3}
          <div class="form-section">
            <h2>Rechnungsdetails</h2>
            <p class="form-description">Allgemeine Informationen zur Rechnung</p>
            
            <div class="form-grid">
              <div class="form-group">
                <label for="invoice-number">Rechnungsnummer</label>
                <input 
                  id="invoice-number"
                  type="text" 
                  value={$invoiceData.metadata.invoiceNumber}
                  on:input={(e) => updateMetadata('invoiceNumber', e.target.value)}
                  placeholder="2025-001"
                />
              </div>
              
              <div class="form-group">
                <label for="invoice-date">Rechnungsdatum</label>
                <input 
                  id="invoice-date"
                  type="date" 
                  value={$invoiceData.metadata.date}
                  on:input={(e) => updateMetadata('date', e.target.value)}
                />
              </div>
              
              <div class="form-group">
                <label for="delivery-date">Lieferdatum</label>
                <input 
                  id="delivery-date"
                  type="date" 
                  value={$invoiceData.metadata.deliveryDate}
                  on:input={(e) => updateMetadata('deliveryDate', e.target.value)}
                />
              </div>
              
              <div class="form-group">
                <label for="due-date">Zahlungsziel</label>
                <input 
                  id="due-date"
                  type="date" 
                  value={$invoiceData.metadata.dueDate}
                  on:input={(e) => updateMetadata('dueDate', e.target.value)}
                />
              </div>
              
              <div class="form-group full">
                <label for="payment-terms">Zahlungsbedingungen</label>
                <select 
                  id="payment-terms"
                  value={$invoiceData.metadata.paymentTerms}
                  on:change={(e) => updateMetadata('paymentTerms', e.target.value)}
                >
                  <option value="net14">Zahlbar innerhalb 14 Tagen</option>
                  <option value="net30">Zahlbar innerhalb 30 Tagen</option>
                  <option value="immediate">Zahlbar sofort</option>
                  <option value="custom">Benutzerdefiniert</option>
                </select>
              </div>
              
              {#if $invoiceData.metadata.paymentTerms === 'custom'}
                <div class="form-group full">
                  <label for="custom-terms">Benutzerdefinierte Zahlungsbedingungen</label>
                  <textarea
                    id="custom-terms"
                    value={$invoiceData.metadata.customPaymentTerms}
                    on:input={(e) => updateMetadata('customPaymentTerms', e.target.value)}
                    placeholder="Geben Sie Ihre Zahlungsbedingungen ein..."
                    rows="3"
                  ></textarea>
                </div>
              {/if}
            </div>
          </div>
        {/if}
        
        {#if $currentStep === 4}
          <div class="form-section">
            <h2>Rechnungspositionen</h2>
            <p class="form-description">Fügen Sie die einzelnen Leistungen oder Produkte hinzu</p>
            
            <div class="items-list">
              {#each $invoiceData.items as item, index}
                <div class="item-row">
                  <div class="item-header">
                    <h4>Position {index + 1}</h4>
                    <button 
                      class="btn-remove" 
                      on:click={() => removeItem(index)}
                      aria-label="Position entfernen"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div class="item-grid">
                    <div class="form-group full">
                      <label>Beschreibung</label>
                      <input 
                        type="text" 
                        value={item.description}
                        on:input={(e) => updateItem(index, 'description', e.target.value)}
                        placeholder="Beratung, Website-Entwicklung, etc."
                      />
                    </div>
                    
                    <div class="form-group">
                      <label>Menge</label>
                      <input 
                        type="number" 
                        value={item.quantity}
                        on:input={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    
                    <div class="form-group">
                      <label>Einheit</label>
                      <select 
                        value={item.unit}
                        on:change={(e) => updateItem(index, 'unit', e.target.value)}
                      >
                        <option value="Stück">Stück</option>
                        <option value="Stunden">Stunden</option>
                        <option value="Tage">Tage</option>
                        <option value="Pauschal">Pauschal</option>
                        <option value="km">km</option>
                        <option value="kg">kg</option>
                        <option value="m²">m²</option>
                      </select>
                    </div>
                    
                    <div class="form-group">
                      <label>Einzelpreis (€)</label>
                      <input 
                        type="number" 
                        value={item.unitPrice}
                        on:input={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    
                    <div class="form-group">
                      <label>MwSt. (%)</label>
                      <select 
                        value={item.taxRate}
                        on:change={(e) => updateItem(index, 'taxRate', parseInt(e.target.value))}
                      >
                        <option value="0">0%</option>
                        <option value="7">7%</option>
                        <option value="19">19%</option>
                      </select>
                    </div>
                  </div>
                  
                  <div class="item-total">
                    Gesamt: {(item.quantity * item.unitPrice).toFixed(2)} €
                  </div>
                </div>
              {/each}
            </div>
            
            <button class="btn btn-secondary add-item" on:click={addItem}>
              + Position hinzufügen
            </button>
            
            <div class="totals">
              <div class="total-row">
                <span>Zwischensumme:</span>
                <span>{subtotal.toFixed(2)} €</span>
              </div>
              <div class="total-row">
                <span>MwSt.:</span>
                <span>{taxAmount.toFixed(2)} €</span>
              </div>
              <div class="total-row total">
                <span>Gesamtbetrag:</span>
                <span>{total.toFixed(2)} €</span>
              </div>
            </div>
          </div>
        {/if}
        
        {#if $currentStep === 5}
          <div class="form-section">
            <h2>Abschluss</h2>
            <p class="form-description">Überprüfen Sie Ihre Eingaben und laden Sie die Rechnung herunter</p>
            
            <div class="summary">
              <div class="summary-section">
                <h3>Rechnungsübersicht</h3>
                <div class="summary-grid">
                  <div class="summary-item">
                    <span class="label">Rechnungsnummer:</span>
                    <span class="value">{$invoiceData.metadata.invoiceNumber}</span>
                  </div>
                  <div class="summary-item">
                    <span class="label">Datum:</span>
                    <span class="value">{new Date($invoiceData.metadata.date).toLocaleDateString('de-DE')}</span>
                  </div>
                  <div class="summary-item">
                    <span class="label">Empfänger:</span>
                    <span class="value">{$invoiceData.recipient.name}</span>
                  </div>
                  <div class="summary-item">
                    <span class="label">Gesamtbetrag:</span>
                    <span class="value highlight">{total.toFixed(2)} €</span>
                  </div>
                </div>
              </div>
              
              <div class="download-section">
                <h3>Format wählen</h3>
                <div class="format-options">
                  <label class="format-option">
                    <input type="radio" name="format" value="xrechnung" checked />
                    <div class="format-content">
                      <span class="format-name">XRechnung</span>
                      <span class="format-desc">Standard für öffentliche Auftraggeber</span>
                    </div>
                  </label>
                  
                  <label class="format-option">
                    <input type="radio" name="format" value="zugferd" />
                    <div class="format-content">
                      <span class="format-name">ZUGFeRD</span>
                      <span class="format-desc">Hybrid-Format (PDF + XML)</span>
                    </div>
                  </label>
                </div>
                
                <button class="btn btn-primary btn-download">
                  📥 E-Rechnung herunterladen
                </button>
              </div>
            </div>
          </div>
        {/if}
      </div>
      
      <div class="wizard-footer">
        <button 
          class="btn btn-secondary" 
          on:click={prevStep}
          disabled={$currentStep === 1}
        >
          ← Zurück
        </button>
        
        {#if $currentStep < totalSteps}
          <button 
            class="btn btn-primary" 
            on:click={nextStep}
          >
            Weiter →
          </button>
        {/if}
      </div>
    </div>
    
    <div class="preview-section">
      <div class="preview-header">
        <h3>Vorschau</h3>
        <div class="preview-toggle">
          <button 
            class:active={!showXml} 
            on:click={() => showXml = false}
          >
            PDF
          </button>
          <button 
            class:active={showXml} 
            on:click={() => showXml = true}
          >
            XML
          </button>
        </div>
      </div>
      
      <div class="preview-content">
        {#if showXml}
          <XmlViewer data={$invoiceData} />
        {:else}
          <InvoicePreview data={$invoiceData} />
        {/if}
      </div>
    </div>
  </div>
  
  <style>
    .creator-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      min-height: calc(100vh - 80px);
    }
  
    .wizard-section {
      padding: 2rem;
      background: var(--bg-white);
      overflow-y: auto;
    }
  
    .wizard-header {
      margin-bottom: 2rem;
    }
  
    .wizard-header h1 {
      font-size: 2rem;
      margin-bottom: 1.5rem;
    }
  
    .steps-indicator {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }
  
    .step-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border: 2px solid var(--border-color);
      border-radius: var(--radius);
      background: var(--bg-white);
      cursor: pointer;
      transition: all 0.3s ease;
    }
  
    .step-item:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  
    .step-item.active {
      border-color: var(--primary-color);
      background: var(--primary-light);
    }
  
    .step-item.completed {
      border-color: var(--primary-color);
      background: var(--primary-color);
    }
  
    .step-icon {
      font-size: 1.25rem;
    }
  
    .step-name {
      font-weight: 500;
    }
  
    .form-section h2 {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }
  
    .form-description {
      color: var(--text-light);
      margin-bottom: 2rem;
    }
  
    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }
  
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
  
    .form-group.full {
      grid-column: 1 / -1;
    }
  
    .form-group.half {
      grid-column: span 1;
    }
  
    .form-group label {
      font-weight: 500;
      color: var(--text-dark);
    }
  
    .form-group input,
    .form-group select,
    .form-group textarea {
      padding: 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius);
      font-size: 1rem;
      transition: border-color 0.3s ease;
    }
  
    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: var(--primary-color);
    }
  
    .items-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }
  
    .item-row {
      background: var(--bg-light);
      padding: 1.5rem;
      border-radius: var(--radius);
    }
  
    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
  
    .item-header h4 {
      margin: 0;
    }
  
    .btn-remove {
      background: none;
      border: none;
      color: var(--text-light);
      cursor: pointer;
      font-size: 1.25rem;
      padding: 0.25rem;
      transition: color 0.3s ease;
    }
  
    .btn-remove:hover {
      color: #e74c3c;
    }
  
    .item-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
    }
  
    .item-total {
      text-align: right;
      font-weight: 600;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
    }
  
    .add-item {
      width: 100%;
      margin-bottom: 2rem;
    }
  
    .totals {
      background: var(--bg-light);
      padding: 1.5rem;
      border-radius: var(--radius);
    }
  
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
    }
  
    .total-row.total {
      font-size: 1.25rem;
      font-weight: 700;
      border-top: 2px solid var(--border-color);
      padding-top: 1rem;
      margin-top: 0.5rem;
    }
  
    .summary {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
  
    .summary-section {
      background: var(--bg-light);
      padding: 1.5rem;
      border-radius: var(--radius);
    }
  
    .summary-section h3 {
      font-size: 1.25rem;
      margin-bottom: 1rem;
    }
  
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }
  
    .summary-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
  
    .summary-item .label {
      font-size: 0.875rem;
      color: var(--text-light);
    }
  
    .summary-item .value {
      font-weight: 600;
    }
  
    .summary-item .value.highlight {
      color: var(--primary-dark);
      font-size: 1.25rem;
    }
  
    .download-section h3 {
      font-size: 1.25rem;
      margin-bottom: 1rem;
    }
  
    .format-options {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
  
    .format-option {
      flex: 1;
      cursor: pointer;
    }
  
    .format-option input {
      display: none;
    }
  
    .format-content {
      display: flex;
      flex-direction: column;
      padding: 1rem;
      border: 2px solid var(--border-color);
      border-radius: var(--radius);
      transition: all 0.3s ease;
    }
  
    .format-option input:checked + .format-content {
      border-color: var(--primary-color);
      background: var(--primary-light);
    }
  
    .format-name {
      font-weight: 600;
      margin-bottom: 0.25rem;
    }
  
    .format-desc {
      font-size: 0.875rem;
      color: var(--text-light);
    }
  
    .btn-download {
      width: 100%;
      font-size: 1.125rem;
      padding: 1rem;
    }
  
    .wizard-footer {
      display: flex;
      justify-content: space-between;
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid var(--border-color);
    }
  
    .preview-section {
      background: var(--bg-light);
      border-left: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
    }
  
    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 2rem;
      background: var(--bg-white);
      border-bottom: 1px solid var(--border-color);
    }
  
    .preview-header h3 {
      margin: 0;
    }
  
    .preview-toggle {
      display: flex;
      gap: 0.5rem;
    }
  
    .preview-toggle button {
      padding: 0.5rem 1rem;
      border: 1px solid var(--border-color);
      background: var(--bg-white);
      cursor: pointer;
      transition: all 0.3s ease;
    }
  
    .preview-toggle button:first-child {
      border-radius: var(--radius) 0 0 var(--radius);
    }
  
    .preview-toggle button:last-child {
      border-radius: 0 var(--radius) var(--radius) 0;
      border-left: none;
    }
  
    .preview-toggle button.active {
      background: var(--primary-color);
      color: var(--text-dark);
      border-color: var(--primary-color);
    }
  
    .preview-content {
      flex: 1;
      overflow-y: auto;
      padding: 2rem;
    }
  
    @media (max-width: 1200px) {
      .creator-container {
        grid-template-columns: 1fr 400px;
      }
    }
  
    @media (max-width: 968px) {
      .creator-container {
        grid-template-columns: 1fr;
      }
  
      .preview-section {
        display: none;
      }
  
      .form-grid {
        grid-template-columns: 1fr;
      }
  
      .form-group.half {
        grid-column: span 1;
      }
    }
  </style>