import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import manrope400Url from "./assets/fonts/manrope-v20-latin_latin-ext-regular.woff2?url";
import manrope500Url from "./assets/fonts/manrope-v20-latin_latin-ext-500.woff2?url";
import manrope600Url from "./assets/fonts/manrope-v20-latin_latin-ext-600.woff2?url";
import manrope700Url from "./assets/fonts/manrope-v20-latin_latin-ext-700.woff2?url";
import { Toaster } from "sonner";
import ErrorComponent from "./routes/error";

export const links: Route.LinksFunction = () => [
  // Preload local Manrope font files for faster first paint
  { rel: "preload", href: manrope400Url, as: "font", type: "font/woff2", crossOrigin: "anonymous" },
  { rel: "preload", href: manrope500Url, as: "font", type: "font/woff2", crossOrigin: "anonymous" },
  { rel: "preload", href: manrope600Url, as: "font", type: "font/woff2", crossOrigin: "anonymous" },
  { rel: "preload", href: manrope700Url, as: "font", type: "font/woff2", crossOrigin: "anonymous" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <Toaster position="bottom-right" />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {

  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof ErrorComponent) {
    details = (error as Error).message || details;
    stack = (error as Error).stack;
  }

  return <ErrorComponent message={message} details={details} stack={stack} />;
}
