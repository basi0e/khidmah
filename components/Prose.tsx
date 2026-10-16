import { SiteHeader } from "./SiteHeader";

export function ProsePage({ title, updated, children }: { title: string; updated?: string; children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-paper px-4 py-14 sm:px-6">
        <article className="mx-auto max-w-[68ch]">
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
          {updated && <p className="mt-2 text-muted">Last updated {updated}</p>}
          <div className="prose-k mt-8">{children}</div>
        </article>
      </main>
    </>
  );
}
