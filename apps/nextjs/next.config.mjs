// @ts-check
/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
 * This is especially useful for Docker builds.
 */
!process.env.SKIP_ENV_VALIDATION && (await import("./src/env/server.mjs"));

/** @type {import("next").NextConfig} */
const config = {
  swcMinify: true,
  experimental: {},
  transpilePackages: [
    "@notion-comments/api",
    "@notion-comments/auth",
    "@notion-comments/ui",
  ],
  // We already do linting on GH actions
  // eslint: {
  //   ignoreDuringBuilds: !!process.env.CI,
  // },
};

export default config;
