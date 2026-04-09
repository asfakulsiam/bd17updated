export function TakaSymbolIcon({ className }: { className?: string }) {
    return (
      <svg
        className={className}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v12" />
        <path d="m8.5 14 7-4" />
        <path d="m8.5 10 7 4" />
      </svg>
    );
  }
  