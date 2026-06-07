'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface OrderStatus {
  reference: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
}

export function PendingPoller({ reference }: { reference: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus['status']>('PENDING');
  const [secondsLeft, setSecondsLeft] = useState(600);

  useEffect(() => {
    let cancelled = false;
    let backoff = 5000;

    async function poll() {
      if (cancelled) return;
      try {
        const res = await fetch(`/api/orders/${reference}`, { cache: 'no-store' });
        if (res.ok) {
          const data: OrderStatus = await res.json();
          setStatus(data.status);
          if (data.status === 'PAID') {
            router.push(`/order/${reference}`);
            return;
          }
          if (data.status === 'FAILED' || data.status === 'CANCELLED') {
            return;
          }
        }
      } catch {
        // network blip — keep polling
      }
      backoff = Math.min(backoff + 2000, 15000);
      setTimeout(poll, backoff);
    }

    const tick = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    poll();
    return () => { cancelled = true; clearInterval(tick); };
  }, [reference, router]);

  if (status === 'FAILED' || status === 'CANCELLED') {
    return (
      <div className="mt-6 glass-card rounded-2xl p-6 text-center border-red-500/20">
        <p className="text-red-400 font-medium">Order {status.toLowerCase()}</p>
        <p className="text-xs text-white/50 mt-2">
          If you believe this is an error, contact us with reference {reference}.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 glass-card rounded-2xl p-6 flex items-center gap-4">
      <div className="flex-shrink-0 w-3 h-3 rounded-full bg-mustard animate-pulse"></div>
      <div className="flex-1">
        <p className="text-sm text-offwhite">Waiting for payment confirmation…</p>
        <p className="text-[11px] text-white/40 mt-1">
          Auto-checking every few seconds. You can keep this page open or close it and check back with your reference.
        </p>
      </div>
      <span className="text-xs text-white/30 font-mono tabular-nums">
        {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
      </span>
    </div>
  );
}
