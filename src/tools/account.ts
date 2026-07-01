import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { YandexDirectClient } from "../client.js";
import { fail, ok, READ_ONLY } from "./util.js";

const DEFAULT_FIELDS = [
  "Login",
  "ClientId",
  "ClientInfo",
  "Currency",
  "Type",
  "CountryId",
  "AccountQuality",
];

export function registerAccountTools(server: McpServer, client: YandexDirectClient): void {
  server.registerTool(
    "get_account_info",
    {
      title: "Get account info",
      annotations: READ_ONLY,
      description:
        "Returns information about the current advertiser account (login, currency, type, country) using the Yandex Direct `clients` service.",
      inputSchema: {
        fieldNames: z
          .array(z.string())
          .optional()
          .describe("Client fields to return. Defaults to a common set."),
      },
    },
    async ({ fieldNames }) => {
      try {
        const result = await client.call("clients", "get", {
          FieldNames: fieldNames?.length ? fieldNames : DEFAULT_FIELDS,
        });
        return ok(result);
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    "get_balance",
    {
      title: "Get account balance",
      annotations: READ_ONLY,
      description:
        "Returns the shared-account balance and finance fields (Amount, AmountAvailableForTransfer, Currency, Discount, AccountID) via the legacy Live v4 AccountManagement service — the only Yandex Direct API that exposes balance (v5 has no finance method). Amount is a string in account CURRENCY UNITS (not micros); a negative Amount means the account is in debt. Defaults to the token's own account; pass logins to target specific shared accounts.",
      inputSchema: {
        logins: z
          .array(z.string())
          .optional()
          .describe("Account logins to fetch. Defaults to the token's own account."),
      },
    },
    async ({ logins }) => {
      try {
        // Money in Live v4 is already in currency units — do NOT normalizeMoney it.
        const result = await client.callV4("AccountManagement", {
          Action: "Get",
          SelectionCriteria: logins?.length ? { Logins: logins } : {},
        });
        return ok(result);
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    "get_quota",
    {
      title: "Get API quota",
      annotations: READ_ONLY,
      description:
        "Returns today's API points quota (spent / rest / limit) from the Units header, so you can avoid hitting the daily limit.",
      inputSchema: {},
    },
    async () => {
      try {
        await client.call("clients", "get", { FieldNames: ["Login"] });
        const units = client.units;
        return ok(units ?? "Units quota was not reported by the API.");
      } catch (e) {
        return fail(e);
      }
    },
  );
}
