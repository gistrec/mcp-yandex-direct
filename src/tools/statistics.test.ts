import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_FIELDS_BY_TYPE, REPORT_TYPES } from "./statistics.js";

test("every report type has a default field set", () => {
  for (const type of REPORT_TYPES) {
    assert.ok(DEFAULT_FIELDS_BY_TYPE[type]?.length, `${type} has defaults`);
  }
});

test("ACCOUNT_PERFORMANCE_REPORT defaults exclude fields the API rejects for it", () => {
  const fields = DEFAULT_FIELDS_BY_TYPE.ACCOUNT_PERFORMANCE_REPORT;
  for (const forbidden of ["CampaignName", "CampaignId", "AdGroupName", "AdId", "CriterionId"]) {
    assert.ok(!fields.includes(forbidden), `${forbidden} must not be a default`);
  }
});

test("defaults exclude Date so reports aggregate over the period (LD)", () => {
  for (const type of REPORT_TYPES) {
    assert.ok(
      !DEFAULT_FIELDS_BY_TYPE[type].includes("Date"),
      `${type} default must not include Date (would split the report by day)`,
    );
  }
});

test("SEARCH_QUERY default is the period aggregate: CampaignName + Query + metrics", () => {
  assert.deepEqual(DEFAULT_FIELDS_BY_TYPE.SEARCH_QUERY_PERFORMANCE_REPORT, [
    "CampaignName",
    "Query",
    "Impressions",
    "Clicks",
    "Cost",
    "Ctr",
    "AvgCpc",
  ]);
});
