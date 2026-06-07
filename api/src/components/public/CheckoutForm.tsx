'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  tierId: string;
  pricePerTicket: number;
  merchantCode: string;
  airtelNumber: string;
}

export function CheckoutForm({ tierId, pricePerTicket, merchantCode, airtelNumber }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [form, setForm] = useState({ customerName: '', customerEmail: '', customerPhone: '' });

  const total = pricePerTicket * quantity;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tierId, quantity, ...form }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Could not create order');
        return;
      }
      router.push(`/checkout/${tierId}/pending/${data.reference}`);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="glass-card rounded-2xl p-6 md:p-8 space-y-5">
        <h2 className="text-xs font-semibold tracking-[0.2em] uppercase text-mustard/80 border-b border-white/5 pb-2">
          Buyer details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Full name" required>
            <input
              type="text"
              required
              minLength={2}
              maxLength={120}
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              className="custom-input rounded-xl px-4 py-3 text-sm w-full"
              placeholder="e.g., Sarah Nalwoga"
            />
          </Field>
          <Field label="Phone (for payment confirmation)" required>
            <input
              type="tel"
              required
              minLength={8}
              maxLength={20}
              value={form.customerPhone}
              onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
              className="custom-input rounded-xl px-4 py-3 text-sm w-full"
              placeholder="e.g., 0700 123 456"
            />
          </Field>
          <Field label="Email (for e-ticket)" required full>
            <input
              type="email"
              required
              value={form.customerEmail}
              onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
              className="custom-input rounded-xl px-4 py-3 text-sm w-full"
              placeholder="you@example.com"
            />
          </Field>
        </div>

        <div className="border-t border-white/5 pt-5">
          <Field label="Quantity">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 text-offwhite hover:bg-white/10"
                disabled={quantity <= 1}
              >
                −
              </button>
              <span className="text-2xl font-semibold text-offwhite w-12 text-center">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(Math.min(20, quantity + 1))}
                className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 text-offwhite hover:bg-white/10"
                disabled={quantity >= 20}
              >
                +
              </button>
            </div>
          </Field>
        </div>

        <div className="border-t border-white/5 pt-5 flex justify-between items-center">
          <span className="text-xs tracking-[0.2em] uppercase text-white/50">Total</span>
          <span className="text-3xl font-semibold text-offwhite">
            UGX {total.toLocaleString('en-UG')}
          </span>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 md:p-8 space-y-5">
        <h2 className="text-xs font-semibold tracking-[0.2em] uppercase text-mustard/80 border-b border-white/5 pb-2">
          How to pay
        </h2>
        <ol className="space-y-4 text-sm text-white/70 leading-relaxed">
          <li className="flex gap-4">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-mustard/20 text-mustard text-xs font-bold flex items-center justify-center">1</span>
            <span>
              Dial <code className="text-mustard font-mono">*{merchantCode}#</code> on your MTN line → Merchant Payment
            </span>
          </li>
          <li className="flex gap-4">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-mustard/20 text-mustard text-xs font-bold flex items-center justify-center">2</span>
            <span>
              Enter the <strong className="text-offwhite">amount shown above</strong> and your unique reference (shown on the next screen)
            </span>
          </li>
          <li className="flex gap-4">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-mustard/20 text-mustard text-xs font-bold flex items-center justify-center">3</span>
            <span>
              After paying, your e-ticket will be emailed automatically. Keep this page open to track confirmation.
            </span>
          </li>
        </ol>
        {airtelNumber && (
          <p className="text-xs text-white/40 border-t border-white/5 pt-4">
            Airtel Money users: send <span className="text-offwhite">UGX {total.toLocaleString('en-UG')}</span> to <code className="text-mustard">{airtelNumber}</code> and include your reference in the message.
          </p>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
      )}

      <button type="submit" disabled={isPending} className="btn-primary w-full disabled:opacity-50">
        {isPending ? 'Reserving your reference…' : 'Reserve reference & continue'}
      </button>
    </form>
  );
}

function Field({ label, required, full, children }: { label: string; required?: boolean; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={`flex flex-col gap-2 ${full ? 'md:col-span-2' : ''}`}>
      <label className="text-[11px] font-semibold tracking-wider text-white/50 uppercase">
        {label}{required && <span className="text-mustard ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}
