import { ArrowClockwise, WarningCircle } from "@phosphor-icons/react";

export function FeedSkeleton() {
  return (
    <main className="skeleton" aria-label="Đang tải nội dung" aria-busy="true">
      <div className="skeleton__hero" />
      <div className="skeleton__rail">
        {Array.from({ length: 6 }, (_, index) => (
          <div className="skeleton__card" key={index} />
        ))}
      </div>
    </main>
  );
}

export function FeedError({ message }: { message: string }) {
  return (
    <main className="feed-error" role="alert">
      <WarningCircle aria-hidden="true" />
      <h1>Không thể mở NetPhim TV</h1>
      <p>{message}</p>
      <button
        type="button"
        className="primary-button"
        data-tv-focusable="true"
        data-tv-focus-default="true"
        data-focus-id="retry-feed"
        data-focus-row="0"
        onClick={() => window.location.reload()}
      >
        <ArrowClockwise weight="bold" aria-hidden="true" />
        Thử lại
      </button>
    </main>
  );
}
