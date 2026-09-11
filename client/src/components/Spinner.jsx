// Small inline spinner for buttons/actions in progress. Uses the shared
// .spinner animation defined once in index.css (see MOTION tokens).
export default function Spinner({ className = '' }) {
  return (
    <svg
      className={`spinner h-3.5 w-3.5 shrink-0 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
