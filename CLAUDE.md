# CLAUDE.md — mcp-yandex-direct

MCP server for the Yandex Direct API v5 (TypeScript, stdio). Tools wrap the JSON
services; `raw_request` is the escape hatch for everything without a dedicated tool.

## Commands

```bash
npm run dev        # run from source (tsx watch)
npm test           # unit tests, no network
npm run typecheck  # types for src + tests
npm run build      # emit dist/
npm run smoke      # live READ-ONLY calls (needs YANDEX_DIRECT_TOKEN)
```

More detail in [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md). Tool list: [docs/TOOLS.md](docs/TOOLS.md).

## Architecture

- `src/client.ts` — HTTP client: timeout, retry/backoff, Units quota, `getAll` cursor pagination, report polling.
- `src/tools/*.ts` — one file per service, each exports `register<Name>Tools(server, client)`.
- `src/tools/util.ts` — shared helpers (see conventions below).
- `src/index.ts` — wires every `register*` into the McpServer.
- `src/config.ts` — env → config.

## Conventions (do not break)

- **Money in account currency units, never micros.** Inputs/outputs are in units;
  convert at the boundary with `toMicros`/`fromMicros`, normalize read results with
  `normalizeMoney`. The only place micros leak is `raw_request` (documented).
- **Writes go through `okOrPartial`,** not `ok` — the API returns HTTP 200 with
  per-object `Errors`, and partial failures must surface as `isError`.
- **Validate inputs with zod** in `inputSchema`; reject empty updates before any call
  (see `update_campaign`/`update_text_ad` tests).
- **Output compact JSON via `ok`** — the consumer is an LLM; pretty-printing only burns tokens.
- **Pagination:** single-page tools clamp to `MAX_TOOL_LIMIT`; `autoPaginate` uses
  `getAll` at `DEFAULT_PAGE_LIMIT` and flags `_truncated` instead of silently cutting.
- **Runtime guidance for the consuming model goes in the tool `description`,** not in
  this file — the external agent never reads CLAUDE.md. API gotchas (budget minimums,
  bid-modifier rules, field limits) belong in the relevant tool's description.

## Adding a tool

1. Add (or extend) `src/tools/<name>.ts` with `register<Name>Tools(server, client)`.
2. Import and call it in `src/index.ts`.
3. Add a `*.test.ts` using the fake-server/mock-client harness (no network).
4. Document the tool in `docs/TOOLS.md`.
5. `npm run typecheck && npm test`.

## Safety

- Tools hit a **real ad account with real money.** `smoke` is read-only by design;
  never put a production token in CI.

## Releasing

- Bump `version` in `package.json` **and** `server.json` (root + `packages[].version`)
  together, then `npm publish`. `mcpName` in `package.json` must match `name` in
  `server.json` for the MCP registry — see [docs/PUBLISHING.md](docs/PUBLISHING.md).
