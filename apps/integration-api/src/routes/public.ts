import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import type { Env } from "../env";
import { partnerAuth } from "../middleware/partner-auth";
import { PublicEventsRequest } from "../schemas/events";
import { PublicEventsService } from "../services/public-events";
import { toPublicEventResponse } from "../lib/dto";
import { createSupabase } from "../lib/supabase";
import { cachedJson } from "../lib/cache";
import { failureBody, successBody } from "../lib/response";

const publicRoutes = new Hono<{ Bindings: Env }>();

publicRoutes.use("*", partnerAuth);

publicRoutes.get(
  "/events",
  zValidator("query", PublicEventsRequest, (result, c) => {
    if (!result.success) {
      const fields = result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));
      return c.json(failureBody("invalid_query", fields), 400);
    }
  }),
  async (c) => {
    const filters = c.req.valid("query");
    return cachedJson(c, async () => {
      const publicEventsService = new PublicEventsService(
        createSupabase(c.env),
      );
      const { data, next_cursor } =
        await publicEventsService.listPublic(filters);
      return successBody(data.map(toPublicEventResponse), { next_cursor });
    });
  },
);

export default publicRoutes;
