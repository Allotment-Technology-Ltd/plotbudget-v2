/**
 * Renders the static terms of service (public/terms.html) inside the layout.
 */
export default function TermsPage() {
  return (
    <div className="min-h-[60vh] w-full" role="document" aria-label="Terms of Service">
      <iframe
        src="/terms.html"
        title="Terms of Service"
        className="w-full min-h-[70vh] border-0 bg-plot-bg"
      />
    </div>
  );
}
