// svelte.config.js
import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			// Diese Zeile ist der Schlüssel für eine SPA.
			// Sie sagt dem Webserver: "Wenn du eine angefragte Seite wie '/erstellen'
			// nicht als Datei findest, sende stattdessen die 'index.html'."
			fallback: "index.html"
		})
	}
};

export default config;
