/**
 * Inline loading indicator: pulsing dot + message.
 * Matches route loading aesthetic for on-screen actions (create cycle, switch cycle, etc.).
 */
export function InlineLoading({ message }: { message: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <span
        className="loading-pulse h-2 w-2 shrink-0 rounded-full bg-primary"
        aria-hidden
      />
      <span>{message}</span>
    </span>
  );
}
