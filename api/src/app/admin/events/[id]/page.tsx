import { prisma } from '@/lib/prisma';
import { formatDate, formatUGX } from '@/lib/format';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { updateEvent, deleteEvent, addTier, updateTier, deleteTier } from '../../actions';

const statusColors: Record<string, string> = {
  DRAFT: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  PUBLISHED: 'text-green-400 bg-green-400/10 border-green-400/20',
  ARCHIVED: 'text-white/40 bg-white/5 border-white/10',
  SOLD_OUT: 'text-red-400 bg-red-400/10 border-red-400/20',
};

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      tiers: { orderBy: { sortOrder: 'asc' }, include: { _count: { select: { orders: true } } } },
    },
  });

  if (!event) notFound();

  const totalSold = event.tiers.reduce((sum, t) => sum + t.sold, 0);
  const totalCapacity = event.tiers.reduce((sum, t) => sum + t.capacity, 0);
  const totalRevenue = event.tiers.reduce((sum, t) => sum + t.sold * t.priceUGX, 0);

  async function handleDeleteEvent() {
    'use server';
    if (!event) return;
    await deleteEvent(event.id);
  }

  async function handleAddTier(formData: FormData) {
    'use server';
    if (!event) return;
    await addTier(event.id, formData);
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/events" className="text-xs text-white/40 hover:text-mustard transition-colors">
          ← Back to Events
        </Link>
      </div>

      {/* Event Header */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-medium tracking-wide text-offwhite">{event.title}</h2>
            <p className="text-xs text-white/40 mt-1 font-mono">/{event.slug}</p>
          </div>
          <span className={`text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full border ${statusColors[event.status]}`}>
            {event.status}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Venue</p>
            <p className="text-sm text-offwhite mt-1">{event.venue}</p>
          </div>
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Starts</p>
            <p className="text-sm text-offwhite mt-1">{formatDate(event.startsAt)}</p>
          </div>
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Sold</p>
            <p className="text-sm text-offwhite mt-1">{totalSold} / {totalCapacity}</p>
          </div>
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Revenue</p>
            <p className="text-sm text-mustard mt-1 font-medium">{formatUGX(totalRevenue)}</p>
          </div>
        </div>

        {event.description && (
          <p className="text-xs text-white/50 mt-4 leading-relaxed">{event.description}</p>
        )}

        {/* Edit Form */}
        <details className="mt-6">
          <summary className="text-[10px] font-semibold uppercase tracking-wider text-white/40 cursor-pointer hover:text-mustard transition-colors">
            Edit Event Details
          </summary>
          <EditEventForm event={event} />
        </details>

        {/* Delete */}
        <form action={handleDeleteEvent} className="mt-4">
          <button
            type="submit"
            className="text-[10px] font-semibold uppercase tracking-wider text-red-400 border border-red-400/20 px-4 py-2 rounded-lg hover:bg-red-400/10 transition-colors"
            onClick={(e) => { if (!confirm('Delete this event and ALL its tiers and orders?')) e.preventDefault(); }}
          >
            Delete Event
          </button>
        </form>
      </div>

      {/* Ticket Tiers */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-sm font-medium tracking-wide text-offwhite mb-4">Ticket Tiers</h3>

        {event.tiers.length === 0 ? (
          <p className="text-xs text-white/40 mb-4">No tiers yet. Add one below.</p>
        ) : (
          <div className="space-y-3 mb-6">
            {event.tiers.map((tier) => (
              <TierRow key={tier.id} tier={tier} eventId={event.id} />
            ))}
          </div>
        )}

        {/* Add Tier Form */}
        <form action={handleAddTier} className="border-t border-white/5 pt-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/30 mb-3">Add New Tier</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input name="name" required placeholder="Tier name" className="custom-input rounded-lg px-3 py-2 text-sm" />
            <input name="priceUGX" type="number" min="0" required placeholder="Price (UGX)" className="custom-input rounded-lg px-3 py-2 text-sm" />
            <input name="capacity" type="number" min="1" required placeholder="Capacity" className="custom-input rounded-lg px-3 py-2 text-sm" />
          </div>
          <button type="submit" className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-mustard border border-mustard/30 px-4 py-2 rounded-lg hover:bg-mustard/10 transition-colors">
            + Add Tier
          </button>
        </form>
      </div>
    </div>
  );
}

function EditEventForm({ event }: { event: any }) {
  async function handleUpdate(formData: FormData) {
    'use server';
    await updateEvent(event.id, formData);
  }

  return (
    <form action={handleUpdate} className="mt-4 glass-card rounded-lg p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold tracking-wider text-white/40 uppercase">Title</label>
          <input name="title" defaultValue={event.title} required className="custom-input rounded-lg px-3 py-2 text-sm" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold tracking-wider text-white/40 uppercase">Slug</label>
          <input name="slug" defaultValue={event.slug} required pattern="[a-z0-9\-]+" className="custom-input rounded-lg px-3 py-2 text-sm font-mono" />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-semibold tracking-wider text-white/40 uppercase">Description</label>
        <textarea name="description" defaultValue={event.description} required rows={3} className="custom-input rounded-lg px-3 py-2 text-sm resize-y" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-semibold tracking-wider text-white/40 uppercase">Venue</label>
        <input name="venue" defaultValue={event.venue} required className="custom-input rounded-lg px-3 py-2 text-sm" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold tracking-wider text-white/40 uppercase">Starts At</label>
          <input name="startsAt" type="datetime-local" defaultValue={new Date(event.startsAt).toISOString().slice(0, 16)} required className="custom-input rounded-lg px-3 py-2 text-sm" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold tracking-wider text-white/40 uppercase">Ends At</label>
          <input name="endsAt" type="datetime-local" defaultValue={new Date(event.endsAt).toISOString().slice(0, 16)} required className="custom-input rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold tracking-wider text-white/40 uppercase">Capacity</label>
          <input name="capacity" type="number" min="1" defaultValue={event.capacity} required className="custom-input rounded-lg px-3 py-2 text-sm" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold tracking-wider text-white/40 uppercase">Status</label>
          <select name="status" defaultValue={event.status} className="custom-input rounded-lg px-3 py-2 text-sm">
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
            <option value="SOLD_OUT">Sold Out</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold tracking-wider text-white/40 uppercase">Fornax Code</label>
          <input name="fornaxCode" defaultValue={event.fornaxCode ?? ''} className="custom-input rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>
      <div className="flex justify-end">
        <button type="submit" className="btn-primary text-xs">Save Changes</button>
      </div>
    </form>
  );
}

function TierRow({ tier, eventId }: { tier: any; eventId: string }) {
  async function handleUpdateTier(formData: FormData) {
    'use server';
    await updateTier(tier.id, eventId, formData);
  }

  async function handleDeleteTier() {
    'use server';
    await deleteTier(tier.id, eventId);
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
      <form action={handleUpdateTier} className="flex-1 flex items-center gap-3 flex-wrap">
        <input name="name" defaultValue={tier.name} required className="custom-input rounded-lg px-3 py-1.5 text-sm w-40" />
        <input name="priceUGX" type="number" min="0" defaultValue={tier.priceUGX} required className="custom-input rounded-lg px-3 py-1.5 text-sm w-28" />
        <input name="capacity" type="number" min="1" defaultValue={tier.capacity} required className="custom-input rounded-lg px-3 py-1.5 text-sm w-24" />
        <span className="text-[10px] text-white/40">{tier.sold} sold</span>
        <button type="submit" className="text-[10px] font-semibold text-mustard hover:underline">Save</button>
      </form>
      <form action={handleDeleteTier}>
        <button
          type="submit"
          className="text-red-400 text-xs hover:underline"
          onClick={(e) => { if (!confirm('Delete this tier?')) e.preventDefault(); }}
        >
          Delete
        </button>
      </form>
    </div>
  );
}
