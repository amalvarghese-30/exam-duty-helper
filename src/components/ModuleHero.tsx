interface ModuleHeroProps {
  eyebrow: string;
  title: string;
  description: string;
}

export default function ModuleHero({ eyebrow, title, description }: ModuleHeroProps) {
  return (
    <div className="rounded-2xl border border-cyan-200 bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-900 p-6 text-white dark:border-cyan-800">
      <p className="text-xs uppercase tracking-[0.14em] text-cyan-200">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-bold">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm text-cyan-100">{description}</p>
    </div>
  );
}
