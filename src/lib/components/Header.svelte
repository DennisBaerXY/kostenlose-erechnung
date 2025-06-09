<script>
	import { page } from "$app/stores";
	import { currentUser, isAuthenticated } from "$lib/stores/auth.js";
	import { getInvoiceCount } from "$lib/stores/auth.js";

	let isMenuOpen = false;
	let showDropdown = false;

	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}

	function logout() {
		$currentUser = null;
		localStorage.removeItem("user");
		// Redirect to home
		window.location.href = "/";
	}

	$: invoiceCount = getInvoiceCount();
	$: remainingFree = 5 - invoiceCount;
</script>

<header>
	<nav class="container">
		<a href="/" class="logo">
			<span class="logo-icon">📄</span>
			kostenlose-erechnung.de
		</a>

		<div class="nav-links" class:open={isMenuOpen}>
			{#if $isAuthenticated}
				<!-- Logged in navigation -->
				<a
					href="/dashboard"
					class="nav-link"
					class:active={$page.url.pathname === "/dashboard"}
				>
					Dashboard
				</a>
			{/if}

			<a
				href="/auslesen"
				class="nav-link"
				class:active={$page.url.pathname === "/auslesen"}
			>
				Rechnung prüfen
			</a>

			{#if $isAuthenticated}
				<div class="user-menu">
					<button
						class="user-button"
						on:click={() => (showDropdown = !showDropdown)}
					>
						<span class="user-icon">👤</span>
						<span class="user-email">{$currentUser.email}</span>
						<span class="dropdown-arrow">▼</span>
					</button>

					{#if showDropdown}
						<div class="dropdown-menu">
							<a href="/dashboard" class="dropdown-item">
								<span>📊</span> Dashboard
							</a>
							<a href="/dashboard/invoices" class="dropdown-item">
								<span>📄</span> Meine Rechnungen
							</a>
							<a href="/dashboard/settings" class="dropdown-item">
								<span>⚙️</span> Einstellungen
							</a>
							{#if $currentUser.tier !== "premium"}
								<a href="/pricing" class="dropdown-item premium">
									<span>⭐</span> Premium werden
								</a>
							{/if}
							<hr />
							<button class="dropdown-item logout" on:click={logout}>
								<span>🚪</span> Abmelden
							</button>
						</div>
					{/if}
				</div>

				<a href="/erstellen" class="btn btn-primary nav-cta">
					Neue Rechnung →
				</a>
			{:else}
				<a href="/login" class="btn nav-cta"> Anmelden </a>
				<a href="/erstellen" class="btn btn-primary nav-cta">
					Rechnung erstellen →
				</a>
			{/if}
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

	.invoice-counter {
		display: flex;
		align-items: center;
		padding: 0.5rem 1rem;
		background: var(--bg-light);
		border-radius: 50px;
		font-size: 0.875rem;
	}

	.counter-text {
		color: var(--text-light);
		font-weight: 500;
	}

	.user-menu {
		position: relative;
	}

	.user-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: var(--bg-light);
		border: none;
		border-radius: var(--radius);
		cursor: pointer;
		transition: all 0.3s ease;
		font-weight: 500;
	}

	.user-button:hover {
		background: var(--primary-light);
	}

	.user-icon {
		font-size: 1.25rem;
	}

	.user-email {
		max-width: 150px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.dropdown-arrow {
		font-size: 0.75rem;
		transition: transform 0.3s ease;
	}

	.user-button:hover .dropdown-arrow {
		transform: rotate(180deg);
	}

	.dropdown-menu {
		position: absolute;
		top: 100%;
		right: 0;
		margin-top: 0.5rem;
		background: var(--bg-white);
		border: 1px solid var(--border-color);
		border-radius: var(--radius);
		box-shadow: var(--shadow-lg);
		min-width: 200px;
		z-index: 1000;
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		color: var(--text-dark);
		transition: background 0.3s ease;
		text-decoration: none;
		border: none;
		background: none;
		width: 100%;
		text-align: left;
		cursor: pointer;
		font-size: 0.875rem;
	}

	.dropdown-item:hover {
		background: var(--bg-light);
	}

	.dropdown-item.premium {
		color: #ffd700;
		font-weight: 600;
	}

	.dropdown-item.logout {
		color: #dc3545;
	}

	.dropdown-menu hr {
		margin: 0.5rem 0;
		border: none;
		border-top: 1px solid var(--border-color);
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

	@media (max-width: 980px) {
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

		.user-menu {
			width: 100%;
		}

		.user-button {
			width: 100%;
			justify-content: center;
		}

		.dropdown-menu {
			position: static;
			box-shadow: none;
			border: none;
			background: var(--bg-light);
			margin-top: 1rem;
		}
	}
</style>
