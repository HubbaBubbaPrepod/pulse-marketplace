export default function Loading() {
  return (
    <div className="page-container theme-loading" role="status" aria-label="Loading themes">
      <div className="theme-skeleton theme-skeleton-title" />
      <div className="theme-skeleton theme-skeleton-preview" />
      <div className="theme-skeleton theme-skeleton-title" />
      <div className="theme-loading-grid">
        {[0, 1, 2].map((x) => (
          <div className="theme-skeleton theme-skeleton-card" key={x} />
        ))}
      </div>
    </div>
  );
}
