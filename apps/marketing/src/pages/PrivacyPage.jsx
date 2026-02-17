/**
 * Renders the static privacy policy (public/privacy.html) inside the layout.
 */
export default function PrivacyPage() {
  return (
    <div className="min-h-[60vh] w-full" role="document" aria-label="Privacy Policy">
      <iframe
        src="/privacy.html"
        title="Privacy Policy"
        className="w-full min-h-[70vh] border-0 bg-plot-bg"
      />
    </div>
  );
}
