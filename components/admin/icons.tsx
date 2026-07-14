export function IconGrid({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <rect x="2" y="2" width="7" height="7" rx="1.5" />
      <rect x="11" y="2" width="7" height="7" rx="1.5" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" />
      <rect x="11" y="11" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function IconList({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <rect x="2" y="3" width="16" height="3" rx="1" />
      <rect x="2" y="8.5" width="16" height="3" rx="1" />
      <rect x="2" y="14" width="16" height="3" rx="1" />
    </svg>
  );
}

export function IconUsers({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <circle cx="7" cy="6" r="3" />
      <path d="M1 17c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5v1H1v-1Z" />
      <circle cx="15" cy="7" r="2.3" />
      <path d="M13.6 11.7c2.6.4 4.4 2.3 4.4 5v1.3h-3.2v-1.3c0-1.8-.6-3.3-1.7-4.4Z" />
    </svg>
  );
}

export function IconSparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M10 1l1.8 5.2L17 8l-5.2 1.8L10 15l-1.8-5.2L3 8l5.2-1.8L10 1Z" />
      <path d="M16.5 12l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" />
    </svg>
  );
}

export function IconGear({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.4 2h3.2l.5 2.1c.5.2 1 .4 1.4.7l2-.8 1.6 2.8-1.6 1.4c0 .3.1.5.1.8s0 .5-.1.8l1.6 1.4-1.6 2.8-2-.8c-.4.3-.9.5-1.4.7L11.6 18H8.4l-.5-2.1a5.6 5.6 0 0 1-1.4-.7l-2 .8-1.6-2.8 1.6-1.4a4.9 4.9 0 0 1 0-1.6L2.9 8.8l1.6-2.8 2 .8c.4-.3.9-.5 1.4-.7L8.4 2Zm1.6 10.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
      />
    </svg>
  );
}

export function IconBell({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M10 2a5 5 0 0 0-5 5v2.5L3.5 13h13L15 9.5V7a5 5 0 0 0-5-5Z" />
      <path d="M8 15a2 2 0 0 0 4 0H8Z" />
    </svg>
  );
}

export function IconLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M2 5.5A2.5 2.5 0 0 1 4.5 3h11A2.5 2.5 0 0 1 18 5.5v6A2.5 2.5 0 0 1 15.5 14H9l-4 3v-3H4.5A2.5 2.5 0 0 1 2 11.5v-6Z" />
    </svg>
  );
}

export function IconChevronLeft({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M12 4l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
