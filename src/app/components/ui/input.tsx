
// components/ui/input.tsx
export function Input(props: React.JSX.IntrinsicAttributes & React.ClassAttributes<HTMLInputElement> & React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="border px-3 py-2 rounded w-full" />;
}