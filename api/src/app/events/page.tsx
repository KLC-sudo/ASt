export default function EventsListPage() {
  return (
    <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-16">
      <h1 className="font-aicon text-4xl text-offwhite mb-8" style={{ letterSpacing: '-0.05em' }}>
        EVENTS
      </h1>
      <div className="glass-card rounded-xl p-12 text-center">
        <p className="text-white/40 text-sm">No events published yet. Check back soon.</p>
      </div>
    </main>
  );
}
