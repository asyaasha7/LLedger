export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 py-16 text-ink">
      {children}
    </div>
  );
}
