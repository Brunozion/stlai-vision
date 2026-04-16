import Link from "next/link";

export function AppShell({
  title,
  eyebrow,
  children,
  actions,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <main className="page-shell">
      <header className="hero-panel">
        <div className="hero-topline">
          <Link href="/" className="brand-mark">
            STLAI MVP
          </Link>
          <div className="hero-actions">{actions}</div>
        </div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
      </header>
      {children}
    </main>
  );
}
