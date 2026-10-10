import { BosdikShell } from "@/features/bosdik/BosdikShell/BosdikShell";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin — Vishwajit Yati Portfolio",
  // The sign-in screen must stay publicly reachable, so the page cannot be
  // access-gated. Instead it is excluded from search engines and every response
  // carries `X-Robots-Tag: noindex` plus `Cache-Control: no-store` (see next.config.ts).
  robots: { index: false, follow: false, nocache: true }
};

export default function BosdikPage() {
  return <BosdikShell />;
}
