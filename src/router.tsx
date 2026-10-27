import { QueryClient } from "@tanstack/react-query";
import { createRouter, createMemoryHistory, createBrowserHistory } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
    },
  },
});

function getInitialPath(): string {
  if (typeof window === "undefined") return "/";
  try {
    if (window.location.hash) {
      const cleaned = window.location.hash.replace(/^#\/?/, "");
      if (cleaned) return "/" + cleaned;
    }
    const isStandardWeb =
      (window.location.protocol === "http:" || window.location.protocol === "https:") &&
      !window.location.pathname.endsWith(".html") &&
      !window.location.pathname.includes("/dist");
    if (isStandardWeb && window.location.pathname) {
      return window.location.pathname;
    }
  } catch (e) {}
  return "/";
}

const isNonStandardEnv =
  typeof window !== "undefined" &&
  (window.location.protocol !== "http:" && window.location.protocol !== "https:" ||
    window.location.pathname.endsWith(".html") ||
    window.location.pathname.includes(".html") ||
    window.self !== window.top);

const history = isNonStandardEnv
  ? createMemoryHistory({ initialEntries: [getInitialPath()] })
  : createBrowserHistory();

export const router = createRouter({
  routeTree,
  history,
  context: { queryClient },
  defaultPreload: "intent",
  defaultPreloadStaleTime: 1000 * 60,
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

