// One icon set, 24x24, currentColor, 1.75 stroke. Replaces the emoji that were
// standing in as logo, avatar and icons — those render as a different drawing on
// every OS, which is no good for a brand mark.

type Props = { className?: string };

const base = "h-[1em] w-[1em] shrink-0";

export function LeafMark({ className = "" }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={`${base} ${className}`}>
      <path
        d="M20.5 3.5c0 8.5-4.6 13.2-11.2 13.2-2.1 0-3.9-.5-5.3-1.4C4 9 9.2 4.4 20.5 3.5Z"
        fill="currentColor"
        opacity="0.22"
      />
      <path
        d="M20.5 3.5c0 8.5-4.6 13.2-11.2 13.2-2.1 0-3.9-.5-5.3-1.4C4 9 9.2 4.4 20.5 3.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M3 21c1.2-4.6 4.6-8.2 9.4-10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PhoneIcon({ className = "" }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={`${base} ${className}`}>
      <path
        d="M6.3 3.5h2.4l1.6 4-2 1.3a11.3 11.3 0 0 0 5.4 5.4l1.3-2 4 1.6v2.4a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.3 5.7a2 2 0 0 1 2-2.2Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function WhatsAppIcon({ className = "" }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={`${base} ${className}`}>
      <path
        d="M3.5 20.5 4.8 16A8.2 8.2 0 1 1 8 19.2l-4.5 1.3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M9.2 8.4c.3-.1.6 0 .8.3l.7 1.2c.1.3.1.6-.1.8l-.5.5a5.4 5.4 0 0 0 2.7 2.7l.5-.5c.2-.2.5-.2.8-.1l1.2.7c.3.2.4.5.3.8-.3.8-1.1 1.3-2 1.2A7 7 0 0 1 8 10.4c-.1-.9.4-1.7 1.2-2Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function CheckIcon({ className = "" }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={`${base} ${className}`}>
      <path
        d="m4.5 12.5 5 5 10-11"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ShieldCheckIcon({ className = "" }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={`${base} ${className}`}>
      <path
        d="M12 2.8 20 5.4v6c0 4.6-3.2 8.5-8 9.8-4.8-1.3-8-5.2-8-9.8v-6L12 2.8Z"
        fill="currentColor"
        opacity="0.16"
      />
      <path
        d="M12 2.8 20 5.4v6c0 4.6-3.2 8.5-8 9.8-4.8-1.3-8-5.2-8-9.8v-6L12 2.8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="m8.5 11.8 2.4 2.4 4.6-4.8"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MapPinIcon({ className = "" }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={`${base} ${className}`}>
      <path
        d="M12 21.5c4-4.3 6-7.7 6-10.3a6 6 0 1 0-12 0c0 2.6 2 6 6 10.3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="11" r="2.3" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export function SearchIcon({ className = "" }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={`${base} ${className}`}>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function ArrowRightIcon({ className = "" }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={`${base} ${className}`}>
      <path
        d="M4.5 12h15m0 0-5.5-5.5M19.5 12 14 17.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ArrowLeftIcon({ className = "" }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={`${base} ${className}`}>
      <path
        d="M19.5 12h-15m0 0 5.5-5.5M4.5 12 10 17.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BasketIcon({ className = "" }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={`${base} ${className}`}>
      <path
        d="M3 9.5h18l-1.7 8.2a2 2 0 0 1-2 1.6H6.7a2 2 0 0 1-2-1.6L3 9.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="m8 9.5 2.6-5m4.8 5L12.8 4.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BookmarkIcon({ className = "" }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={`${base} ${className}`}>
      <path
        d="M6.5 3.75h11a1 1 0 0 1 1 1v15.4a.5.5 0 0 1-.77.42L12 16.6l-5.73 3.97a.5.5 0 0 1-.77-.42V4.75a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function UserIcon({ className = "" }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={`${base} ${className}`}>
      <circle cx="12" cy="8" r="3.75" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M4.5 20c.9-3.6 3.8-5.6 7.5-5.6s6.6 2 7.5 5.6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
