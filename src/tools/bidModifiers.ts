import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { YandexDirectClient } from "../client.js";
import { compact, fail, ok } from "./util.js";

const BID_MODIFIER_TYPES = [
  "MOBILE_ADJUSTMENT",
  "DESKTOP_ADJUSTMENT",
  "DEMOGRAPHICS_ADJUSTMENT",
  "RETARGETING_ADJUSTMENT",
  "REGIONAL_ADJUSTMENT",
  "VIDEO_ADJUSTMENT",
] as const;

const LEVELS = ["CAMPAIGN", "AD_GROUP"] as const;

export function registerBidModifierTools(server: McpServer, client: YandexDirectClient): void {
  server.registerTool(
    "get_bid_modifiers",
    {
      title: "Get bid modifiers",
      description:
        "Reads bid adjustments (mobile, desktop, demographics, retargeting, regional, video) for campaigns or ad groups. BidModifier is a percentage, not money.",
      inputSchema: {
        campaignIds: z.array(z.number().int()).optional().describe("Filter by campaign ids."),
        adGroupIds: z.array(z.number().int()).optional().describe("Filter by ad group ids."),
        ids: z.array(z.number().int()).optional().describe("Filter by bid modifier ids."),
        types: z
          .array(z.enum(BID_MODIFIER_TYPES))
          .optional()
          .describe("Filter by adjustment types."),
        levels: z
          .array(z.enum(LEVELS))
          .optional()
          .describe("Levels to read. Defaults to both CAMPAIGN and AD_GROUP."),
      },
    },
    async ({ campaignIds, adGroupIds, ids, types, levels }) => {
      try {
        if (!campaignIds?.length && !adGroupIds?.length && !ids?.length) {
          return fail("Provide at least one of campaignIds, adGroupIds or ids.");
        }
        const selection = compact({
          CampaignIds: campaignIds?.length ? campaignIds : undefined,
          AdGroupIds: adGroupIds?.length ? adGroupIds : undefined,
          Ids: ids?.length ? ids : undefined,
          Types: types?.length ? types : undefined,
          Levels: levels?.length ? levels : ["CAMPAIGN", "AD_GROUP"],
        });
        const params = {
          SelectionCriteria: selection,
          FieldNames: ["Id", "CampaignId", "AdGroupId", "Level", "Type"],
          MobileAdjustmentFieldNames: ["BidModifier", "OperatingSystemType"],
          DesktopAdjustmentFieldNames: ["BidModifier"],
          DemographicsAdjustmentFieldNames: ["Gender", "Age", "BidModifier", "Enabled"],
          RetargetingAdjustmentFieldNames: ["RetargetingConditionId", "BidModifier", "Enabled"],
          RegionalAdjustmentFieldNames: ["RegionId", "BidModifier", "Enabled"],
        };
        const result = await client.call("bidmodifiers", "get", params);
        return ok(result);
      } catch (e) {
        return fail(e);
      }
    },
  );
}
