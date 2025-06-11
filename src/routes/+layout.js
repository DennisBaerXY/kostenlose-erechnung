import { browser } from "$app/environment";
import { authStore } from "$lib/stores/authStore.js";

export async function load() {
	if (browser) {
		await authStore.init();
	}
	return {};
}

export const prerender = false;
export const ssr = false;
