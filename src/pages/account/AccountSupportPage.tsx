import { useCallback, useEffect, useState } from "react";
import { Headphones, RefreshCw } from "lucide-react";

import { ModulePage } from "@/components/ModulePage";
import { SupportTicketForm } from "@/components/SupportTicketForm";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

import { useAccountSections } from "./accountShared";

type Ticket = {
  id: string;
  ticket_number: string | null;
  product: string;
  subject: string;
  category: string | null;
  priority: string;
  status: string;
  created_at: string;
};

export function AccountSupportPage() {
  const { user, profile } = useAuth();
  const sections = useAccountSections();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    if (!supabase || !user) {
      setTickets([]);
      return;
    }

    const { data, error } = await supabase
      .from("support_tickets")
      .select(
        "id,ticket_number,product,subject,category,priority,status,created_at",
      )
      .eq("user_id", user.id)
      .eq("product", "datasub")
      .order("created_at", { ascending: false });

    if (error) {
      setNotice(error.message);
      return;
    }

    setTickets((data ?? []) as Ticket[]);
    setNotice("");
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const name =
    [profile?.first_name, profile?.last_name]
      .filter(Boolean)
      .join(" ") ||
    profile?.email ||
    "IHLink DataSub Customer";

  const role =
    profile?.role === "super_admin" ||
    profile?.role === "platform_admin"
      ? "IHLink DataSub Administrator"
      : "IHLink DataSub Customer";

  return (
    <ModulePage
      product="datasub"
      sections={sections}
      title="Customer Support"
      description="Create, review and track support requests for your IHLink DataSub account."
      userName={name}
      userRole={role}
      primaryAction="Support"
    >
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="text-xl font-black">
            Open a support ticket
          </h2>

          <p className="mb-5 mt-2 text-sm text-muted">
            Use this form for DataSub account, access, billing,
            transaction or service assistance.
          </p>

          <SupportTicketForm />
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black">
                My tickets
              </h2>

              <p className="mt-1 text-sm text-muted">
                Track your submitted DataSub support requests.
              </p>
            </div>

            <Button
              size="sm"
              variant="secondary"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={() => void load()}
            >
              Refresh
            </Button>
          </div>

          {notice && (
            <p className="mt-3 text-sm text-rose-600">
              {notice}
            </p>
          )}

          <div className="mt-5 space-y-3">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="rounded-xl border p-4"
              >
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-bold">
                      {ticket.subject}
                    </p>

                    <p className="text-xs text-muted">
                      {ticket.ticket_number ??
                        ticket.id.slice(0, 8)}{" "}
                      · DataSub
                    </p>
                  </div>

                  <span className="text-xs font-bold capitalize">
                    {ticket.status.replaceAll("_", " ")}
                  </span>
                </div>
              </div>
            ))}

            {!tickets.length && !notice && (
              <div className="py-8 text-center text-sm text-muted">
                <Headphones className="mx-auto mb-2 h-8 w-8" />
                No support tickets yet.
              </div>
            )}
          </div>
        </Card>
      </div>
    </ModulePage>
  );
}