import { test } from "node:test";
import assert from "node:assert/strict";
import { registerBidModifierTools } from "./bidModifiers.js";

type Args = Record<string, unknown>;
type Handler = (args: Args) => Promise<{ content: { text: string }[]; isError?: boolean }>;

function harness() {
  const calls: { service: string; method: string; params: any }[] = [];
  const tools: Record<string, Handler> = {};
  const client = {
    call: async (service: string, method: string, params: any) => {
      calls.push({ service, method, params });
      return { BidModifiers: [] };
    },
  };
  const server = {
    registerTool: (name: string, _cfg: unknown, handler: Handler) => {
      tools[name] = handler;
    },
  };
  registerBidModifierTools(server as never, client as never);
  return { calls, tools };
}

test("get_bid_modifiers defaults Levels and requests type-specific fields", async () => {
  const { calls, tools } = harness();
  const res = await tools.get_bid_modifiers({ campaignIds: [1] });
  assert.equal(res.isError, undefined);
  assert.equal(calls[0].service, "bidmodifiers");
  assert.equal(calls[0].method, "get");
  assert.deepEqual(calls[0].params.SelectionCriteria.Levels, ["CAMPAIGN", "AD_GROUP"]);
  assert.deepEqual(calls[0].params.SelectionCriteria.CampaignIds, [1]);
  assert.ok(calls[0].params.MobileAdjustmentFieldNames.includes("BidModifier"));
  assert.ok(calls[0].params.DemographicsAdjustmentFieldNames.includes("Age"));
});

test("get_bid_modifiers requires a selection and otherwise makes no call", async () => {
  const { calls, tools } = harness();
  const res = await tools.get_bid_modifiers({});
  assert.equal(res.isError, true);
  assert.equal(calls.length, 0);
});

test("get_bid_modifiers passes through explicit levels and types", async () => {
  const { calls, tools } = harness();
  await tools.get_bid_modifiers({ adGroupIds: [5], levels: ["AD_GROUP"], types: ["MOBILE_ADJUSTMENT"] });
  assert.deepEqual(calls[0].params.SelectionCriteria.Levels, ["AD_GROUP"]);
  assert.deepEqual(calls[0].params.SelectionCriteria.Types, ["MOBILE_ADJUSTMENT"]);
});
