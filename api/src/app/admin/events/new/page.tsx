import { createEvent } from '../../actions';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default function NewEventPage() {
  async function handleCreate(formData: FormData) {
    'use server';
    const result = await createEvent(formData);
    if (result.error) {
      // Re-render with error — for simplicity, redirect with a note
      redirect('/admin/events/new?error=' + encodeURIComponent(result.error));
    }
    redirect('/admin/events');
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link href="/admin/events" className="text-xs text-white/40 hover:text-mustard transition-colors">
          ← Back to Events
        </Link>
        <h2 className="text-xl font-medium tracking-wide text-offwhite mt-3">New Event</h2>
        <p className="text-xs text-white/40 mt-1">Create a new ticketed event.</p>
      </div>

      <form action={handleCreate} className="glass-card rounded-xl p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold tracking-wider text-white/50 uppercase">Title</label>
            <input name="title" required className="custom-input rounded-lg px-3 py-2.5 text-sm" placeholder="e.g. Album Study Night #1" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold tracking-wider text-white/50 uppercase">Slug</label>
            <input name="slug" required pattern="[a-z0-9\-]+" className="custom-input rounded-lg px-3 py-2.5 text-sm font-mono" placeholder="album-study-night-1" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold tracking-wider text-white/50 uppercase">Description</label>
          <textarea name="description" required rows={3} className="custom-input rounded-lg px-3 py-2.5 text-sm resize-y" placeholder="What's this event about?" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold tracking-wider text-white/50 uppercase">Venue</label>
          <input name="venue" required className="custom-input rounded-lg px-3 py-2.5 text-sm" placeholder="e.g. The Studio, Kampala" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold tracking-wider text-white/50 uppercase">Starts At</label>
            <input name="startsAt" type="datetime-local" required className="custom-input rounded-lg px-3 py-2.5 text-sm" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold tracking-wider text-white/50 uppercase">Ends At</label>
            <input name="endsAt" type="datetime-local" required className="custom-input rounded-lg px-3 py-2.5 text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold tracking-wider text-white/50 uppercase">Total Capacity</label>
            <input name="capacity" type="number" min="1" required className="custom-input rounded-lg px-3 py-2.5 text-sm" placeholder="100" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold tracking-wider text-white/50 uppercase">Status</label>
            <select name="status" className="custom-input rounded-lg px-3 py-2.5 text-sm">
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold tracking-wider text-white/50 uppercase">Fornax Code (optional)</label>
            <input name="fornaxCode" className="custom-input rounded-lg px-3 py-2.5 text-sm" placeholder="Merchant code" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold tracking-wider text-white/50 uppercase">Ventus Number (optional)</label>
            <input name="ventusNumber" className="custom-input rounded-lg px-3 py-2.5 text-sm" placeholder="+256..." />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" className="btn-primary text-xs">
            Create Event
          </button>
        </div>
      </form>
    </div>
  );
}
