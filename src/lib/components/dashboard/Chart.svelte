<div class="chart-container">
	<div class="chart-placeholder">
		<p>Diagramm wird hier angezeigt</p>
	</div>
</div>

<style>
	.chart-container {
		background-color: var(--white, #ffffff);
		padding: 1.5rem;
		border-radius: 8px;
		border: 1px solid var(--secondary-color, #f0f0f0);
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
		height: 400px;
		display: flex;
		flex-direction: column;
	}

	.chart-placeholder {
		flex-grow: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #a0a0a0;
		border: 2px dashed var(--secondary-color, #f0f0f0);
		border-radius: 6px;
		height: 100%;
	}
</style>
