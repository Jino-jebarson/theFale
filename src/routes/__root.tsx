import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import {
  HiOutlineArrowPath,
  HiOutlineHome,
} from "react-icons/hi2";

import { Toaster } from "@/components/ui/sonner";
import { applyTheme, initTheme, useTheme } from "@/lib/theme";

const LazyLottieError = lazy(() =>
  Promise.all([
    import("@/components/fale/LottieAnimation"),
    import("@/assets/lottie-error.json"),
  ]).then(([lottieMod, dataMod]) => ({
    default: (props: { className?: string }) => (
      <lottieMod.LottieAnimation
        animationData={dataMod.default}
        loop={true}
        className={props.className}
      />
    ),
  }))
);

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="surface max-w-md w-full rounded-3xl border border-border/80 bg-card p-6 sm:p-8 text-center shadow-lg animate-in fade-in zoom-in-95 duration-300">
        <div className="mx-auto -mt-2 mb-4 w-52 sm:w-60 overflow-hidden min-h-[160px] flex items-center justify-center">
          <Suspense fallback={<div className="h-40 w-full animate-pulse rounded-2xl bg-muted/40" />}>
            <LazyLottieError className="w-full h-auto" />
          </Suspense>
        </div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
          The healthcare portal page you're looking for doesn't exist or has moved.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-primary/90 active:scale-[0.98]"
          >
            <HiOutlineHome className="h-4 w-4" />
            <span>Go home</span>
          </Link>
          <Link
            to="/jobs"
            search={{ q: undefined }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border/80 bg-card px-5 py-2.5 text-sm font-bold text-foreground transition-all hover:bg-muted active:scale-[0.98]"
          >
            <span>Browse Jobs</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="surface max-w-md w-full rounded-3xl border border-border/80 bg-card p-6 sm:p-8 text-center shadow-lg animate-in fade-in zoom-in-95 duration-300">
        {/* Lottie Animation from LottieFiles */}
        <div className="mx-auto -mt-2 mb-4 w-52 sm:w-60 overflow-hidden min-h-[160px] flex items-center justify-center">
          <Suspense fallback={<div className="h-40 w-full animate-pulse rounded-2xl bg-muted/40" />}>
            <LazyLottieError className="w-full h-auto" />
          </Suspense>
        </div>

        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-primary/90 hover:shadow-lg active:scale-[0.98] cursor-pointer"
          >
            <HiOutlineArrowPath className="h-4 w-4" />
            <span>Try again</span>
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border/80 bg-card px-5 py-2.5 text-sm font-bold text-foreground transition-all hover:bg-muted active:scale-[0.98]"
          >
            <HiOutlineHome className="h-4 w-4 text-muted-foreground" />
            <span>Go home</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { resolvedTheme } = useTheme();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isLoading = useRouterState({ select: (s) => s.isLoading });

  useEffect(() => {
    initTheme();
  }, []);

  useEffect(() => {
    applyTheme(resolvedTheme);
    // Clean up any lingering scroll locks left by Radix modals/drawers when changing routes
    document.body.removeAttribute("data-scroll-locked");
    document.body.style.removeProperty("overflow");
    document.documentElement.style.removeProperty("overflow");
  }, [pathname, resolvedTheme]);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Top navigation progress bar for instant mobile tap feedback */}
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-primary/25 overflow-hidden pointer-events-none">
          <div className="h-full w-full bg-primary animate-pulse" />
        </div>
      )}
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <Toaster position="top-center" theme={pathname.startsWith("/onboarding") ? "light" : resolvedTheme} />
    </QueryClientProvider>
  );
}
