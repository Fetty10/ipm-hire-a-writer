"use client";
// src/app/writer/withdraw/page.tsx

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { StaffLayout } from "@/components/staff/StaffLayout";
import { Card, Input, Button, Spinner } from "@/components/ui";
import toast from "react-hot-toast";

const WRITER_NAV = [
  { label: "Dashboard",     icon: "📊", href: "/writer/dashboard"    },
  { label: "Pending Jobs",  icon: "📋", href: "/writer/jobs/pending"  },
  { label: "Active Jobs",   icon: "✍️", href: "/writer/jobs/active"   },
  { label: "Delivered",     icon: "✅", href: "/writer/jobs/delivered" },
  { label: "Earnings",      icon: "💰", href: "/writer/earnings"      },
  { label: "Withdraw",      icon: "🏦", href: "/writer/withdraw"      },
  { label: "Notifications", icon: "🔔", href: "/writer/notifications" },
  { label: "Profile",       icon: "👤", href: "/writer/profile"       },
];

const BANKS = [
  "GT Bank", "First Bank", "Access Bank", "UBA", "Zenith Bank",
  "Fidelity Bank", "Sterling Bank", "Wema Bank", "Polaris Bank",
  "Union Bank", "Ecobank", "Keystone Bank", "Heritage Bank",
  "Stanbic IBTC", "Standard Chartered", "Citibank",
];

interface Withdrawal {
  id: string; amountNaira: number; status: string;
  bankName: string; requestedAt: string;
}

export default function WriterWithdraw() {
  const { data: session } = useSession();
  const [available,   setAvailable]   = useState(0);
  const [pastWithdrawals, setPastWithdrawals] = useState<Withdrawal[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success,  setSuccess]  = useState(false);

  const [bankName,       setBankName]       = useState("");
  const [accountNumber,  setAccountNumber]  = useState("");
  const [accountName,    setAccountName]    = useState("");
  const [amount,         setAmount]         = useState("");
  const [errors,         setErrors]         = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      const res  = await fetch("/api/staff/earnings");
      const data = await res.json();
      if (data.success) {
        setAvailable(data.data.summary.available);
        setPastWithdrawals(
          (data.data.pendingWithdrawals || []).map((w: any) => ({
            ...w, amountNaira: w.amountKobo / 100,
          }))
        );
      }
      setLoading(false);
    }
    load();
  }, []);

  function validate() {
    const e: Record<string, string> = {};
    if (!bankName)      e.bankName      = "Please select your bank.";
    if (!accountNumber) e.accountNumber = "Account number is required.";
    if (accountNumber.length !== 10) e.accountNumber = "Account number must be 10 digits.";
    if (!accountName)   e.accountName   = "Account name is required.";
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt)) e.amount = "Enter a valid amount.";
    else if (amt < 1000)       e.amount = "Minimum withdrawal is ₦1,000.";
    else if (amt > available)  e.amount = `Maximum is ₦${available.toLocaleString()} (your available balance).`;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/withdrawals", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountKobo:    Math.round(parseFloat(amount) * 100),
          bankName, accountNumber, accountName,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success("Withdrawal request submitted!");
      setSuccess(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const initials = session?.user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "WR";

  return (
    <StaffLayout navItems={WRITER_NAV} role="Writer" initials={initials}>
      <div className="max-w-lg mx-auto">
        <h1 className="font-clash text-2xl font-800 text-navy-DEFAULT tracking-tight mb-1">
          Request Withdrawal
        </h1>
        <p className="text-sm text-navy-muted mb-5">
          Withdraw your available balance to your bank account via Paystack.
        </p>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : (
          <>
            {/* Available balance */}
            <div className="bg-navy-DEFAULT rounded-2xl p-5 text-white mb-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-sky-400/10 rounded-full -translate-y-1/3 translate-x-1/3" />
              <p className="text-xs text-sky-300 uppercase tracking-wider font-700 mb-1">Available Balance</p>
              <p className="font-clash text-3xl font-800 text-white">₦{available.toLocaleString()}</p>
            </div>

            {success ? (
              <Card>
                <div className="text-center py-6">
                  <div className="text-4xl mb-3">🎉</div>
                  <p className="font-700 text-navy-DEFAULT mb-2">Request Submitted!</p>
                  <p className="text-sm text-navy-muted">
                    Admin will review and approve your withdrawal. Once approved, Paystack will
                    automatically transfer the funds to your bank account.
                  </p>
                </div>
              </Card>
            ) : (
              <Card>
                <h2 className="font-clash text-sm font-700 text-navy-DEFAULT mb-4">Bank Details</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                  {/* Bank selector */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-700 text-navy-DEFAULT uppercase tracking-wider">
                      Bank Name
                    </label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-sky-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                    >
                      <option value="">Select your bank</option>
                      {BANKS.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                    {errors.bankName && <p className="text-xs text-red-500">{errors.bankName}</p>}
                  </div>

                  <Input
                    label="Account Number"
                    placeholder="10-digit NUBAN"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    error={errors.accountNumber}
                  />

                  <Input
                    label="Account Name"
                    placeholder="As it appears on your bank account"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    error={errors.accountName}
                  />

                  <Input
                    label="Amount to Withdraw (₦)"
                    type="number"
                    placeholder={`Min. ₦1,000 — Max. ₦${available.toLocaleString()}`}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    error={errors.amount}
                  />

                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-800">
                    ⏱ Admin must approve this request before Paystack auto-transfers funds to your account.
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={submitting}
                    className="w-full"
                    disabled={available < 1000}
                  >
                    Submit Withdrawal Request →
                  </Button>

                  {available < 1000 && (
                    <p className="text-xs text-red-500 text-center">
                      Minimum withdrawal is ₦1,000. Your current balance is ₦{available.toLocaleString()}.
                    </p>
                  )}
                </form>
              </Card>
            )}

            {/* Past withdrawals */}
            {pastWithdrawals.length > 0 && (
              <Card className="mt-4">
                <h2 className="font-clash text-sm font-700 text-navy-DEFAULT mb-3">Recent Requests</h2>
                <div className="flex flex-col gap-2">
                  {pastWithdrawals.map((w) => (
                    <div key={w.id} className="flex items-center justify-between py-2 border-b border-sky-50 last:border-0">
                      <div>
                        <p className="text-sm font-600">₦{w.amountNaira.toLocaleString()}</p>
                        <p className="text-xs text-navy-muted">{w.bankName} · {new Date(w.requestedAt).toLocaleDateString("en-NG")}</p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[.65rem] font-700 ${
                        w.status === "PAID"     ? "bg-green-50 text-green-700"  :
                        w.status === "PENDING"  ? "bg-yellow-50 text-yellow-700" :
                        w.status === "APPROVED" ? "bg-sky-100 text-sky-700"    :
                        "bg-red-50 text-red-700"
                      }`}>
                        {w.status}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </StaffLayout>
  );
}
