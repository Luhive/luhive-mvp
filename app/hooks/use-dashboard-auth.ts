import { useEffect, useState } from "react";
import { createClient } from "~/lib/supabase.client";
import type { User } from "@supabase/supabase-js";

export function useDashboardAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchAuth() {
      try {
        setLoading(true);
        setError(null);

        const supabase = createClient();
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (cancelled) return;

        if (authError) {
          setUser(null);
          setUserEmail("");
          setError(authError.message);
        } else {
          setUser(user);
          setUserEmail(user?.email || "");
        }
      } catch (err) {
        if (cancelled) return;
        setUser(null);
        setUserEmail("");
        setError(err instanceof Error ? err.message : "Failed to fetch auth");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  return { user, userEmail, loading, error };
}
