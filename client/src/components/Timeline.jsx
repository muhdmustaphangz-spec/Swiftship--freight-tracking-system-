const STEPS = ['Order Placed', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'];

export default function Timeline({ events, currentStatus }) {
  const isCancelled = currentStatus === 'Cancelled';
  const reachedIndex = isCancelled ? -1 : STEPS.indexOf(currentStatus);

  return (
    <div>
      {isCancelled && (
        <div className="mb-5 rounded-md border border-signal-red/30 bg-signal-red-100 px-4 py-3 text-sm text-signal-red font-medium">
          This shipment was cancelled.
        </div>
      )}
      <ol className="relative">
        {STEPS.map((step, i) => {
          const done = i <= reachedIndex;
          const isLast = i === STEPS.length - 1;
          const event = events?.find((e) => e.status === step);
          return (
            <li key={step} className="relative pb-8 last:pb-0 pl-9">
              {!isLast && (
                <span
                  className={`absolute left-[11px] top-6 w-px h-[calc(100%-1rem)] ${
                    done && i < reachedIndex ? 'bg-signal-green' : 'bg-ink-200'
                  }`}
                />
              )}
              <span
                className={`absolute left-0 top-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                  done
                    ? 'bg-signal-green border-signal-green text-white'
                    : 'bg-white border-ink-300 text-ink-400'
                }`}
              >
                {done ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6.5L4.5 9L10 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                )}
              </span>
              <div className={`font-medium ${done ? 'text-ink-950' : 'text-ink-400'}`}>{step}</div>
              {event ? (
                <div className="text-sm text-ink-500 mt-0.5">
                  {event.note && <span>{event.note} · </span>}
                  {new Date(event.created_at).toLocaleString()}
                </div>
              ) : (
                <div className="text-sm text-ink-400 mt-0.5">Pending</div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
