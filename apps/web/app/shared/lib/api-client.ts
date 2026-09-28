import { ApiClient } from "@luhive/api-client";
import { addSessionToken } from "./session-token";

const coreUrl = process.env.CORE_API_URL;
if (!coreUrl) throw new Error("CORE_API_URL is not set");

export const apiClient = new ApiClient(coreUrl, [addSessionToken]);
