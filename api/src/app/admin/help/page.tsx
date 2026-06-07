export default function HelpPage() {
  return (
    <div className="space-y-6 prose prose-invert max-w-none">
      <div>
        <h2 className="text-xl font-medium tracking-wide text-offwhite">Android SMS Gateway Setup</h2>
        <p className="text-xs text-white/40 mt-1">
          Step-by-step guide to install the F-Droid SMS Gateway app on the dedicated Android device.
        </p>
      </div>

      <div className="glass-card rounded-xl p-6 space-y-4 text-sm text-white/70 leading-relaxed">
        <p>
          Full instructions ship in phase 6. For now, the webhook endpoint is live at:
        </p>
        <code className="block bg-black/30 px-3 py-2 rounded text-xs text-mustard">
          POST /api/webhooks/sms-payment
        </code>
        <p>with header <code className="text-mustard">Authorization: Bearer $WEBHOOK_SECRET</code>.</p>
      </div>
    </div>
  );
}
