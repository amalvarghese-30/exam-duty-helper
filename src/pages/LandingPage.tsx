import { useState } from "react";
import { ArrowRight, CheckCircle2, Clock3, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";

const processSteps = [
  {
    title: "Prepare data",
    detail: "Admin updates teachers, exams, and leave entries before scheduling.",
  },
  {
    title: "Configure policy",
    detail: "Rule policy and optional auto-run are configured from the admin panel.",
  },
  {
    title: "Run allocation",
    detail: "AI allocation creates the roster using leave-aware and fairness-aware constraints.",
  },
  {
    title: "Validate and publish",
    detail: "Conflicts, fairness analytics, and swap recommendations are reviewed before final use.",
  },
];

export default function LandingPage() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <div className="relative min-h-screen overflow-x-clip bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="landing-orb landing-orb-left" />
      <div className="landing-orb landing-orb-right" />

      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
        <div className="flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-white shadow-lg shadow-slate-900/20 dark:bg-slate-100 dark:text-slate-900">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="landing-display text-sm font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Exam Duty Suite</p>
              <p className="landing-display text-lg font-bold text-slate-900 dark:text-white">AI Allocation Platform</p>
            </div>
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <ThemeToggle className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800" />
            <Button asChild variant="ghost" className="font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white">
              <Link to="/contributors">Contributors</Link>
            </Button>
            <Button asChild variant="outline" className="border-slate-300 font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800">
              <Link to="/auth">Login</Link>
            </Button>
          </div>
          <div className="sm:hidden">
            <ThemeToggle className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800" />
          </div>
        </div>
      </header>

      <main>
        <section className="relative grid w-full gap-12 px-4 pb-14 pt-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-10 lg:pt-20">
          <div className="space-y-8 landing-reveal">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              Exam Duty Automation with Explainable AI
            </div>

            <div className="space-y-5">
              <h1 className="landing-display text-4xl font-black leading-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white">
                AI Exam Duty Helper
                <span className="block text-teal-700 dark:text-teal-300">For Allocation, Validation, and Monitoring</span>
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg dark:text-slate-300">
                A role-based platform for exam cells to manage teachers, exams, leaves, allocation policy, and explainable duty assignment.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg" className="h-12 rounded-xl bg-slate-900 px-6 text-base font-semibold text-white hover:bg-slate-800">
                <Link to="/auth" className="inline-flex items-center gap-2">
                  Enter Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 rounded-xl border-slate-300 px-6 text-base font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800">
                <Link to="/contributors">Meet the Team</Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label="Roles" value="Admin + Teacher" />
              <Stat label="Core Engine" value="AI + Rules" />
              <Stat label="Validation" value="Conflicts + Fairness" />
              <Stat label="Planning Mode" value="Live + Simulation" />
            </div>
          </div>

          <div className="landing-reveal-delay">
            <div className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-slate-950/30">
              <div className="absolute -top-3 left-6 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-300">
                Allocation Workflow
              </div>

              <div className="space-y-4 pt-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">Current Cycle</p>
                  <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">Exam Scheduling and Duty Allocation</p>
                </div>

                <div className="space-y-2">
                  {processSteps.map((step, index) => (
                    <button
                      key={step.title}
                      type="button"
                      onClick={() => setActiveStep(index)}
                      className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
                        activeStep === index
                          ? "border-teal-200 bg-teal-50 dark:border-teal-700 dark:bg-teal-950/40"
                          : "border-slate-100 dark:border-slate-700 dark:bg-slate-800/50"
                      }`}
                    >
                      <div className="mt-0.5 grid h-6 w-6 place-items-center rounded-full bg-teal-700 text-xs font-bold text-white">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{step.title}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-300">{step.detail}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/50">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                    <Clock3 className="h-4 w-4" />
                    <span className="text-sm font-semibold">Active step: {processSteps[activeStep].title}</span>
                  </div>
                  <span className="rounded-full bg-emerald-700 px-3 py-1 text-xs font-semibold text-white">Active</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full px-4 pb-20 sm:px-6 lg:px-10">
          <div className="overflow-hidden rounded-3xl bg-slate-900 px-6 py-10 text-white sm:px-10 sm:py-12 dark:border dark:border-slate-700">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-300">Start Using the Platform</p>
            <h2 className="landing-display mt-3 text-3xl font-black leading-tight sm:text-4xl">
              Manage exam duties with allocation, analytics, and conflict checks in one place.
            </h2>
            <p className="mt-4 max-w-2xl text-slate-300">
              Open the admin dashboard for allocation and operations, or open the teacher dashboard for duties, availability, and assistant updates.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 rounded-xl bg-white px-6 font-semibold text-slate-900 hover:bg-slate-100">
                <Link to="/auth">Open Platform</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 rounded-xl border-slate-500 bg-transparent px-6 font-semibold text-white hover:bg-slate-800 dark:border-slate-600 dark:hover:bg-slate-700">
                <Link to="/contributors">View Contributors</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-900/5 dark:border-slate-700 dark:bg-slate-900">
      <p className="text-xl font-black text-slate-900 dark:text-white">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}
