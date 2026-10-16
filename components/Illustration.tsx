import { SCENES } from "@/lib/illustrations";

/** Original Khidmah illustrations. `name` is a service slug or a spot name like "step-pro". */
export function Illustration({ name, className = "w-full", label }: { name: string; className?: string; label?: string }) {
  const markup = SCENES[name];
  if (!markup) return null;
  return (
    <svg
      viewBox="0 0 240 160"
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      // Static markup authored in lib/illustrations.ts, never user content
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
