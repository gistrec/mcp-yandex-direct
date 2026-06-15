#!/usr/bin/env node
// Read-only smoke check against the configured Yandex Direct account.
// Run locally with your own token in the environment — it makes no writes.
import { YandexDirectClient } from "./client.js";
import { loadConfig } from "./config.js";

interface Account {
  Login?: string;
  Currency?: string;
  Type?: string;
}

async function main(): Promise<void> {
  const config = loadConfig();
  const client = new YandexDirectClient(config);
  const target = config.sandbox ? "sandbox" : "PRODUCTION";
  console.log(`Yandex Direct smoke check (${target}, read-only)\n`);

  // clients/get also carries the Units quota header.
  const account = await client.call<{ Clients?: Account[] }>("clients", "get", {
    FieldNames: ["Login", "Currency", "Type"],
  });
  const c = account.Clients?.[0];
  console.log(`account:   ${c?.Login ?? "?"} (${c?.Currency ?? "?"}, ${c?.Type ?? "?"})`);

  const units = client.units;
  if (units) {
    console.log(`quota:     ${units.spent} spent / ${units.rest} left / ${units.limit} limit`);
  }

  const campaigns = await client.call<{ Campaigns?: { Id: number; Name: string }[] }>(
    "campaigns",
    "get",
    { SelectionCriteria: {}, FieldNames: ["Id", "Name"], Page: { Limit: 5, Offset: 0 } },
  );
  const list = campaigns.Campaigns ?? [];
  console.log(`campaigns: ${list.length} returned`);
  for (const camp of list) console.log(`           - [${camp.Id}] ${camp.Name}`);

  console.log("\nSmoke check passed.");
}

main().catch((err) => {
  console.error(`\nSmoke check FAILED: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
