import { UAParser } from "ua-parser-js";

/**
 * Strongly typed user agent model for analytics
 */
export interface UserAgentData {
  browser: {
    name: string | undefined;
    version: string | undefined;
    major: string | undefined;
  };
  device: {
    model: string | undefined;
    type: string | undefined;
    vendor: string | undefined;
    isMobile: boolean | undefined;
  };
  os: {
    name: string | undefined;
    version: string | undefined;
  };
}

/**
 * Parses user agent details from a Request object for analytics
 */
export function getUserAgent(request: Request): UserAgentData {
  const userAgentString = request.headers.get("user-agent") || "";
  const parser = new UAParser(userAgentString);

  const browser = parser.getBrowser();
  const device = parser.getDevice();
  const os = parser.getOS();

  return {
    browser: {
      name: browser.name,
      version: browser.version,
      major: browser.major,
    },
    device: {
      model: device.model,
      type: device.type,
      vendor: device.vendor,
      isMobile: device.type === 'mobile' || device.type === "tablet"
    },
    os: {
      name: os.name,
      version: os.version,
    },
  };
}
