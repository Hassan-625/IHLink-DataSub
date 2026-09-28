import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const points = [
    "Buy data, airtime and digital services",
    "Manage your wallet and transaction history",
    "Smart Earner, Reseller and Developer API access",
  ];

  return (
    <div className="min-h-screen grid bg-white lg:grid-cols-[45%_55%]">
      <aside className="relative flex min-h-[320px] flex-col justify-between overflow-hidden bg-emerald-950 p-8 text-white lg:min-h-screen lg:p-12">
        <div className="absolute -left-32 bottom-16 h-96 w-96 rounded-full bg-white/10 blur-2xl" />

        <Link to="/" className="relative inline-flex items-center gap-3">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-white p-2 shadow-lg">
            <img
              src="/brand/ihlink-icon.png"
              alt="IHLink DataSub"
              className="h-full w-full object-contain"
            />
          </span>

          <span>
            <strong className="block text-xl">IHLink DataSub</strong>
            <small className="text-white/60">by IHLink Co. Ltd.</small>
          </span>
        </Link>

        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-emerald-300">
            IHLink DataSub
          </p>

          <h2 className="mt-4 text-4xl font-black">
            Smart digital services. Simple, fast and dependable.
          </h2>

          <div className="mt-8 space-y-4">
            {points.map((point) => (
              <p
                key={point}
                className="flex gap-3 text-white/80"
              >
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                {point}
              </p>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/50">
          © 2026 IHLink Co. Ltd. · IHLink DataSub
        </p>
      </aside>

      <main className="grid place-items-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            <img
              src="/brand/ihlink-icon.png"
              className="h-10 w-10 object-contain"
              alt="IHLink DataSub"
            />
            <strong>IHLink DataSub</strong>
          </div>

          <h1 className="text-3xl font-black text-navy-900">
            {title}
          </h1>

          <p className="mb-8 mt-2 text-muted">
            {subtitle}
          </p>

          {children}
        </div>
      </main>
    </div>
  );
}