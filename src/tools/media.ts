import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { YandexDirectClient } from "../client.js";
import { buildPage, fail, ok, okOrPartial } from "./util.js";

export function registerMediaTools(server: McpServer, client: YandexDirectClient): void {
  server.registerTool(
    "get_ad_images",
    {
      title: "Get ad images",
      description: "Lists images in the ad image library, keyed by image hash. Upload new images with upload_ad_image.",
      inputSchema: {
        hashes: z.array(z.string()).optional().describe("Filter by image hashes."),
        limit: z.number().int().min(1).max(10000).optional().describe("Max objects per page."),
        offset: z.number().int().min(0).optional().describe("Pagination offset."),
      },
    },
    async ({ hashes, limit, offset }) => {
      try {
        const params: Record<string, unknown> = {
          SelectionCriteria: hashes?.length ? { AdImageHashes: hashes } : {},
          FieldNames: ["AdImageHash", "Name", "Type", "Subtype", "Associated"],
        };
        const page = buildPage(limit, offset);
        if (page) params.Page = page;
        const result = await client.call("adimages", "get", params);
        return ok(result);
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    "get_ad_videos",
    {
      title: "Get ad videos",
      description:
        "Reads videos from the ad video library by id (the API requires ids). Uploads go via raw_request (advideos/add).",
      inputSchema: {
        ids: z.array(z.number().int()).min(1).describe("Video ids (required by the API)."),
        limit: z.number().int().min(1).max(10000).optional().describe("Max objects per page."),
        offset: z.number().int().min(0).optional().describe("Pagination offset."),
      },
    },
    async ({ ids, limit, offset }) => {
      try {
        const params: Record<string, unknown> = {
          SelectionCriteria: { Ids: ids },
          FieldNames: ["Id", "Name", "Status"],
        };
        const page = buildPage(limit, offset);
        if (page) params.Page = page;
        const result = await client.call("advideos", "get", params);
        return ok(result);
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    "get_creatives",
    {
      title: "Get creatives",
      description: "Lists creatives (smart banners, HTML5) from the creative library.",
      inputSchema: {
        ids: z.array(z.number().int()).optional().describe("Filter by creative ids."),
        limit: z.number().int().min(1).max(10000).optional().describe("Max objects per page."),
        offset: z.number().int().min(0).optional().describe("Pagination offset."),
      },
    },
    async ({ ids, limit, offset }) => {
      try {
        const params: Record<string, unknown> = {
          SelectionCriteria: ids?.length ? { Ids: ids } : {},
          FieldNames: ["Id", "Type", "Name"],
        };
        const page = buildPage(limit, offset);
        if (page) params.Page = page;
        const result = await client.call("creatives", "get", params);
        return ok(result);
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    "upload_ad_image",
    {
      title: "Upload ad image",
      description:
        "Uploads an image to the ad image library (adimages/add) and returns its AdImageHash — use that hash as AdImageHash on a text & image ad. Provide the image as a public URL (fetched and encoded server-side) or as base64 in imageData. Yandex accepts JPG/PNG/GIF up to 10 MB; a text & image ad needs a landscape image (min 1080×607).",
      inputSchema: {
        name: z.string().min(1).max(255).describe("Image name shown in the library."),
        url: z
          .string()
          .url()
          .optional()
          .describe("Public image URL; fetched and base64-encoded server-side. Provide this or imageData."),
        imageData: z
          .string()
          .min(1)
          .optional()
          .describe("Base64-encoded image bytes (a data: URL prefix is stripped). Provide this or url."),
      },
    },
    async ({ name, url, imageData }) => {
      try {
        if (!url && !imageData) {
          return fail(new Error("Provide either url or imageData."));
        }
        const data = imageData ? stripDataUrlPrefix(imageData) : await fetchImageBase64(url as string);
        const result = await client.call("adimages", "add", {
          AdImages: [{ Name: name, ImageData: data }],
        });
        return okOrPartial(result);
      } catch (e) {
        return fail(e);
      }
    },
  );
}

/** Drops a `data:<mime>;base64,` prefix so callers can paste a data URL verbatim. */
function stripDataUrlPrefix(data: string): string {
  return data.replace(/^data:[^;,]*;base64,/, "");
}

/** Fetches an image URL and returns its bytes as base64 for adimages/add. */
async function fetchImageBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch image from "${url}": HTTP ${res.status}`);
  }
  return Buffer.from(await res.arrayBuffer()).toString("base64");
}
