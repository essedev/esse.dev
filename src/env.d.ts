// Values astro.config.mjs defines at build time (`vite.define`).
interface ImportMetaEnv {
	/** The short commit of the build, or `dev` outside a repository. */
	readonly BUILD_COMMIT: string;
	/** The build day, `YYYY-MM-DD`. */
	readonly BUILD_DATE: string;
}
