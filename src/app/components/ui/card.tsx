// components/ui/card.tsx
export function Card({ children }: { children: React.ReactNode }) {
  return <div className="border rounded-xl shadow-sm bg-white">{children}</div>;
}
