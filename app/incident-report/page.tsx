import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Navigation } from "@/components/landing/navigation";
import { FooterSection } from "@/components/landing/footer-section";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Incident Triage Report (Sample) — Pham Minh Tuan",
  description:
    "Sample analyst-style incident triage report showing how alerts are documented for escalation and shift handover.",
};

const timeline = [
  { time: "T+00:00", event: "5 failed logins for user 'admin' from 203.0.113.44 (pfSense deny logged)" },
  { time: "T+00:03", event: "Failure count reaches 14 within a 3-minute window — Wazuh rule 5710 fires" },
  { time: "T+00:04", event: "Analyst paged via SIEM alert queue, triage playbook opened" },
  { time: "T+00:07", event: "Source IP geolocation checked — no match to known admin travel/VPN egress" },
  { time: "T+00:09", event: "No successful login observed following the failure burst" },
  { time: "T+00:12", event: "Source IP blocked at perimeter firewall, account monitored for 24h" },
];

const evidence = `$ grep "203.0.113.44" /var/log/auth/pfsense.log | tail -5
2026-06-30T21:14:02Z deny tcp 203.0.113.44:51322 -> 10.0.4.8:22
2026-06-30T21:14:05Z deny tcp 203.0.113.44:51330 -> 10.0.4.8:22
2026-06-30T21:14:09Z deny tcp 203.0.113.44:51341 -> 10.0.4.8:22

$ wazuh-logtest --rule 5710
alert.level: 10
alert.description: "Multiple authentication failures (possible brute force)"
srcip: 203.0.113.44
user: admin
count: 14`;

export default function IncidentReportPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <Navigation />

      <section className="relative pt-40 pb-24 lg:pt-48 lg:pb-32 bg-[oklch(0.09_0.01_260)] text-white overflow-hidden">
        {/* Terminal artwork — right side, fades under the text */}
        <div className="absolute inset-y-0 right-0 w-full lg:w-[60%] pointer-events-none">
          <img
            src="/images/report-terminal.svg"
            alt="Terminal window streaming security log lines with alert highlights"
            className="w-full h-full object-cover object-center opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[oklch(0.09_0.01_260)] via-[oklch(0.09_0.01_260)]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.09_0.01_260)] via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
          <Link
            href="/#proof"
            className="inline-flex items-center gap-2 text-sm font-mono text-white/50 hover:text-white transition-colors mb-10"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          <span className="inline-flex items-center gap-3 text-sm font-mono text-white/40 mb-6">
            <span className="w-12 h-px bg-white/20" />
            SOC documentation sample
          </span>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-display tracking-tight leading-[0.95] mb-8 max-w-3xl">
            Incident Triage Report
          </h1>

          <p className="text-xl text-white/60 leading-relaxed max-w-2xl">
            A practice report modeled on the &ldquo;Brute-force login triage&rdquo; playbook —
            showing how an alert gets turned into a clear, handoff-ready decision.
          </p>
        </div>
      </section>

      <section className="relative py-24 lg:py-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          {/* Meta block */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
            {[
              { label: "Incident ID", value: "INC-2026-0630-114" },
              { label: "Severity", value: "Medium" },
              { label: "Source", value: "pfSense / Wazuh" },
              { label: "Status", value: "Closed — contained" },
            ].map((item) => (
              <div key={item.label} className="p-6 border border-foreground/10 bg-foreground/[0.02]">
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest block mb-2">
                  {item.label}
                </span>
                <p className="font-medium">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mb-20 max-w-3xl">
            <h2 className="text-3xl lg:text-4xl font-display tracking-tight mb-6">Summary</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Repeated failed SSH authentication attempts against a monitored host were detected from a single
              external source. Volume and timing matched a brute-force pattern. No successful authentication
              followed the failure burst. Source was blocked at the perimeter and the account was placed under
              24-hour monitoring as a precaution.
            </p>
          </div>

          {/* Timeline */}
          <div className="mb-20">
            <h2 className="text-3xl lg:text-4xl font-display tracking-tight mb-8">Timeline</h2>
            <div className="space-y-4">
              {timeline.map((t) => (
                <div key={t.time} className="flex gap-6 p-5 border border-foreground/10">
                  <span className="font-mono text-sm text-[#eca8d6] shrink-0 w-20">{t.time}</span>
                  <span className="text-muted-foreground leading-relaxed">{t.event}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Evidence */}
          <div className="mb-20">
            <h2 className="text-3xl lg:text-4xl font-display tracking-tight mb-8">Evidence</h2>
            <pre className="p-8 bg-black text-white/80 font-mono text-sm leading-relaxed overflow-x-auto whitespace-pre-wrap">
              {evidence}
            </pre>
          </div>

          {/* Analysis + recommendation */}
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-display tracking-tight mb-6">Analysis</h2>
              <ul className="space-y-3">
                {[
                  "Failure volume (14 in 3 minutes) exceeds the normal baseline for this host",
                  "Source IP has no association with known admin travel or VPN egress ranges",
                  "No successful login followed the failure burst — low confidence of compromise",
                  "Pattern matches the brute-force login triage playbook exactly",
                ].map((a) => (
                  <li key={a} className="flex gap-3 text-muted-foreground leading-relaxed">
                    <span className="text-foreground/30 shrink-0">—</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-2xl font-display tracking-tight mb-6">Recommended action</h2>
              <ul className="space-y-3">
                {[
                  "Block source IP at perimeter firewall (completed)",
                  "Monitor affected account for 24 hours for delayed follow-up attempts",
                  "No password reset required — no evidence of successful authentication",
                  "Consider rate-limiting SSH auth attempts at the firewall for this host",
                ].map((a) => (
                  <li key={a} className="flex gap-3 text-muted-foreground leading-relaxed">
                    <span className="text-[#eca8d6] shrink-0">✓</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <FooterSection />
    </main>
  );
}
