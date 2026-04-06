interface StatusIconProps {
  status: 'completed' | 'pending' | 'current';
}

export function StatusIcon({ status }: StatusIconProps) {
  if (status === 'current' || status === 'pending') {
    return (
      <div className="w-[32px] h-[32px] rounded-full bg-[#1E1C21] border-4 border-grey-border flex items-center justify-center"></div>
    );
  }

  return (
    <svg
      width="32"
      height="33"
      viewBox="0 0 32 33"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="16" cy="16.5" r="16" fill="#1E1C21" />
      <path
        d="M16 32.5C7.1632 32.5 0 25.3368 0 16.5C0 7.6632 7.1632 0.5 16 0.5C24.8368 0.5 32 7.6632 32 16.5C32 25.3368 24.8368 32.5 16 32.5ZM16 29.3C19.3948 29.3 22.6505 27.9514 25.051 25.551C27.4514 23.1505 28.8 19.8948 28.8 16.5C28.8 13.1052 27.4514 9.8495 25.051 7.44903C22.6505 5.04857 19.3948 3.7 16 3.7C12.6052 3.7 9.3495 5.04857 6.94903 7.44903C4.54857 9.8495 3.2 13.1052 3.2 16.5C3.2 19.8948 4.54857 23.1505 6.94903 25.551C9.3495 27.9514 12.6052 29.3 16 29.3ZM14.4048 22.9L7.616 16.1112L9.8784 13.8488L14.4048 18.3752L23.4544 9.324L25.7184 11.5864L14.4048 22.9Z"
        fill="#4CAF50"
      />
    </svg>
  );
}
