const STYLES = {
  'Order Placed': 'bg-ink-100 text-ink-700 border-ink-200',
  'Picked Up': 'bg-signal-blue-100 text-signal-blue border-signal-blue/20',
  'In Transit': 'bg-amber-100 text-amber-600 border-amber-500/30',
  'Out for Delivery': 'bg-amber-100 text-amber-600 border-amber-500/30',
  'Delivered': 'bg-signal-green-100 text-signal-green border-signal-green/25',
  'Cancelled': 'bg-signal-red-100 text-signal-red border-signal-red/25',
};

export default function StatusBadge({ status, className = '' }) {
  const style = STYLES[status] || STYLES['Order Placed'];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${style} ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}
