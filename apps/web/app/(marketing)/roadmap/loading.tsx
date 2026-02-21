export default function RoadmapLoading() {
  return (
    <div className="min-h-screen bg-background">
      <section className="content-wrapper section-padding text-center">
        <div className="h-10 w-48 mx-auto bg-muted rounded animate-pulse mb-6" />
        <div className="h-6 w-72 mx-auto bg-muted rounded animate-pulse mb-8" />
        <div className="max-w-prose mx-auto space-y-4">
          <div className="h-4 w-full bg-muted rounded animate-pulse" />
          <div className="h-4 w-full bg-muted rounded animate-pulse" />
          <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
        </div>
      </section>
      <section className="content-wrapper py-8">
        <div className="h-32 w-full max-w-3xl mx-auto bg-muted rounded-xl animate-pulse" />
      </section>
      <section className="content-wrapper section-padding space-y-8">
        <div className="h-6 w-24 bg-muted rounded animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 w-full bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </section>
    </div>
  );
}
