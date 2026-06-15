import { test } from "node:test";
import assert from "node:assert/strict";
import { filterRegions, type GeoRegion } from "./dictionaries.js";

const REGIONS: GeoRegion[] = [
  { GeoRegionId: 225, GeoRegionName: "Россия", GeoRegionType: "Country" },
  { GeoRegionId: 213, GeoRegionName: "Москва", GeoRegionType: "City", ParentId: 1 },
  { GeoRegionId: 2, GeoRegionName: "Санкт-Петербург", GeoRegionType: "City" },
  { GeoRegionId: 1, GeoRegionName: "Москва и область", GeoRegionType: "Region" },
];

test("filterRegions matches a case-insensitive name substring", () => {
  const result = filterRegions(REGIONS, "москва", 50);
  assert.deepEqual(
    result.map((r) => r.GeoRegionId),
    [213, 1],
  );
});

test("filterRegions caps results by limit", () => {
  assert.equal(filterRegions(REGIONS, undefined, 2).length, 2);
});

test("filterRegions returns all (capped) when no query is given", () => {
  assert.equal(filterRegions(REGIONS, undefined, 50).length, REGIONS.length);
});
