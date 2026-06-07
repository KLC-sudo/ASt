import { prisma } from '@/lib/prisma';
import { formatDate } from '@/lib/format';

export default async function WebhooksPage() {
  const events = await prisma.webhookEvent.findMany({
    orderBy: { processedAt: 'desc' },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-medium tracking-wide text-offwhite">Webhook Log</h2>
        <p className="text-xs text-white/40 mt-1">Inbound SMS payments from the Android device.</p>
      </div>

      {events.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <p className="text-white/40 text-sm">No webhook events yet.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {events.map((e) => (
            <li key={e.id} className="glass-card rounded-lg p-4">
              <div className="flex justify-between items-start text-xs">
                <div className="flex-1 min-w-0">
                  <p className="text-offwhite truncate">{e.smsText ?? '—'}</p>
                  <p className="text-[10px] text-white/40 mt-1 font-mono">{e.payloadHash.slice(0, 16)}…</p>
                </div>
                <span className={`ml-3 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider whitespace-nowrap ${
                  e.result === 'MATCHED' ? 'bg-green-500/10 text-green-400' :
                  e.result === 'DUPLICATE' || e.result === 'ALREADY_PROCESSED' ? 'bg-white/5 text-white/50' :
                  'bg-red-500/10 text-red-400'
                }`}>{e.result}</span>
              </div>
              <p className="text-[10px] text-white/30 mt-2">{formatDate(e.processedAt)} · {e.sourceIp ?? 'unknown IP'}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
