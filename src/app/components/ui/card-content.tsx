
export function CardContent({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-4 text-black ${className}`}>{children}</div>;
}