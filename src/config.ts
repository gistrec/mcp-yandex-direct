import type { YandexDirectConfig } from "./types.js";

/** Builds the client config from environment variables, exiting if the token is missing. */
export function loadConfig(): YandexDirectConfig {
  const token = process.env.YANDEX_DIRECT_TOKEN;
  if (!token) {
    console.error("Error: YANDEX_DIRECT_TOKEN environment variable is required.");
    process.exit(1);
  }
  const timeoutMs = Number(process.env.YANDEX_DIRECT_TIMEOUT_MS);
  const maxRetries = Number(process.env.YANDEX_DIRECT_MAX_RETRIES);
  return {
    token,
    login: process.env.YANDEX_DIRECT_LOGIN || undefined,
    lang: process.env.YANDEX_DIRECT_LANG || "ru",
    sandbox: /^(1|true|yes)$/i.test(process.env.YANDEX_DIRECT_SANDBOX ?? ""),
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 60_000,
    maxRetries: Number.isFinite(maxRetries) && maxRetries >= 0 ? maxRetries : 3,
  };
}
