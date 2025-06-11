import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// adapter-static for static site generation
		adapter: adapter({
			// default options are shown
			pages: "build",
			assets: "build",
			fallback: "index.html",
			precompress: false,
			strict: true
		}),

		// Prerender all pages by default
		prerender: {
			entries: ["*"],
			handleHttpError: ({ path, referrer, message }) => {
				// ignore 404s for dynamic routes
				if (message.includes("Not found")) {
					return;
				}

				// otherwise fail the build
				throw new Error(message);
			}
		},

		// CSP headers for security
		csp: {
			directives: {
				"script-src": ["self"],
				"style-src": ["self", "unsafe-inline"],
				"img-src": ["self", "data:", "https:"],
				"font-src": ["self"],
				"connect-src": [
					"self",
					"https://z836skrf8a.execute-api.eu-central-1.amazonaws.com"
				],
				"frame-ancestors": ["none"],
				"form-action": ["self"],
				"base-uri": ["self"]
			}
		},

		// Environment variable prefix
		env: {
			publicPrefix: "PUBLIC_"
		}
	}
};

export default config;
