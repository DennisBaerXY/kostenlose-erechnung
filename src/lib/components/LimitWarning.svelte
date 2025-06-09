<script>
	import { getInvoiceCount } from "$lib/stores/auth.js";

	export let onUpgrade;

	$: invoiceCount = getInvoiceCount();
	$: remaining = Math.max(0, 5 - invoiceCount);
</script>

{#if remaining <= 2 && remaining > 0}
	<div class="warning-banner">
		<span class="warning-icon">⚠️</span>
		<p>
			Nur noch <strong>{remaining}</strong> kostenlose {remaining === 1
				? "Rechnung"
				: "Rechnungen"} in diesem Monat.
			<button class="upgrade-link" on:click={onUpgrade}>
				Jetzt upgraden für unbegrenzte Rechnungen
			</button>
		</p>
	</div>
{:else if remaining === 0}
	<div class="error-banner">
		<span class="error-icon">🚫</span>
		<p>
			Sie haben das monatliche Limit von 5 kostenlosen Rechnungen erreicht.
			<button class="upgrade-link" on:click={onUpgrade}>
				Auf Premium upgraden für unbegrenzte Rechnungen
			</button>
		</p>
	</div>
{/if}

<style>
	.warning-banner,
	.error-banner {
		padding: 1rem;
		border-radius: var(--radius);
		margin-bottom: 1rem;
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.warning-banner {
		background: #fff3cd;
		border: 1px solid #ffeaa7;
		color: #856404;
	}

	.error-banner {
		background: #f8d7da;
		border: 1px solid #f5c6cb;
		color: #721c24;
	}

	.warning-icon,
	.error-icon {
		font-size: 1.5rem;
	}

	p {
		margin: 0;
		flex: 1;
	}

	.upgrade-link {
		background: none;
		border: none;
		color: inherit;
		text-decoration: underline;
		cursor: pointer;
		font-weight: 600;
	}
</style>
