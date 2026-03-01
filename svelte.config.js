import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			pages: "build",
			assets: "build",
			fallback: "404.html",
			precompress: false,
			strict: true,
		}),
		paths: {
			// Якщо твій репозиторій називається 'my-repo', то base має бути '/my-repo'
			// Якщо це custom domain або username.github.io, залиш порожню стрічку
			base: process.env.NODE_ENV === "production" ? "/tierduel" : "",
		},
	},
};

export default config;
