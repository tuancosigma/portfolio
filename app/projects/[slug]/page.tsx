import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Navigation } from "@/components/landing/navigation";
import { FooterSection } from "@/components/landing/footer-section";
import { projects, getProject } from "@/lib/projects-data";
import type { Metadata } from "next";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  return {
    title: `${project.title} — Pham Minh Tuan`,
    description: project.summary,
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <Navigation />

      <section className="relative pt-40 pb-24 lg:pt-48 lg:pb-32 bg-foreground text-background overflow-hidden">
        {/* Project artwork — right side, fades under the text */}
        <div className="absolute inset-y-0 right-0 w-full lg:w-[65%] pointer-events-none">
          <img
            src={project.image}
            alt={project.imageAlt}
            className="w-full h-full object-cover object-center opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground via-foreground/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
          <Link
            href="/#developers"
            className="inline-flex items-center gap-2 text-sm font-mono text-background/50 hover:text-background transition-colors mb-10"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          <span className="inline-flex items-center gap-3 text-sm font-mono text-background/40 mb-6">
            <span className="w-12 h-px bg-background/20" />
            {project.meta}
          </span>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-display tracking-tight leading-[0.95] mb-8 max-w-3xl">
            {project.title}
          </h1>

          <p className="text-xl text-background/60 leading-relaxed max-w-2xl mb-8">
            {project.summary}
          </p>

          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 border border-background/20 text-xs font-mono uppercase tracking-widest text-background/70">
              Severity: {project.severity}
            </span>
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 border border-background/10 text-xs font-mono text-background/50"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-24 lg:py-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          {/* Signal / Environment / Outcome */}
          <div className="grid md:grid-cols-3 gap-6 mb-20">
            {[
              { label: "Signal", value: project.signal },
              { label: "Environment", value: project.environment },
              { label: "Outcome", value: project.outcome },
            ].map((item) => (
              <div key={item.label} className="p-8 border border-foreground/10 bg-foreground/[0.02]">
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest block mb-3">
                  {item.label}
                </span>
                <p className="text-lg">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Detection logic */}
          <div className="mb-20">
            <h2 className="text-3xl lg:text-4xl font-display tracking-tight mb-8">Detection logic</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { step: "01", title: "Observe", body: project.detectionLogic.observe },
                { step: "02", title: "Investigate", body: project.detectionLogic.investigate },
                { step: "03", title: "Respond", body: project.detectionLogic.respond },
              ].map((item) => (
                <div key={item.step} className="p-8 border border-foreground/10">
                  <span className="text-sm font-mono text-muted-foreground">{item.step}</span>
                  <h3 className="text-xl font-display mt-3 mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Case study */}
          <div className="mb-20">
            <h2 className="text-3xl lg:text-4xl font-display tracking-tight mb-8">Case study</h2>
            <div className="grid lg:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div>
                  <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest block mb-3">Problem</span>
                  <p className="text-lg leading-relaxed">{project.caseStudy.problem}</p>
                </div>
                <div>
                  <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest block mb-3">Lab environment</span>
                  <ul className="flex flex-wrap gap-2">
                    {project.caseStudy.environment.map((e) => (
                      <li key={e} className="px-3 py-1 border border-foreground/10 text-sm text-muted-foreground">
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="space-y-8">
                <div>
                  <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest block mb-3">Actions</span>
                  <ul className="space-y-3">
                    {project.caseStudy.actions.map((a) => (
                      <li key={a} className="flex gap-3 text-muted-foreground leading-relaxed">
                        <span className="text-foreground/30 shrink-0">—</span>
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest block mb-3">Result</span>
                  <p className="leading-relaxed">{project.caseStudy.result}</p>
                </div>
                <div>
                  <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest block mb-3">Learned</span>
                  <p className="leading-relaxed">{project.caseStudy.learned}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Impact + details */}
          <div className="grid lg:grid-cols-3 gap-12 mb-20">
            <div>
              <h2 className="text-2xl font-display tracking-tight mb-6">Impact</h2>
              <ul className="space-y-3">
                {project.impact.map((i) => (
                  <li key={i} className="flex gap-3 text-muted-foreground">
                    <span className="text-[#eca8d6] shrink-0">✓</span>
                    {i}
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-display tracking-tight mb-6">What I did</h2>
              <ul className="space-y-3">
                {project.details.map((d) => (
                  <li key={d} className="flex gap-3 text-muted-foreground leading-relaxed">
                    <span className="text-foreground/30 shrink-0">—</span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {project.source && (
            <a
              href={project.source}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 border border-foreground/20 hover:border-foreground transition-colors text-sm font-medium"
            >
              View source on GitHub
              <ArrowUpRight className="w-4 h-4" />
            </a>
          )}
        </div>
      </section>

      <FooterSection />
    </main>
  );
}
