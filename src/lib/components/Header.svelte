<script>
	import { page } from "$app/stores";
	import { authStore, isAuthenticated, isLoading } from "$lib/stores/authStore";

	// Local UI state
	let isMenuOpen = false;
	let showDropdown = false;

	// Closes the mobile menu and dropdown when navigating
	$: if ($page.url.pathname) {
		isMenuOpen = false;
		showDropdown = false;
	}

	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}

	async function handleLogout() {
		await authStore.logout();
	}
</script>

<header>
	<nav class="container">
		<div class="nav-left">
			<a href="/" class="logo">
				<span class="logo-icon">📄</span>
				kostenlose-erechnung.de
			</a>
			<div class="main-nav-links desktop-only">
				<a
					href="/preise"
					class="nav-link"
					class:active={$page.url.pathname === "/preise"}
				>
					Preise
				</a>
				<a
					href="/auslesen"
					class="nav-link"
					class:active={$page.url.pathname.startsWith("/auslesen")}
				>
					Rechnung prüfen
				</a>
				{#if $isAuthenticated}
					<a
						href="/dashboard"
						class="nav-link"
						class:active={$page.url.pathname.startsWith("/dashboard")}
					>
						Dashboard
					</a>
				{/if}
			</div>
		</div>

		<div class="nav-right-wrapper" class:open={isMenuOpen}>
			{#if !$isAuthenticated && !$isLoading}
				<div class="auth-links">
					<a
						href="/login"
						class="nav-link"
						class:active={$page.url.pathname === "/login"}
					>
						Einloggen
					</a>
					<a href="/erstellen" class="btn btn-primary nav-cta">
						Rechnung erstellen →
					</a>
				</div>
			{/if}

			{#if $isAuthenticated && $authStore && !$isLoading}
				<div class="auth-links">
					<div class="user-menu">
						<button
							class="user-button"
							on:click={() => (showDropdown = !showDropdown)}
							aria-haspopup="true"
							aria-expanded={showDropdown}
						>
							<span class="user-icon">👤</span>
							<span class="user-email">{$authStore.email}</span>
							<span class="dropdown-arrow" class:open={showDropdown}>▼</span>
						</button>

						{#if showDropdown}
							<div class="dropdown-menu">
								<a href="/dashboard" class="dropdown-item">
									<span>📊</span> Dashboard
								</a>
								<a href="/dashboard/invoices" class="dropdown-item">
									<span>📄</span> Meine Rechnungen
								</a>
								<a href="/erstellen" class="dropdown-item">
									<span>➕</span> Neue Rechnung
								</a>
								<a href="/dashboard/settings" class="dropdown-item">
									<span>⚙️</span> Einstellungen
								</a>
								{#if $authStore.subscriptionStatus !== "premium"}
									<a href="/preise" class="dropdown-item premium">
										<span>⭐</span> Premium werden
									</a>
								{/if}
								<hr />
								<button class="dropdown-item logout" on:click={handleLogout}>
									<span>🚪</span> Abmelden
								</button>
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>

		<button
			class="menu-toggle"
			on:click={toggleMenu}
			aria-label="Toggle menu"
			aria-expanded={isMenuOpen}
		>
			<span class="hamburger" class:open={isMenuOpen}></span>
		</button>
	</nav>
</header>

<style>
	/* Deine existierenden Styles sind super und wurden beibehalten.
       Hier sind nur die notwendigen Anpassungen und Ergänzungen. */
	header {
		background: var(--bg-white, #fff);
		border-bottom: 1px solid var(--border-color, #dee2e6);
		position: sticky;
		top: 0;
		z-index: 100;
		backdrop-filter: blur(10px);
		background: rgba(255, 255, 255, 0.95);
	}

	nav.container {
		display: flex;
		align-items: center;
		justify-content: space-between; /* WICHTIG: Teilt links und rechts */
		height: 80px;
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1rem;
	}

	.nav-left {
		display: flex;
		align-items: center;
		gap: 2rem;
	}

	.main-nav-links {
		display: flex;
		align-items: center;
		gap: 2rem;
	}

	.auth-links {
		display: flex;
		align-items: center;
		gap: 1.5rem;
	}

	.logo {
		/* ... existing styles ... */
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text-dark, #1a1a1a);
		display: flex;
		align-items: center;
		gap: 0.5rem;
		transition: transform 0.3s ease;
		text-decoration: none;
		flex-shrink: 0; /* Verhindert, dass das Logo schrumpft */
	}

	/* ... all your other great styles for .nav-link, .user-menu etc. remain the same ... */
	.logo:hover {
		transform: scale(1.05);
	}

	.logo-icon {
		font-size: 1.5rem;
	}

	.nav-link {
		text-decoration: none;
		padding: 0.5rem 0;
		color: var(--text-dark, #1a1a1a);
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
		background: var(--primary-color, #7bfe84);
		transition: width 0.3s ease;
	}

	.nav-link:hover::after,
	.nav-link.active::after {
		width: 100%;
	}
	.nav-link.active {
		color: var(--primary-dark, #5cb85c);
	}

	.user-menu {
		position: relative;
	}

	.user-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: var(--bg-light, #f8f9fa);
		border: 1px solid var(--border-color, #dee2e6);
		border-radius: var(--radius, 6px);
		cursor: pointer;
		transition: all 0.3s ease;
		font-weight: 500;
	}

	.user-button:hover {
		background: var(--primary-light, #e0fadf);
		border-color: var(--primary-dark, #5cb85c);
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

	.dropdown-arrow.open {
		transform: rotate(180deg);
	}

	.dropdown-menu {
		position: absolute;
		top: 100%;
		right: 0;
		margin-top: 0.5rem;
		background: var(--bg-white, #fff);
		border: 1px solid var(--border-color, #dee2e6);
		border-radius: var(--radius, 6px);
		box-shadow: var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1));
		min-width: 220px;
		z-index: 1000;
		padding: 0.5rem 0;
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		color: var(--text-dark, #1a1a1a);
		transition: background 0.2s ease;
		text-decoration: none;
		border: none;
		background: none;
		width: 100%;
		text-align: left;
		cursor: pointer;
		font-size: 0.875rem;
	}

	.dropdown-item:hover {
		background: var(--bg-light, #f8f9fa);
	}

	.dropdown-item.premium {
		color: #b38600;
		font-weight: 600;
	}

	.dropdown-item.logout {
		color: #dc3545;
	}

	.dropdown-menu hr {
		margin: 0.5rem 0;
		border: none;
		border-top: 1px solid var(--border-color, #dee2e6);
	}

	.btn {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		border-radius: var(--radius, 6px);
		text-decoration: none;
		font-weight: 600;
		transition: all 0.3s ease;
	}

	.btn-primary {
		background: var(--primary-color, #7bfe84);
		color: var(--text-dark, #1a1a1a);
	}
	.btn-primary:hover {
		background: var(--primary-dark, #5cb85c);
		transform: translateY(-2px);
	}

	.nav-cta {
		margin-left: 1rem;
	}

	.menu-toggle {
		display: none; /* Wird nur auf Mobilgeräten sichtbar */
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.5rem;
		z-index: 101;
	}

	.hamburger {
		/* ... existing styles ... */
		display: block;
		width: 24px;
		height: 2px;
		background: var(--text-dark, #1a1a1a);
		position: relative;
		transition: all 0.3s ease;
	}
	.hamburger::before,
	.hamburger::after {
		content: "";
		position: absolute;
		width: 24px;
		height: 2px;
		background: var(--text-dark, #1a1a1a);
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

	/* --- Media Query für Mobile Ansicht --- */
	@media (max-width: 980px) {
		.desktop-only {
			display: none; /* Hauptlinks im linken Bereich auf Mobil ausblenden */
		}

		.menu-toggle {
			display: block; /* Hamburger-Menü anzeigen */
		}

		.nav-right-wrapper {
			position: fixed;
			top: 80px; /* Höhe der Navbar */
			left: 0;
			right: 0;
			bottom: 0;
			background: var(--bg-white, #fff);
			flex-direction: column;
			padding: 2rem;
			gap: 1.5rem;
			transform: translateX(100%);
			opacity: 0;
			visibility: hidden;
			transition: all 0.3s ease-in-out;

			/* Stellt sicher, dass die Links im mobilen Menü korrekt ausgerichtet sind */
			display: flex;
			align-items: flex-start;
		}

		.nav-right-wrapper.open {
			transform: translateX(0);
			opacity: 1;
			visibility: visible;
		}

		.auth-links {
			flex-direction: column;
			width: 100%;
			gap: 1.5rem;
			align-items: stretch; /* Füllt die Breite aus */
		}

		.nav-cta {
			margin-left: 0;
			width: 100%;
			text-align: center;
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
			background: var(--bg-light, #f8f9fa);
			margin-top: 1rem;
			min-width: 100%;
		}
	}
</style>
