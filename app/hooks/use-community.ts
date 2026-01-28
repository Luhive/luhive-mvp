import { useEffect, useState } from "react";
import type { Database } from "~/models/database.types";
import { getCommunityBySlugClient } from "~/services/communities.service";

type Community = Database["public"]["Tables"]["communities"]["Row"];

export function useCommunity(slug: string | null | undefined) {
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState<boolean>(!!slug);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setCommunity(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      const result = await getCommunityBySlugClient(slug);
      if (cancelled) return;

      if (result.error) {
        setCommunity(null);
        setError(result.error.message);
      } else {
        setCommunity(result.community);
      }

      setLoading(false);
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { community, loading, error, setCommunity };
}

