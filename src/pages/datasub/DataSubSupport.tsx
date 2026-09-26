import { PageShell } from "@/components/PageShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SupportTicketForm } from "@/components/SupportTicketForm";
import { QuickContact } from "@/components/QuickContact";
import {
  Mail,
  Phone,
  MessageSquare,
  Clock,
  Search,
  FileText,
  ChevronRight,
} from "lucide-react";

const helpCategories = [
  {
    icon: FileText,
    title: "Getting Started",
    desc: "Account setup and wallet funding",
  },
  {
    icon: MessageSquare,
    title: "Transactions",
    desc: "Airtime, data, and bill payments",
  },
  {
    icon: FileText,
    title: "Reseller Program",
    desc: "Discounts, bulk purchases, and referrals",
  },
  {
    icon: FileText,
    title: "API Integration",
    desc: "Developer documentation and webhooks",
  },
];

const popularArticles = [
  "Wallet funding and payment options",
  "What to do when a transaction fails",
  "How to become a reseller",
  "Keeping your transaction PIN secure",
  "Preparing for API integration",
  "Resolving cable TV subscription issues",
];

export function DataSubSupport() {
  return (
    <PageShell product="datasub">
      <section className="py-12 bg-gradient-to-br from-emerald-50 to-sky-50">
        <div className="px-6 lg:px-10 max-w-[1280px] mx-auto text-center">
          <Badge className="mb-3 bg-emerald-50 text-emerald-700 border-emerald-200">
            Support Centre
          </Badge>
          <h1 className="text-3xl font-extrabold text-ink mb-3">
            How Can We Help?
          </h1>
          <p className="text-sm text-muted mb-6 max-w-lg mx-auto">
            Search our knowledge base or contact our support team for
            assistance.
          </p>
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
            <input
              type="text"
              placeholder="Search for help articles..."
              className="w-full pl-12 pr-4 py-3 text-sm rounded-xl border border-border bg-white shadow-card focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>
      </section>

      <section className="py-12 px-6 lg:px-10 max-w-[1280px] mx-auto">
        <QuickContact className="mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {helpCategories.map((c, i) => (
            <Card key={i} padding="lg" hover>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <c.icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-ink mb-1">{c.title}</h3>
              <p className="text-xs text-muted mb-3">{c.desc}</p>
              <div className="flex items-center justify-between">
                <Badge>Help topic</Badge>
                <ChevronRight className="w-4 h-4 text-muted" />
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-7">
            <Card padding="lg">
              <h2 className="text-lg font-bold text-ink mb-4">
                Popular Articles
              </h2>
              <div className="space-y-2">
                {popularArticles.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-gray-50 cursor-pointer"
                  >
                    <span className="text-sm font-medium text-ink">{a}</span>
                    <ChevronRight className="w-4 h-4 text-muted" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
          <div className="col-span-12 lg:col-span-5">
            <Card padding="lg" className="mb-4">
              <h2 className="text-lg font-bold text-ink mb-4">Contact Us</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink">Live Chat</p>
                    <p className="text-xs text-muted">Availability depends on active support channels</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink">Email</p>
                    <a className="text-xs text-muted hover:underline" href="mailto:hassanisahassan12@gmail.com">hassanisahassan12@gmail.com</a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink">Phone</p>
                    <a className="text-xs text-muted hover:underline" href="tel:+2348146676278">0814 667 6278</a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink">Hours</p>
                    <p className="text-xs text-muted">Response times vary by channel and request</p>
                  </div>
                </div>
              </div>
            </Card>
            <Card padding="lg">
              <h2 className="text-lg font-bold text-ink mb-4">
                Send a Message
              </h2>
              <SupportTicketForm
                product="datasub"
                accentClass="bg-emerald-500 hover:bg-emerald-600"
              />
            </Card>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
