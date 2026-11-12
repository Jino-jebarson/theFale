import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  useNavigate,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import {
  HiOutlineArrowPath,
  HiOutlineHome,
} from "react-icons/hi2";

import { Toaster } from "@/components/ui/sonner";
import { CookieConsent } from "@/components/fale/CookieConsent";
import { applyTheme, initTheme, useTheme } from "@/lib/theme";
import { isApiEnabled, getAccessToken } from "@/lib/api";
import { refreshSession } from "@/lib/adapters/authAdapter";
import { setState, useApp, type Portal } from "@/lib/store";

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
  const navigate = useNavigate();
  const s = useApp();
  const [isRestoring, setIsRestoring] = useState(() => !getAccessToken());

  useEffect(() => {
    initTheme();

    // On page reload in API mode, restore access token and user session via HttpOnly refresh cookie
    if (!getAccessToken()) {
      setIsRestoring(true);
      refreshSession()
        .then((auth) => {
          if (auth) {
            const role = auth.role ?? auth.user?.role;
            const candidateLevel = auth.candidateLevel ?? auth.user?.candidateLevel;
            const isOnboarded = Boolean(auth.onboarded ?? auth.user?.onboarded);
            const targetPortal: Portal =
              role === "ROLE_FACILITY" ? "facility" : role === "ROLE_ADMIN" ? "admin" : "candidate";

            setState({
              signedIn: true,
              contact: auth.user?.phone || auth.user?.email || "",
              portal: targetPortal,
              candidateLevel: candidateLevel ? (candidateLevel.toLowerCase() as any) : undefined,
              onboarded: isOnboarded,
            });
          }
        })
        .catch(() => {
          // No active refresh session cookie or expired
        })
        .finally(() => {
          setIsRestoring(false);
        });
    }
  }, []);

  // Route protection and role boundary guard
  useEffect(() => {
    if (isRestoring) return;

    const isPublicPath =
      pathname === "/" || pathname.startsWith("/landing") ||
      pathname.startsWith("/verify") ||
      pathname.startsWith("/privacy") ||
      pathname.startsWith("/terms") ||
      pathname.startsWith("/admin/login");

    const isOnboardingPath = pathname.startsWith("/onboarding");
    const isEmployerPath = pathname.startsWith("/employer");
    const isAdminPath = pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");

    const hasToken = Boolean(getAccessToken());

    // 1. Unauthenticated users trying to access protected paths -> redirect to / or /admin/login
    if (!hasToken && !isPublicPath) {
      if (pathname.startsWith("/admin")) {
        navigate({ to: "/admin/login" });
        return;
      }
      navigate({ to: "/" });
      return;
    }

    // 2. Authenticated users
    if (hasToken && s.signedIn) {
      // If already onboarded and visiting / or /onboarding or /admin/login -> redirect to role dashboard
      if (s.onboarded && (pathname === "/" || isOnboardingPath || (pathname === "/admin/login" && s.portal === "admin"))) {
        if (s.portal === "facility") navigate({ to: "/employer" });
        else if (s.portal === "admin") navigate({ to: "/admin" });
        else navigate({ to: "/home" });
        return;
      }

      // If NOT onboarded and visiting a dashboard or role page -> redirect to /onboarding
      if (!s.onboarded && !isOnboardingPath && !isPublicPath) {
        navigate({
          to: "/onboarding",
          search: { role: s.portal === "facility" ? "employer" : "candidate" },
        });
        return;
      }

      // Role boundary guards:
      // Candidate cannot open /employer/* or /admin/*
      if (s.portal === "candidate" && (isEmployerPath || isAdminPath)) {
        navigate({ to: "/home" });
        return;
      }

      // Facility cannot open /admin/* or candidate-specific pages
      if (
        s.portal === "facility" &&
        (isAdminPath ||
          pathname === "/home" ||
          pathname.startsWith("/shifts") ||
          pathname.startsWith("/earnings") ||
          pathname.startsWith("/applications") ||
          pathname.startsWith("/profile"))
      ) {
        navigate({ to: "/employer" });
        return;
      }

      // Admin cannot open /employer/* or candidate-specific pages
      if (
        s.portal === "admin" &&
        (isEmployerPath ||
          pathname === "/home" ||
          pathname.startsWith("/shifts") ||
          pathname.startsWith("/earnings") ||
          pathname.startsWith("/applications") ||
          pathname.startsWith("/profile"))
      ) {
        navigate({ to: "/admin" });
        return;
      }
    }
  }, [pathname, isRestoring, s.signedIn, s.onboarded, s.portal, navigate]);

  useEffect(() => {
    applyTheme(resolvedTheme);
    document.body.removeAttribute("data-scroll-locked");
    document.body.style.removeProperty("overflow");
    document.documentElement.style.removeProperty("overflow");
  }, [pathname, resolvedTheme]);

  const isPublicPath =
    pathname === "/" ||
    pathname.startsWith("/landing") ||
    pathname.startsWith("/verify") ||
    pathname.startsWith("/privacy") ||
    pathname.startsWith("/terms") ||
    pathname.startsWith("/admin/login");

  return (
    <QueryClientProvider client={queryClient}>
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-primary/25 overflow-hidden pointer-events-none">
          <div className="h-full w-full bg-primary animate-pulse" />
        </div>
      )}
      {isRestoring && !isPublicPath ? (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <Outlet />
      )}
      <Toaster position="top-center" theme={pathname.startsWith("/onboarding") ? "light" : resolvedTheme} />
      <CookieConsent />
    </QueryClientProvider>
  );
}
