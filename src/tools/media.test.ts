import { test } from "node:test";
import assert from "node:assert/strict";
import { registerMediaTools } from "./media.js";

type Args = Record<string, unknown>;
type Handler = (args: Args) => Promise<{ content: { text: string }[]; isError?: boolean }>;

function harness() {
  const calls: { service: string; method: string; params: any }[] = [];
  const tools: Record<string, Handler> = {};
  const client = {
    call: async (service: string, method: string, params: any) => {
      calls.push({ service, method, params });
      return {};
    },
  };
  const server = {
    registerTool: (name: string, _cfg: unknown, handler: Handler) => {
      tools[name] = handler;
    },
  };
  registerMediaTools(server as never, client as never);
  return { calls, tools };
}

test("get_ad_images selects by hashes and reads adimages", async () => {
  const { calls, tools } = harness();
  await tools.get_ad_images({ hashes: ["abc"] });
  assert.equal(calls[0].service, "adimages");
  assert.deepEqual(calls[0].params.SelectionCriteria, { AdImageHashes: ["abc"] });
  assert.ok(calls[0].params.FieldNames.includes("AdImageHash"));
});

test("get_ad_videos selects by ids and reads advideos", async () => {
  const { calls, tools } = harness();
  await tools.get_ad_videos({ ids: [5], limit: 3 });
  assert.equal(calls[0].service, "advideos");
  assert.deepEqual(calls[0].params.SelectionCriteria, { Ids: [5] });
  assert.deepEqual(calls[0].params.Page, { Limit: 3, Offset: 0 });
});

test("get_creatives reads creatives with an empty selection by default", async () => {
  const { calls, tools } = harness();
  await tools.get_creatives({});
  assert.equal(calls[0].service, "creatives");
  assert.deepEqual(calls[0].params.SelectionCriteria, {});
});
