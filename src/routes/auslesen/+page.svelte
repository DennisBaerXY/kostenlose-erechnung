<script>
  import { parseInvoiceXml } from '$lib/utils/xml-parser.js';
  import { onMount } from 'svelte';

  let fileInput;
  let dragActive = false;
  let invoiceData = null;
  let error = null;
  let loading = false;
  let showRawXml = false;

  async function processFile(file) {
      if (!file || !file.name.toLowerCase().endsWith('.xml')) {
          error = 'Fehler: Bitte eine gültige XML-Datei hochladen.';
          return;
      }

      loading = true;
      error = null;
      invoiceData = null;

      try {
          const xmlString = await file.text();
          const parsedData = await parseInvoiceXml(xmlString);
          
          invoiceData = {
              ...parsedData,
              fileName: file.name,
              fileSize: (file.size / 1024).toFixed(2) + ' KB',
              uploadDate: new Date()
          };

      } catch (err) {
          error = err.message;
          console.error(err);
      } finally {
          loading = false;
      }
  }

  function handleFileSelect(event) {
      const file = event.target.files?.[0];
      processFile(file);
  }
  
  function handleDrop(event) {
      event.preventDefault();
      dragActive = false;
      const file = event.dataTransfer.files[0];
      processFile(file);
  }

  function reset() {
      invoiceData = null;
      error = null;
      if (fileInput) fileInput.value = '';
  }

  function formatCurrency(amount, currency = "EUR") {
      return new Intl.NumberFormat("de-DE", {
          style: "currency",
          currency: currency
      }).format(amount || 0);
  }

  function formatDate(date) {
      if (!date) return 'N/A';
      return new Date(date).toLocaleDateString('de-DE', {
          day: '2-digit', month: '2-digit', year: 'numeric'
      });
  }

</script>

<svelte:head>
  <title>E-Rechnung online prüfen | XRechnung & ZUGFeRD Viewer</title>
  <meta name="description" content="Kostenloses Online-Tool zur Validierung und Anzeige von elektronischen Rechnungen im XRechnung- und ZUGFeRD-XML-Format. Sicher, privat und direkt im Browser." />
</svelte:head>

