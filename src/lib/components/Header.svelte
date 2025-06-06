<script>
	import { page } from "$app/stores";

	let isMenuOpen = false;

	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}
</script>

<header>
	<nav class="container">
		<a href="/" class="logo">
			<span class="logo-icon">📄</span>
			kostenlose-erechnung.de
		</a>

		<div class="nav-links" class:open={isMenuOpen}>
			<a
				href="/auslesen"
				class="btn nav-cta"
				class:active={$page.url.pathname === "/auslesen"}
			>
				Rechnungen auslesen
			</a>

			<a href="/erstellen" class="btn btn-primary nav-cta">
				Rechnung erstellen →
			</a>
		</div>

		<button class="menu-toggle" on:click={toggleMenu} aria-label="Toggle menu">
			<span class="hamburger" class:open={isMenuOpen}></span>
		</button>
	</nav>
</header>

<style>
	header {
		background: var(--bg-white);
		border-bottom: 1px solid var(--border-color);
		position: sticky;
		top: 0;
		z-index: 100;
		backdrop-filter: blur(10px);
		background: rgba(255, 255, 255, 0.95);
	}

	nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 80px;
	}

	.logo {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text-dark);
		display: flex;
		align-items: center;
		gap: 0.5rem;
		transition: transform 0.3s ease;
	}

	.logo:hover {
		transform: scale(1.05);
	}

	.logo-icon {
		font-size: 1.5rem;
	}

	.nav-links {
		display: flex;
		align-items: center;
		gap: 2rem;
	}

	.nav-link {
		color: var(--text-dark);
		font-weight: 500;
		position: relative;
		transition: color 0.3s ease;
	}

	.nav-link::after {
		content: "";
		position: absolute;
		bottom: -4px;
		left: 0;
		width: 0;
		height: 2px;
		background: var(--primary-color);
		transition: width 0.3s ease;
	}

	.nav-link:hover::after,
	.nav-link.active::after {
		width: 100%;
	}

	.nav-link.active {
		color: var(--primary-dark);
	}

	.nav-cta {
		margin-left: 1rem;
	}

	.menu-toggle {
		display: none;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.5rem;
	}

	.hamburger {
		display: block;
		width: 24px;
		height: 2px;
		background: var(--text-dark);
		position: relative;
		transition: all 0.3s ease;
	}

	.hamburger::before,
	.hamburger::after {
		content: "";
		position: absolute;
		width: 24px;
		height: 2px;
		background: var(--text-dark);
		transition: all 0.3s ease;
	}

	.hamburger::before {
		top: -8px;
	}

	.hamburger::after {
		top: 8px;
	}

	.hamburger.open {
		background: transparent;
	}

	.hamburger.open::before {
		transform: rotate(45deg);
		top: 0;
	}

	.hamburger.open::after {
		transform: rotate(-45deg);
		top: 0;
	}

	@media (max-width: 768px) {
		.menu-toggle {
			display: block;
		}

		.nav-links {
			position: absolute;
			top: 100%;
			left: 0;
			right: 0;
			background: var(--bg-white);
			flex-direction: column;
			padding: 2rem;
			gap: 1.5rem;
			border-bottom: 1px solid var(--border-color);
			transform: translateY(-100%);
			opacity: 0;
			visibility: hidden;
			transition: all 0.3s ease;
		}

		.nav-links.open {
			transform: translateY(0);
			opacity: 1;
			visibility: visible;
		}

		.nav-cta {
			margin-left: 0;
			width: 100%;
		}
	}
</style>
