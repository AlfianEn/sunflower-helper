export function Skeleton({ width, height, count }: { width?: string; height?: string; count?: number }) {
  return (
    <>
      {Array.from({ length: count || 1 }).map((_, i) => (
        <div className="skeleton" key={i} style={{ width: width || '100%', height: height || '20px' }} />
      ))}
    </>
  )
}

export function SkeletonCard() {
  return (
    <div className="card compact">
      <Skeleton width="40%" height="14px" />
      <div style={{ height: 8 }} />
      <Skeleton width="100%" height="24px" />
      <div style={{ height: 8 }} />
      <Skeleton width="80%" height="16px" />
    </div>
  )
}
