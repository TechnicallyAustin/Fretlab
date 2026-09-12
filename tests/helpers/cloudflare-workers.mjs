/** Stand-in for the `cloudflare:workers` module under Node. */
export const env = new Proxy(
  {},
  {
    get(_target, property) {
      // Bindings are absent in tests; reading one yields undefined so the code
      // under test takes its "not configured" branch rather than crashing.
      if (property === "AUTH_MODE") return "local";
      return undefined;
    },
  },
);
