export type LandingCommunityLogo = {
  name: string;
  logoUrl: string;
};

export type LandingHubPreview = {
  logos: LandingCommunityLogo[];
  communityCountLabel: string | null;
};
