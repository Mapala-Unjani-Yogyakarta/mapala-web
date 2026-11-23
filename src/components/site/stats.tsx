export function Stats({ items }: { items: { label: string; value: number }[] }) {
  return (
    <dl className="mx-auto grid max-w-4xl grid-cols-2 border-y border-brand-800/15 md:grid-cols-4">
      {items.map((it, i) => (
        <div key={it.label} className={"px-2 py-8 text-center sm:px-6 " + (i > 0 ? "md:border-l md:border-brand-800/15 " : "") + (i % 2 === 1 ? "border-l border-brand-800/15 md:border-l " : "")}>
          <dd className="font-display text-5xl tracking-tight text-ink">{it.value}</dd>
          <dt className="mt-1 text-sm text-muted">{it.label}</dt>
        </div>
      ))}
    </dl>
  );
}
