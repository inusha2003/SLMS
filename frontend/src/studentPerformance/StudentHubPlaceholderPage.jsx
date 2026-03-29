export default function StudentHubPlaceholderPage({
  title,
  description = "This section will be available in a future update.",
}) {
  return (
    <div className="p-8 lg:p-10">
      <div className="mb-2 inline-flex rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
        Student hub
      </div>
      <h1 className="mt-3 text-2xl font-bold text-white">{title}</h1>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-400">
        {description}
      </p>
    </div>
  );
}
