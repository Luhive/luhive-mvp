import type { Profile } from "~/shared/models/entity.types";

export type SettingsLoaderData = {
  user: Profile | null;
  email: string | null;
};

export type SettingsActionData = {
  success: boolean;
  message?: string;
  error?: string;
};
