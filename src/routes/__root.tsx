import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  redirect,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import * as Sentry from "@sentry/react";
import { getSession, isPublicPath } from "@/lib/auth";
import { initSentry, captureException } from "@/lib/sentry-init";
import { Toaster } from "@/components/ui/sonner";
import { useEffect } from "react";
import { registerServiceWorker, setupAutoSync } from "@/lib/offline-exam";
import { supabase } from "@/integrations/supabase/client";

// Initialize Sentry on app startup
initSentry();

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  // Send error to Sentry
  captureException(error, { component: "RootErrorBoundary" });
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Orcalis Assess · Secure online exams & AI proctoring" },
      {
        name: "description",
        content:
          "Orcalis Assess — enterprise online examination platform with AI-powered remote proctoring for universities, certification bodies, and corporations.",
      },
      { name: "author", content: "Orcalis Assess" },
      { property: "og:title", content: "Orcalis Assess · Secure online exams & AI proctoring" },
      {
        property: "og:description",
        content:
          "Secure online examination and AI-powered remote proctoring for institutions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: "https://mjwdhjwgacggvontvgex.supabase.co/storage/v1/object/public/assets/og-image.png" },
      { property: "og:site_name", content: "Orcalis Assess" },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Orcalis Assess · Secure online exams & AI proctoring" },
      { name: "description", content: "Orcalis Assess Sign-In provides a premium, enterprise-grade authentication page for an AI-powered examination platform." },
      { property: "og:description", content: "Orcalis Assess — Enterprise AI-powered examination platform. Secure exams, real-time proctoring, and intelligent analytics for institutions worldwide." },
      { name: "twitter:description", content: "Orcalis Assess Sign-In provides a premium, enterprise-grade authentication page for an AI-powered examination platform." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/85cc6f1d-90b9-49ad-a9a2-35fd133891a2/id-preview-86b3e317--8f2025ab-6d97-4b22-9d05-2e93349702a2.lovable.app-1779549912744.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/85cc6f1d-90b9-49ad-a9a2-35fd133891a2/id-preview-86b3e317--8f2025ab-6d97-4b22-9d05-2e93349702a2.lovable.app-1779549912744.png" },
    ],
    links: [
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
  beforeLoad: async ({ location }) => {
    if (location.pathname.startsWith("/lovable/")) return;
    if (isPublicPath(location.pathname)) {
      return;
    }

    const session = await getSession();

    if (!session) {
      return redirect({ to: "/" });
    }
  },
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      router.invalidate();
      queryClient.invalidateQueries();
    });
    return () => subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster />
    </QueryClientProvider>
  );
}