<div class="container">
  <header class="page-header">
      <h1>E-Rechnungs-Prüfer</h1>
      <p>Laden Sie eine XRechnung oder ZUGFeRD XML-Datei hoch, um sie zu validieren und anzuzeigen.</p>
  </header>

  {#if !invoiceData}
      <section id="upload-section">
          <div
              class="drop-zone"
              class:drag-active={dragActive}
              on:dragenter={() => dragActive = true}
              on:dragleave={() => dragActive = false}
              on:dragover|preventDefault
              on:drop|preventDefault={handleDrop}
              on:click={() => fileInput.click()}
              role="button"
              tabindex="0"
          >
              <div class="icon">📤</div>
              <h3>Datei hier ablegen oder klicken</h3>
              <p>Unterstützte Formate: .xml (XRechnung, ZUGFeRD)</p>
              <input
                  bind:this={fileInput}
                  type="file"
                  accept=".xml"
                  on:change={handleFileSelect}
                  hidden
              />
          </div>

          {#if loading}
              <div class="status-box loading">
                  <div class="spinner"></div>
                  <span>Analysiere Datei...</span>
              </div>
          {/if}

          {#if error}
              <div class="status-box error">
                  <span>⚠️</span>
                  <p>{error}</p>
              </div>
          {/if}

          <div class="info-grid">
              <div class="info-card">
                  <h4>🔒 Sicher & Privat</h4>
                  <p>Ihre Daten werden nur lokal in Ihrem Browser verarbeitet. Nichts wird hochgeladen.</p>
              </div>
              <div class="info-card">
                  <h4>✓ Umfassende Prüfung</h4>
                  <p>Technische Gültigkeit und alle wichtigen Rechnungsinformationen übersichtlich dargestellt.</p>
              </div>
              <div class="info-card">
                  <h4>📊 Alle Standards</h4>
                  <p>Unterstützt ZUGFeRD (alle Profile) und XRechnung (UBL & CII Syntax).</p>
              </div>
          </div>
      </section>
  {:else}
      <section id="result-section">
          <header class="result-header">
              <div>
                  <h2>Rechnungsdetails</h2>
                  <span class="profile-badge">{invoiceData.profile} ({invoiceData.syntax})</span>
              </div>
              <div class="actions">
                  <button class="btn-secondary" on:click={() => showRawXml = !showRawXml}>
                      {showRawXml ? 'Strukturierte Ansicht' : 'XML anzeigen'}
                  </button>
                  <button class="btn-primary" on:click={reset}>Neue Prüfung</button>
              </div>
          </header>

          {#if showRawXml}
              <div class="xml-view">
                  <pre><code>{invoiceData.rawXml}</code></pre>
              </div>
          {:else}
              <div class="invoice-details">
                  <div class="card">
                      <h3>Übersicht</h3>
                      <div class="grid-3">
                          <div><label>Rechnungsnummer</label><strong>{invoiceData.metadata.invoiceNumber}</strong></div>
                          <div><label>Rechnungsdatum</label><strong>{formatDate(invoiceData.metadata.date)}</strong></div>
                          <div><label>Fälligkeitsdatum</label><strong>{formatDate(invoiceData.metadata.dueDate)}</strong></div>
                      </div>
                  </div>

                  <div class="grid-2">
                      <div class="card">
                          <h3>Rechnungssteller</h3>
                          <p><strong>{invoiceData.sender.name}</strong></p>
                          <p>{invoiceData.sender.street}</p>
                          <p>{invoiceData.sender.zip} {invoiceData.sender.city}</p>
                          <p>{invoiceData.sender.country}</p>
                          {#if invoiceData.sender.ustId}<p><small>USt-IdNr.: {invoiceData.sender.ustId}</small></p>{/if}
                      </div>
                      <div class="card">
                          <h3>Rechnungsempfänger</h3>
                          <p><strong>{invoiceData.recipient.name}</strong></p>
                          <p>{invoiceData.recipient.street}</p>
                          <p>{invoiceData.recipient.zip} {invoiceData.recipient.city}</p>
                          <p>{invoiceData.recipient.country}</p>
                           {#if invoiceData.recipient.contact?.name}<p><small>z.H. {invoiceData.recipient.contact.name}</small></p>{/if}
                      </div>
                  </div>

                  <div class="card">
                      <h3>Positionen</h3>
                      <table class="items-table">
                          <thead>
                              <tr>
                                  <th>#</th>
                                  <th>Beschreibung</th>
                                  <th class="text-right">Menge</th>
                                  <th class="text-right">Einzelpreis</th>
                                  <th class="text-right">MwSt.</th>
                                  <th class="text-right">Gesamt (Netto)</th>
                              </tr>
                          </thead>
                          <tbody>
                              {#each invoiceData.items as item, i}
                                  <tr>
                                      <td>{item.id || i + 1}</td>
                                      <td>{item.description}</td>
                                      <td class="text-right">{item.quantity} {item.unit}</td>
                                      <td class="text-right">{formatCurrency(item.unitPrice, invoiceData.metadata.currency)}</td>
                                      <td class="text-right">{item.taxRate}%</td>
                                      <td class="text-right">{formatCurrency(item.lineTotal, invoiceData.metadata.currency)}</td>
                                  </tr>
                              {/each}
                          </tbody>
                      </table>
                  </div>

                  <div class="card totals-card">
                      <h3>Gesamtbeträge</h3>
                      <div class="totals-grid">
                          <div><label>Nettobetrag</label><span>{formatCurrency(invoiceData.totals.netTotal, invoiceData.metadata.currency)}</span></div>
                          <div><label>Umsatzsteuer</label><span>{formatCurrency(invoiceData.totals.taxTotal, invoiceData.metadata.currency)}</span></div>
                          <div class="highlight"><label>Bruttobetrag</label><span>{formatCurrency(invoiceData.totals.grossTotal, invoiceData.metadata.currency)}</span></div>
                          <div class="highlight payable"><label>Zahlbetrag</label><span>{formatCurrency(invoiceData.totals.payableAmount, invoiceData.metadata.currency)}</span></div>
                      </div>
                  </div>
              </div>
          {/if}
      </section>
  {/if}
</div>

<style>

  .container { max-width: 1000px; margin: 0 auto; padding: 2rem; }
  .page-header { text-align: center; margin-bottom: 2rem; }
  .page-header h1 { font-size: 2.5rem; color: var(--text-dark); }
  .page-header p { font-size: 1.2rem; color: var(--text-light); }
  
  /* Upload Section */
  .drop-zone { border: 2px dashed var(--border-color); border-radius: var(--radius); padding: 3rem; text-align: center; transition: all 0.2s ease; cursor: pointer; background: var(--bg-white); }
  .drop-zone:hover, .drop-zone.drag-active { border-color: var(--primary-color); background: #e9f5ff; }
  .drop-zone .icon { font-size: 3rem; }

  .status-box { margin-top: 1.5rem; padding: 1rem; border-radius: var(--radius); display: flex; align-items: center; gap: 1rem; }
  .status-box.loading { background-color: #e9f5ff; color: #004085; }
  .status-box.error { background-color: #f8d7da; color: #721c24; }
  .spinner { width: 24px; height: 24px; border: 3px solid currentColor; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-top: 3rem; }
  .info-card { background: var(--bg-white); padding: 1.5rem; border-radius: var(--radius); text-align: center; border: 1px solid var(--border-color); }

  /* Result Section */
  .result-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
  .result-header h2 { margin: 0; }
  .profile-badge { background-color: #e2e3e5; color: #343a40; padding: 0.3rem 0.6rem; font-size: 0.8rem; border-radius: var(--radius); font-weight: 600; }
  .actions { display: flex; gap: 1rem; }
  .btn-primary, .btn-secondary { padding: 0.6rem 1.2rem; border: 1px solid; border-radius: var(--radius); font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
  .btn-primary { background-color: var(--primary-color); color: white; border-color: var(--primary-color); }
 
  .btn-secondary { background-color: var(--bg-white); color: var(--text-dark); border-color: var(--border-color); }
  .btn-secondary:hover { background-color: var(--bg-light); }

  .xml-view { background: #282c34; color: #abb2bf; padding: 1.5rem; border-radius: var(--radius); overflow-x: auto; }
  .xml-view pre { margin: 0; font-size: 0.9rem; }
  
  .invoice-details { display: flex; flex-direction: column; gap: 1.5rem; }
  .card { background: var(--bg-white); border: 1px solid var(--border-color); border-radius: var(--radius); padding: 1.5rem; }
  .card h3 { margin-top: 0; margin-bottom: 1rem; font-size: 1.2rem; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.5rem; }

  .grid-2 > .card, .grid-3 > .card { width: 100%; }
  .card label { display: block; font-size: 0.9rem; color: var(--text-light); margin-bottom: 0.25rem; }
  .card strong { font-size: 1rem; color: var(--text-dark); }
  .card p { margin: 0 0 0.5rem; }
  
  .items-table { width: 100%; border-collapse: collapse; }
  .items-table th, .items-table td { padding: 0.75rem; border-bottom: 1px solid var(--border-color); text-align: left; }
  .items-table thead { background-color: var(--bg-light); }
  .text-right { text-align: right; }

  .totals-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem 2rem; }
  .totals-grid div { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color); }
  .totals-grid div.highlight { font-size: 1.1rem; font-weight: bold; }
  .totals-grid div.payable { font-size: 1.3rem; color: var(--primary-color); }
  .totals-grid div:last-child { border-bottom: none; }
  .totals-grid label { color: var(--text-light); }
  
  @media (max-width: 768px) {
      .grid-2, .grid-3 { grid-template-columns: 1fr; }
      .result-header { flex-direction: column; align-items: flex-start; }
  }
</style>