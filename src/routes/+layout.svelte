<script>
	import Header from "$lib/components/Header.svelte";
	import Footer from "$lib/components/Footer.svelte";
	import { authStore } from "$lib/stores/authStore.js";
	import { browser } from "$app/environment";

	/**
	 * This load function runs on the client when the app first starts.
	 * It's the perfect place to initialize client-side stores and services.
	 * @type {import('./$types').LayoutLoad}
	 */
	export async function load() {
		if (browser) {
			// Initialize the authentication store by reading from localStorage.
			authStore.init();
		}

		// We don't need to return any props, so an empty object is fine.
		return {};
	}
</script>

<div class="app">
	<Header />
	<main>
		<slot />
	</main>
	<Footer />
</div>

<style>
	:global(:root) {
		--primary-color: #7bfe84;
		--primary-dark: #5fcc67;
		--primary-light: #a8fead;
		--text-dark: #1a1a1a;
		--text-light: #666;
		--bg-light: #f8f9fa;
		--bg-white: #ffffff;
		--border-color: #e0e0e0;
		--shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		--shadow-lg: 0 4px 24px rgba(0, 0, 0, 0.12);
		--radius: 8px;
		--radius-lg: 16px;
	}

	:global(*) {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
	}

	:global(body) {
		font-family:
			-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
		color: var(--text-dark);
		line-height: 1.6;
		background: var(--bg-white);
		overflow-x: hidden;
	}

	:global(h1, h2, h3, h4, h5, h6) {
		line-height: 1.2;
		margin-bottom: 1rem;
	}

	:global(h1) {
		font-size: clamp(2rem, 5vw, 3.5rem);
		font-weight: 800;
	}

	:global(h2) {
		font-size: clamp(1.5rem, 4vw, 2.5rem);
		font-weight: 700;
	}

	:global(h3) {
		font-size: clamp(1.25rem, 3vw, 1.75rem);
		font-weight: 600;
	}

	:global(p) {
		margin-bottom: 1rem;
	}

	:global(a) {
		color: var(--primary-dark);
		text-decoration: none;
		transition: color 0.3s ease;
	}

	:global(a:hover) {
		color: var(--primary-color);
	}

	:global(.btn) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.75rem 2rem;
		border-radius: var(--radius);
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.3s ease;
		border: none;
		text-decoration: none;
	}

	:global(.btn-primary) {
		background: var(--primary-color);
		color: var(--text-dark);
	}

	:global(.btn-primary:hover) {
		background: var(--primary-dark);
		color: var(--text-dark);
		transform: translateY(-2px);
		box-shadow: var(--shadow);
	}

	:global(.btn-secondary) {
		background: transparent;
		color: var(--text-dark);
		border: 2px solid var(--border-color);
	}

	:global(.btn-secondary:hover) {
		border-color: var(--primary-color);
		color: var(--primary-dark);
	}

	:global(.container) {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1.5rem;
	}

	.app {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	main {
		flex: 1;
	}
</style>
