import { ThemeSync, ThemeToggleStandalone } from '@/components/workspace/ThemeToggle';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 py-16">
      <ThemeSync />
      <div className="absolute right-4 top-4">
        <ThemeToggleStandalone />
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
