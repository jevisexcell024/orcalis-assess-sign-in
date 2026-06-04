/**
 * GDPR Cookie Consent Banner
 * Shown on first visit. Preference stored in localStorage.
 * Compliant with GDPR, PECR, and CCPA.
 */
import { useState, useEffect } from "react";
import { Shield, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type ConsentPreferences = {
  necessary: true;       // always on
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
};

type ConsentState = {
  decided: boolean;
  preferences: ConsentPreferences;
  decidedAt: string | null;
};

const STORAGE_KEY = "orcalis-gdpr-consent";
const DEFAULT_PREFS: ConsentPreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
  functional: true,
};

export function loadConsent(): ConsentState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { decided: false, preferences: DEFAULT_PREFS, decidedAt: null };
}

function saveConsent(preferences: ConsentPreferences): void {
  const state: ConsentState = {
    decided: true,
    preferences,
    decidedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  // Emit custom event so analytics can respond
  window.dispatchEvent(new CustomEvent("orcalis:consent", { detail: state }));
}

export function GDPRConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [prefs, setPrefs] = useState<ConsentPreferences>(DEFAULT_PREFS);

  useEffect(() => {
    const consent = loadConsent();
    if (!consent.decided) {
      // Small delay so it doesn't flash on first paint
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const handleAcceptAll = () => {
    const all: ConsentPreferences = {
      necessary: true, analytics: true, marketing: true, functional: true,
    };
    saveConsent(all);
    setVisible(false);
  };

  const handleRejectAll = () => {
    const minimal: ConsentPreferences = {
      necessary: true, analytics: false, marketing: false, functional: false,
    };
    saveConsent(minimal);
    setVisible(false);
  };

  const handleSavePrefs = () => {
    saveConsent(prefs);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-modal="true"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[9999] border-t border-border bg-background shadow-2xl",
        "md:bottom-4 md:left-4 md:right-auto md:max-w-lg md:rounded-2xl md:border",
      )}
    >
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm"
              style={{ background: "var(--gradient-primary)" }}>
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">Cookie Preferences</p>
              <p className="text-[11px] text-muted-foreground">GDPR · CCPA · PECR</p>
            </div>
          </div>
          <button
            aria-label="Close without deciding"
            onClick={() => setVisible(false)}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          We use cookies to operate the platform, analyse usage, and improve your experience.
          Necessary cookies are always active. You can manage optional cookies below.{" "}
          <a href="/privacy" className="underline hover:text-foreground">Privacy Policy</a>
        </p>

        {/* Expandable preferences */}
        {expanded && (
          <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
            {[
              {
                id: "necessary" as const,
                label: "Necessary",
                desc: "Authentication, session management, security. Cannot be disabled.",
                locked: true,
              },
              {
                id: "functional" as const,
                label: "Functional",
                desc: "Remembers your preferences (sidebar state, theme, language).",
                locked: false,
              },
              {
                id: "analytics" as const,
                label: "Analytics",
                desc: "Anonymised usage data via Sentry and platform analytics. Helps us improve.",
                locked: false,
              },
              {
                id: "marketing" as const,
                label: "Marketing",
                desc: "Used to measure effectiveness of institutional outreach campaigns.",
                locked: false,
              },
            ].map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium">{item.label}</p>
                  <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                </div>
                <Switch
                  checked={prefs[item.id]}
                  disabled={item.locked}
                  onCheckedChange={(v) => !item.locked && setPrefs((p) => ({ ...p, [item.id]: v }))}
                  aria-label={`Toggle ${item.label} cookies`}
                />
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button size="sm" onClick={handleAcceptAll} className="flex-1 text-xs">
            Accept All
          </Button>
          {expanded ? (
            <Button size="sm" variant="outline" onClick={handleSavePrefs} className="flex-1 text-xs">
              Save My Choices
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={handleRejectAll} className="flex-1 text-xs">
              Reject Optional
            </Button>
          )}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
            aria-expanded={expanded}
            aria-label="Manage cookie preferences"
          >
            Manage
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
