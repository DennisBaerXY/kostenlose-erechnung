<script>
	import { createEventDispatcher } from "svelte";

	const dispatch = createEventDispatcher();

	/**
	 * Der Titel des Features, das das Modal ausgelöst hat.
	 * @type {string}
	 */
	export let featureName = "Premium Feature";

	function handleClose() {
		dispatch("close");
	}

	function handleUpgrade() {
		dispatch("upgrade");
	}
</script>

<div class="modal-overlay" on:click={handleClose}>
	<div class="modal-unified" on:click|stopPropagation>
		<button class="close-btn" on:click={handleClose}>
			<svg
				viewBox="0 0 24 24"
				width="20"
				height="20"
				fill="none"
				stroke="currentColor"
				stroke-width="2.5"
			>
				<line x1="18" y1="6" x2="6" y2="18" />
				<line x1="6" y1="6" x2="18" y2="18" />
			</svg>
		</button>

		<div class="content-grid">
			<div class="value-column">
				<div class="value-header">
					<h3>Entfesseln Sie Ihr volles Potenzial</h3>
					<p style="text-align: justify;">
						Upgraden Sie jetzt auf Premium, um alle Limits aufzuheben und von
						exklusiven, zeitsparenden Funktionen zu profitieren.
					</p>
				</div>

				<div class="price-section">
					<div class="price-display">
						<span class="price">9,99€</span>
						<span class="period">/ Monat</span>
					</div>
					<div class="trust-signal">Jederzeit kündbar. 100% ohne Risiko.</div>
				</div>
				<a href="/preise">
					<button class="btn-primary"> Jetzt Premium freischalten </button>
				</a>

				<button class="btn-link" on:click={handleClose}> Später </button>
			</div>

			<div class="benefits-column">
				<h4>Das ist in Premium enthalten:</h4>
				<ul class="benefits-list">
					<li class="benefit-item">
						<div class="benefit-text">
							<h5>Unbegrenzt Rechnungen</h5>
							<p>
								Erstellen Sie so viele Rechnungen, wie Ihr Geschäft benötigt.
							</p>
						</div>
					</li>
					<li class="benefit-item">
						<div class="benefit-text">
							<h5>Professionelles Branding</h5>
							<p>
								Fügen Sie Ihr Logo hinzu und wählen Sie aus exklusiven Vorlagen.
							</p>
						</div>
					</li>
					<li class="benefit-item">
						<div class="benefit-text">
							<h5>Cloud Speicherung</h5>
							<p>
								Sichern Sie Ihre Rechnungen automatisch in der Cloud und greifen
								Sie jederzeit darauf zu.
							</p>
						</div>
					</li>
				</ul>
			</div>
		</div>
	</div>
</div>

<style>
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(8px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal-unified {
		background: #ffffff;
		border-radius: 16px;
		max-width: 900px;
		width: 100%;
		box-shadow:
			0 20px 40px -12px rgba(0, 0, 0, 0.2),
			0 0 0 1px rgba(0, 0, 0, 0.05);
		position: relative;
		animation: scaleIn 0.3s cubic-bezier(0.165, 0.84, 0.44, 1) forwards;
	}

	@keyframes scaleIn {
		from {
			transform: scale(0.95);
			opacity: 0;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}

	.close-btn {
		position: absolute;
		top: 1rem;
		right: 1rem;
		background: none;
		border: none;
		color: #9ca3af;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 8px;
		transition: all 0.2s ease;
		z-index: 10;
	}
	.close-btn:hover {
		background: rgba(108, 117, 125, 0.1);
		color: #495057;
	}

	.content-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
	}

	/* Linke Spalte */
	.value-column {
		padding: 2.5rem;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}
	.value-header .header-icon {
		font-size: 2rem;
		display: block;
		margin-bottom: 1rem;
	}
	.value-header h3 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1a1a1a;
		margin: 0 0 0.75rem 0;
	}
	.value-header p {
		color: #6c757d;
		font-size: 0.95rem;
		line-height: 1.5;
		margin: 0;
	}
	.price-section {
		margin: 2rem 0;
		text-align: center;
	}
	.price-display {
		margin-bottom: 0.5rem;
	}
	.price {
		font-size: 2.5rem;
		font-weight: 700;
		color: #111827;
	}
	.period {
		font-size: 1rem;
		color: #6b7280;
		margin-left: 0.25rem;
	}
	.trust-signal {
		font-size: 0.875rem;
		color: #6b7280;
	}
	.btn-primary {
		width: 100%;
		background: #1a1a1a;
		border: none;
		border-radius: 8px;
		padding: 1rem;
		font-size: 1rem;
		font-weight: 600;
		color: #ffffff;
		cursor: pointer;
		transition: all 0.2s ease;
	}
	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}
	.btn-link {
		background: none;
		border: none;
		color: #6c757d;
		cursor: pointer;
		margin-top: 1rem;
		font-size: 0.9rem;
	}

	/* Rechte Spalte */
	.benefits-column {
		background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
		padding: 2.5rem;
		border-radius: 0 16px 16px 0;
	}
	.benefits-column h4 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1a1a1a;
		margin: 0 0 2rem 0;
	}
	.benefits-list {
		padding: 0;
		margin: 0;
	}
	.benefit-item {
		display: flex;
		gap: 1rem;
		align-items: flex-start;
	}
	.benefit-item:not(:last-child) {
		margin-bottom: 1.5rem;
	}
	.benefit-icon {
		flex-shrink: 0;
		width: 40px;
		height: 40px;
		background: #ffffff;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		color: #1a1a1a;
	}
	.benefit-icon svg {
		width: 22px;
		height: 22px;
	}
	.benefit-text h5 {
		font-size: 1rem;
		font-weight: 600;
		color: #1a1a1a;
		margin: 0 0 0.25rem 0;
	}
	.benefit-text p {
		font-size: 0.9rem;
		color: #6c757d;
		margin: 0;
		line-height: 1.4;
	}

	/* Responsive Anpassungen */
	@media (max-width: 768px) {
		.content-grid {
			grid-template-columns: 1fr;
		}
		.benefits-column {
			border-radius: 0 0 16px 16px;
		}
		.value-column,
		.benefits-column {
			padding: 2rem;
		}
	}
</style>
