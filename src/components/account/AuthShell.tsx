import Link from "next/link";
import { ChevronRight, Leaf, PackageCheck, Truck, Zap } from "lucide-react";
import { container } from "@/lib/ui";

const perks = [
  { icon: Zap, title: "Faster checkout", text: "Your name, number and address are filled in for you." },
  { icon: PackageCheck, title: "Track every order", text: "See status and details of all your orders in one place." },
  { icon: Truck, title: "Delivery across Bangladesh", text: "Cash on delivery, bKash, Nagad or card." },
];

/** Two-panel layout shared by the login and sign-up pages. */
export function AuthShell({ title, subtitle, crumb, children }: { title: string; subtitle: string; crumb: string; children: React.ReactNode }) {
  return (
    <main className={`${container} flex-1 pt-4 pb-12 lg:pt-6`}>
      <nav aria-label="Breadcrumb" className="mb-6 text-xs">
        <Link href="/" className="font-semibold text-brand hover:underline">
          Home
        </Link>
        <ChevronRight className="mx-1.5 inline size-3 text-body" />
        <span className="text-body">{crumb}</span>
      </nav>

      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-line bg-white shadow-[0_30px_60px_-30px_rgba(37,61,78,0.35)] lg:grid-cols-[1fr_1.15fr]">
        {/* Brand panel */}
        <div className="relative hidden overflow-hidden bg-linear-to-br from-brand via-brand-dark to-[#0b5f64] p-10 text-white lg:block">
          <div className="absolute -top-20 -right-20 size-64 rounded-full bg-white/10" aria-hidden="true" />
          <div className="absolute -bottom-24 -left-16 size-72 rounded-full bg-white/5" aria-hidden="true" />
          <div className="relative">
            <span className="grid size-12 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/20">
              <Leaf className="size-6" />
            </span>
            <h2 className="mt-6 text-3xl leading-tight font-bold">Healthy shopping, made simple.</h2>
            <p className="mt-3 text-sm text-white/80">Create a free account to order faster and keep track of everything you buy.</p>
            <ul className="mt-10 space-y-6">
              {perks.map(({ icon: Icon, title: t, text }) => (
                <li key={t} className="flex gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/15">
                    <Icon className="size-5" />
                  </span>
                  <span>
                    <span className="block font-bold">{t}</span>
                    <span className="text-sm text-white/75">{text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 sm:p-10">
          <h1 className="text-2xl font-bold text-heading sm:text-3xl">{title}</h1>
          <p className="mt-1.5 mb-7 text-sm text-body">{subtitle}</p>
          {children}
        </div>
      </div>
    </main>
  );
}
