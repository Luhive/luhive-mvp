export interface IpLocationData {
  ip: string | null;
  country: string | null;
  city: string | null;
  region: string | null;
  timezone: string | null;
}

interface IpApiResponse {
  status?: "success" | "fail";
  message?: string;
  query?: string;
  country?: string;
  city?: string;
  regionName?: string;
  timezone?: string;
}

async function lookupIpApi(): Promise<IpLocationData | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);

  try {
    const response = await fetch("http://ip-api.com/json/", {
      method: "GET",
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as IpApiResponse;
    if (data.status !== "success") {
      return null;
    }

    return {
      ip: data.query || null,
      country: data.country || null,
      city: data.city || null,
      region: data.regionName || null,
      timezone: data.timezone || null,
    };
  } catch (error) {
    console.error("Error looking up IP location:", error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getIpLocation(): Promise<IpLocationData> {
  const ipApiLocation = await lookupIpApi();
  return (
    ipApiLocation || {
      ip: null,
      country: null,
      city: null,
      region: null,
      timezone: null,
    }
  );
}
