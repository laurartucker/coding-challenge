// components/ui/button.tsx
export function Button({ children, ...props }: { children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className="bg-black font-bold text-white px-5 py-3 rounded hover:bg-pink-500 transition-colors duration-200"
      {...props}
    >
      {children}
    </button>
  );
}