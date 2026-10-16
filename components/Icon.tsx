const paths: Record<string, React.ReactNode> = {
  ac: (
    <>
      <path d="M12 2v20M2 12h20M4.9 4.9l14.2 14.2M19.1 4.9 4.9 19.1" />
      <path d="M9 3.5l3 2.5 3-2.5M9 20.5l3-2.5 3 2.5M3.5 9l2.5 3-2.5 3M20.5 9 18 12l2.5 3" />
    </>
  ),
  plumbing: (
    <>
      <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />
      <path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5" />
    </>
  ),
  electrical: <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />,
  cleaning: (
    <>
      <path d="M11 3l1.8 4.6L17.4 9.4l-4.6 1.8L11 15.8l-1.8-4.6L4.6 9.4l4.6-1.8z" />
      <path d="M18.5 14.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
    </>
  ),
  painting: (
    <>
      <rect x="3" y="3" width="14" height="6" rx="1.5" />
      <path d="M17 6h3v5h-8v3" />
      <rect x="10" y="14" width="4" height="7" rx="1" />
    </>
  ),
  carpentry: (
    <>
      <path d="M14.5 3.5l6 6-2.5 2.5-6-6z" />
      <path d="M13.2 7.8 4.6 16.4a2 2 0 0 0 2.9 2.9l8.6-8.6" />
    </>
  ),
  appliances: (
    <>
      <rect x="4" y="2.5" width="16" height="19" rx="2" />
      <circle cx="12" cy="13.5" r="4.5" />
      <path d="M7.5 6h2M14 6h2.5" />
    </>
  ),
  pest: (
    <>
      <rect x="8" y="8" width="8" height="12" rx="4" />
      <circle cx="12" cy="5.5" r="2" />
      <path d="M8 12H4.5M8 16H4.5M16 12h3.5M16 16h3.5M12 10v10" />
    </>
  ),
  moving: (
    <>
      <path d="M2 6h12v10H2zM14 10h4l3 3v3h-7z" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </>
  ),
  rooms: (
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="M11 12l9-9M17 6l3 3M14.5 8.5l2 2" />
    </>
  ),
};

export function Icon({ name, className = "h-7 w-7" }: { name: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
