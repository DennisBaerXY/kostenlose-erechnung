<script>
    const currentYear = new Date().getFullYear();
  </script>
  
  <footer>
    <div class="container">
      <div class="footer-content">
        <div class="footer-section">
          <h4>kostenlose-erechnung.de</h4>
          <p>Die einfache Lösung für XRechnungen und ZUGFeRD-konforme E-Rechnungen. Kostenlos, schnell und direkt im Browser.</p>
          <div class="badges">
            <span class="badge">🔒 DSGVO konform</span>
            <span class="badge">🇩🇪 Server in Deutschland</span>
          </div>
        </div>
        
        <div class="footer-section">
          <h4>Funktionen</h4>
          <ul>
            <li><a href="/erstellen">E-Rechnung erstellen</a></li>
            <li><a href="/auslesen">E-Rechnung prüfen</a></li>
            <li><a href="#faq">Häufige Fragen</a></li>
            <li><a href="#anleitung">Anleitung</a></li>
          </ul>
        </div>
        
        <div class="footer-section">
          <h4>Rechtliches</h4>
          <ul>
            <li><a href="/impressum">Impressum</a></li>
            <li><a href="/datenschutz">Datenschutzerklärung</a></li>
            <li><a href="/agb">AGB</a></li>
            <li><a href="/cookies">Cookie-Richtlinie</a></li>
          </ul>
        </div>
        
        <div class="footer-section">
          <h4>Kontakt & Support</h4>
          <p>Bei Fragen oder Anregungen:</p>
          <p class="contact-email">
            <a href="mailto:support@kostenlose-erechnung.de">support@kostenlose-erechnung.de</a>
          </p>
          <div class="social-links">
            <a href="#" aria-label="LinkedIn">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
            </a>
            <a href="#" aria-label="Twitter">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
      
      <div class="footer-bottom">
        <p>&copy; {currentYear} kostenlose-erechnung.de - Alle Rechte vorbehalten</p>
        <p class="made-with">Made with 💚 in Deutschland</p>
      </div>
    </div>
  </footer>
  
  <style>
    footer {
      background: var(--text-dark);
      color: var(--bg-white);
      padding: 3rem 0 1.5rem;
      margin-top: auto;
    }
  
    .footer-content {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1.5fr;
      gap: 3rem;
      margin-bottom: 3rem;
    }
  
    .footer-section h4 {
      color: var(--bg-white);
      margin-bottom: 1rem;
      font-size: 1.125rem;
    }
  
    .footer-section p {
      color: rgba(255, 255, 255, 0.8);
      line-height: 1.6;
      margin-bottom: 1rem;
    }
  
    .badges {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 1rem;
    }
  
    .badge {
      background: rgba(123, 254, 132, 0.2);
      color: var(--primary-color);
      padding: 0.25rem 0.75rem;
      border-radius: 50px;
      font-size: 0.875rem;
      white-space: nowrap;
    }
  
    .footer-section ul {
      list-style: none;
    }
  
    .footer-section ul li {
      margin-bottom: 0.75rem;
    }
  
    .footer-section ul li a {
      color: rgba(255, 255, 255, 0.8);
      transition: color 0.3s ease;
    }
  
    .footer-section ul li a:hover {
      color: var(--primary-color);
    }
  
    .contact-email {
      margin: 1rem 0;
    }
  
    .contact-email a {
      color: var(--primary-color);
      font-weight: 500;
    }
  
    .social-links {
      display: flex;
      gap: 1rem;
      margin-top: 1.5rem;
    }
  
    .social-links a {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: var(--radius);
      color: var(--bg-white);
      transition: all 0.3s ease;
    }
  
    .social-links a:hover {
      background: var(--primary-color);
      color: var(--text-dark);
      transform: translateY(-2px);
    }
  
    .social-links svg {
      width: 20px;
      height: 20px;
    }
  
    .footer-bottom {
      padding-top: 2rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
  
    .footer-bottom p {
      color: rgba(255, 255, 255, 0.6);
      margin: 0;
    }
  
    .made-with {
      font-size: 0.875rem;
    }
  
    @media (max-width: 968px) {
      .footer-content {
        grid-template-columns: repeat(2, 1fr);
        gap: 2rem;
      }
  
      .footer-section:first-child {
        grid-column: 1 / -1;
      }
    }
  
    @media (max-width: 640px) {
      .footer-content {
        grid-template-columns: 1fr;
      }
  
      .footer-bottom {
        flex-direction: column;
        text-align: center;
      }
    }
  </style>