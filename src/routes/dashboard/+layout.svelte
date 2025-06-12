<script>
	/** @type {{ data: import('./$types').LayoutData, children: import('svelte').Snippet }} */
	let { data, children } = $props();
</script>

<div class="dashboard-wrapper">
	<nav>
		<ul>
			<li><a href="/dashboard">Übersicht</a></li>
			<li><a href="/dashboard/invoices">Rechnungen</a></li>
			<li><a href="/dashboard/contacts">Kontakte</a></li>
			<li><a href="/dashboard/templates">Vorlagen</a></li>
			<li><a href="/dashboard/settings">Einstellungen</a></li>
		</ul>
	</nav>
	<div class="dashboard-content">
		<slot />
	</div>
</div>

<style>
	.dashboard-wrapper {
		display: flex;
		position: relative;

		width: 100%;
	}

	.dashboard-content {
		flex: 1;
		padding: 1rem;
		background: var(--bg-light);
	}
	nav {
		position: absolute;
		top: 0;
		z-index: 1000;
		width: 200px;
		background: var(--bg-light);
		padding: 1rem;
		border-right: 1px solid var(--border-color);

		height: 100%;
	}

	nav ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	nav li {
		margin-bottom: 0.5rem;
	}

	nav a {
		text-decoration: none;
		color: var(--text-dark);
	}

	nav a:hover {
		text-decoration: underline;
	}
</style>
