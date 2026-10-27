"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRight,
  ArrowLeftRight,
  CircleDollarSign,
  CreditCard,
  LayoutDashboard,
  Leaf,
  LoaderCircle,
  LogOut,
  Plus,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RecordDialog } from "@/components/finance/record-dialog";
import { ActivityTable } from "@/components/finance/activity-table";
import type { Entry } from "@/components/finance/types";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Transactions", icon: ArrowLeftRight },
  { name: "Income", icon: ArrowDownLeft },
  { name: "Expenses", icon: ArrowUpRight },
  { name: "Savings", icon: CircleDollarSign },
  { name: "Debts", icon: CreditCard },
];
const chartColors = ["#458675", "#99bca9", "#d5ba8d", "#c3b5da", "#df957e"];
const localDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function Dashboard({
  initialDate,
  logoutAction,
}: {
  initialDate: string;
  logoutAction: () => Promise<void>;
}) {
  const [date, setDate] = useState(initialDate),
    [records, setRecords] = useState<Entry[]>([]);
  const [view, setView] = useState("Overview"),
    [month, setMonth] = useState(initialDate.slice(0, 7));
  const [modal, setModal] = useState(false),
    [kind, setKind] = useState("expense");
  const [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false);
  const [currency, setCurrency] = useState("LKR"),
    [deleteTarget, setDeleteTarget] = useState<Entry | null>(null);
  const [deleting, setDeleting] = useState(false),
    [deleteError, setDeleteError] = useState("");
  const money = (value: number) =>
    new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value / 100);

  async function refresh() {
    try {
      const response = await fetch("/api/records", { cache: "no-store" });
      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }
      if (!response.ok) throw Error("Could not load records. Please retry.");
      setRecords(await response.json());
      setError("");
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    const current = localDate();
    setDate(current);
    setMonth(current.slice(0, 7));
    void refresh();
    try {
      const saved = localStorage.getItem("pocket-currency");
      if (saved && ["LKR", "USD", "EUR", "GBP", "INR"].includes(saved))
        setCurrency(saved);
    } catch {
      /* Browser storage is optional. */
    }
  }, []);

  const actual = records.filter((record) => record.date <= date),
    current = actual.filter((record) => record.date.startsWith(month));
  const sum = (entries: Entry[], type: string) =>
    entries
      .filter((record) => record.kind === type)
      .reduce((total, record) => total + record.amount, 0);
  const income = sum(current, "income"),
    expenses = sum(current, "expense"),
    savings = sum(current, "saving"),
    payments = sum(current, "payment");
  const debts = actual
    .filter((record) => record.kind === "debt")
    .map((debt) => ({
      ...debt,
      balance: Math.max(
        0,
        debt.amount -
          actual
            .filter(
              (payment) =>
                payment.kind === "payment" && payment.category === debt.id,
            )
            .reduce((total, payment) => total + payment.amount, 0),
      ),
    }));
  const debtTotal = debts.reduce((total, debt) => total + debt.balance, 0),
    available = Math.max(0, income - expenses - savings - payments),
    capacity = Math.min(debtTotal, available);
  const minimum = debts.reduce(
    (total, debt) =>
      total +
      Math.max(
        0,
        Math.min(debt.minimum, debt.balance) -
          current
            .filter(
              (payment) =>
                payment.kind === "payment" && payment.category === debt.id,
            )
            .reduce((paid, payment) => paid + payment.amount, 0),
      ),
    0,
  );
  const selected = (
    {
      Income: "income",
      Expenses: "expense",
      Savings: "saving",
      Debts: "debt",
    } as Record<string, string>
  )[view];
  const visible = records.filter(
    (record) =>
      (selected ? record.kind === selected : record.kind !== "debt") &&
      record.date.startsWith(month),
  );
  const categories = Object.entries(
    current
      .filter((record) => record.kind === "expense")
      .reduce(
        (totals, record) => {
          totals[record.category] =
            (totals[record.category] || 0) + record.amount;
          return totals;
        },
        {} as Record<string, number>,
      ),
  ).sort((a, b) => b[1] - a[1]);

  function open(type = "expense") {
    setKind(type);
    setError("");
    setModal(true);
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          name: form.get("name"),
          category: form.get("category"),
          date: form.get("date"),
          amount: Number(form.get("amount")),
          minimum: Number(form.get("minimum") || 0),
          target: Number(form.get("target") || 0),
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw Error(result.error || "Could not save this record.");
      setModal(false);
      await refresh();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const response = await fetch(`/api/records?id=${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!response.ok)
        throw Error("Could not delete this record. Please try again.");
      setDeleteTarget(null);
      await refresh();
    } catch (error) {
      setDeleteError((error as Error).message);
    } finally {
      setDeleting(false);
    }
  }
  function requestDelete(record: Entry) {
    setDeleteError("");
    setDeleteTarget(record);
  }
  const stats = [
    {
      name: "Monthly income",
      value: income,
      icon: ArrowDownLeft,
      color: "bg-emerald-50 text-emerald-700",
      note: `All-time income ${money(sum(actual, "income"))}`,
    },
    {
      name: "Monthly expenses",
      value: expenses,
      icon: ArrowUpRight,
      color: "bg-orange-50 text-orange-700",
      note: `${current.filter((record) => record.kind === "expense").length} expenses recorded this month`,
    },
    {
      name: "Savings contributed",
      value: savings,
      icon: CircleDollarSign,
      color: "bg-violet-50 text-violet-700",
      note: `Total set aside ${money(sum(actual, "saving"))}`,
    },
    {
      name: "Outstanding debt",
      value: debtTotal,
      icon: CreditCard,
      color: "bg-amber-50 text-amber-700",
      note: `${debts.filter((debt) => debt.balance > 0).length} active debts · ${money(payments)} paid this month`,
    },
  ];

  return (
    <div className="min-h-dvh lg:pl-60">
      <aside className="border-b bg-card p-5 lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-60 lg:flex-col lg:border-r lg:border-b-0 lg:p-6">
        <a
          href="/"
          aria-label="Pocket home"
          className="flex items-center gap-2 text-3xl font-bold tracking-tight"
        >
          <Leaf className="size-8 text-primary" />
          pocket<span className="-ml-2 text-primary">.</span>
        </a>
        <p className="mt-12 mb-4 hidden text-[10px] font-medium tracking-[0.18em] text-muted-foreground lg:block">
          PERSONAL WORKSPACE
        </p>
        <nav
          aria-label="Main navigation"
          className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:mt-0 lg:grid lg:pb-0"
        >
          {navigation.map(({ name, icon: Icon }) => (
            <Button
              key={name}
              variant={view === name ? "secondary" : "ghost"}
              className={cn(
                "justify-start lg:w-full",
                view !== name && "text-muted-foreground",
              )}
              aria-current={view === name ? "page" : undefined}
              onClick={() => setView(name)}
            >
              <Icon className="size-4" />
              {name}
              {name === "Debts" && debts.some((debt) => debt.balance > 0) && (
                <Badge
                  variant="outline"
                  className="ml-auto hidden lg:inline-flex"
                >
                  {debts.filter((debt) => debt.balance > 0).length}
                </Badge>
              )}
            </Button>
          ))}
        </nav>
        <div className="mt-auto hidden pt-12 lg:block">
          <div className="rounded-2xl bg-[#f2f3e9] p-5">
            <Sparkles className="size-5 text-[#85995e]" />
            <p className="mt-3 font-serif text-2xl leading-tight">
              A little clarity.
              <br />A lot more freedom.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Every entry is a step toward your financial goals.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-3 border-t pt-6">
            <span className="grid size-9 place-items-center rounded-full bg-[#e9dfca] text-xs font-semibold">
              Y
            </span>
            <div>
              <p className="text-xs font-medium">Your workspace</p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Private owner account
              </p>
            </div>
          </div>
        </div>
      </aside>
      <main className="min-w-0">
        <header className="flex min-h-18 flex-wrap items-center justify-between gap-3 border-b bg-card px-5 py-4 sm:px-8 xl:px-10">
          <p className="text-xs text-muted-foreground">
            Your workspace <span className="mx-3 text-border">/</span>
            <span className="font-medium text-foreground">{view}</span>
          </p>
          <div className="flex items-center gap-3">
            <Select
              value={currency}
              onValueChange={(value) => {
                setCurrency(value);
                try {
                  localStorage.setItem("pocket-currency", value);
                } catch {
                  /* Storage is optional. */
                }
              }}
            >
              <SelectTrigger
                aria-label="Display currency"
                size="sm"
                className="w-23"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["LKR", "USD", "EUR", "GBP", "INR"].map((code) => (
                  <SelectItem key={code} value={code}>
                    {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <form action={logoutAction}>
              <Button type="submit" variant="ghost" size="sm">
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Sign out</span>
                <span className="sr-only sm:hidden">Sign out</span>
              </Button>
            </form>
          </div>
        </header>
        <div className="mx-auto max-w-400 space-y-6 p-5 sm:p-8 xl:p-10">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.2em] text-primary">
                MAKE ROOM FOR WHAT MATTERS
              </p>
              <h1 className="mt-3 font-serif text-3xl tracking-tight sm:text-4xl">
                {view === "Overview" ? "Your money, at a glance." : view}
              </h1>
              <p className="mt-3 text-sm text-muted-foreground">
                A clearer picture today. A little more possibility tomorrow.
              </p>
            </div>
            <Button onClick={() => open(selected || "expense")}>
              <Plus />
              Add record
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Label
                htmlFor="selected-month"
                className="text-xs text-muted-foreground"
              >
                Viewing
              </Label>
              <Input
                id="selected-month"
                aria-label="Selected month"
                type="month"
                value={month}
                onChange={(event) =>
                  setMonth(event.target.value || date.slice(0, 7))
                }
                className="h-9 w-43 bg-card text-xs"
              />
            </div>
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5 text-primary" />
              Saved in your private database
            </span>
          </div>
          {error && !modal && (
            <div
              role="alert"
              className="flex items-center justify-between gap-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
            >
              {error}
              <Button variant="ghost" size="sm" onClick={() => void refresh()}>
                Retry
              </Button>
            </div>
          )}
          <section
            aria-label="Financial summary"
            className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-2 xl:grid-cols-4"
          >
            {stats.map(({ name, value, icon: Icon, color, note }) => (
              <Card key={name} className="gap-0 py-5 shadow-none">
                <CardContent className="px-5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">{name}</p>
                    <span
                      className={cn(
                        "grid size-8 shrink-0 place-items-center rounded-lg",
                        color,
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                  </div>
                  <p className="mt-5 break-words text-2xl font-medium tracking-tight tabular-nums">
                    {money(value)}
                  </p>
                  <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                    {note}
                  </p>
                </CardContent>
              </Card>
            ))}
          </section>
          {(view === "Overview" || view === "Debts") && (
            <section className="grid gap-6 xl:grid-cols-2">
              <Card className="gap-0 border-[#dce5d8] bg-[#eaf0e7] shadow-none">
                <CardContent className="px-6 sm:px-8">
                  <div className="flex items-center justify-between text-primary">
                    <p className="text-[10px] font-semibold tracking-[0.18em]">
                      YOUR MONTHLY DEBT PLAN
                    </p>
                    <Sparkles className="size-5" />
                  </div>
                  <h2 className="mt-5 font-serif text-3xl leading-tight text-[#3e5f48]">
                    Make progress,
                    <br />
                    with breathing room.
                  </h2>
                  <p className="mt-6 text-xs text-muted-foreground">
                    Available for additional debt payments
                  </p>
                  <p className="mt-2 break-words text-4xl tracking-tight text-primary tabular-nums">
                    {money(capacity)}
                  </p>
                  <dl className="mt-6 space-y-3 text-xs">
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Income</dt>
                      <dd className="tabular-nums">{money(income)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">
                        Expenses + savings + debt paid
                      </dt>
                      <dd className="shrink-0 tabular-nums">
                        − {money(expenses + savings + payments)}
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-5 border-t border-[#d4dece] pt-4 text-xs text-muted-foreground">
                    {minimum > available
                      ? "Your remaining minimums exceed available cash. Review your plan."
                      : `Remaining minimum payments: ${money(minimum)}`}
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => open("payment")}
                    disabled={!debts.some((debt) => debt.balance > 0)}
                  >
                    Record a debt payment
                    <ArrowUpRight />
                  </Button>
                  <p className="mt-3 max-w-md text-[11px] leading-relaxed text-muted-foreground">
                    Based on entries through today in the selected month. Future
                    income and unrecorded bills are excluded.
                  </p>
                </CardContent>
              </Card>
              <Card className="shadow-none">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle>Where your money goes</CardTitle>
                    <span className="text-xs text-muted-foreground">
                      This month
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {categories.length > 0 ? (
                    <>
                      <div className="grid place-items-center py-3">
                        <div
                          role="img"
                          aria-label={`Spending by category, total ${money(expenses)}`}
                          className="grid size-48 place-items-center rounded-full"
                          style={{
                            background: `conic-gradient(${categories
                              .map((category, index) => {
                                const start =
                                  (categories
                                    .slice(0, index)
                                    .reduce(
                                      (total, item) => total + item[1],
                                      0,
                                    ) /
                                    expenses) *
                                  100;
                                return `${chartColors[index % chartColors.length]} ${start}% ${start + (category[1] / expenses) * 100}%`;
                              })
                              .join(",")})`,
                          }}
                        >
                          <div className="flex size-38 flex-col items-center justify-center gap-3 rounded-full bg-card">
                            <span className="text-[9px] tracking-widest text-muted-foreground">
                              TOTAL SPENT
                            </span>
                            <strong className="max-w-34 break-words text-center text-lg font-medium tabular-nums">
                              {money(expenses)}
                            </strong>
                          </div>
                        </div>
                      </div>
                      <div className="mt-5 space-y-3">
                        {categories.map(([name, amount], index) => (
                          <div
                            key={name}
                            className="flex justify-between gap-3 text-xs"
                          >
                            <span className="flex items-center gap-2 text-muted-foreground">
                              <span
                                className="size-2 shrink-0 rounded-full"
                                style={{
                                  background:
                                    chartColors[index % chartColors.length],
                                }}
                              />
                              {name}
                            </span>
                            <span className="shrink-0 tabular-nums">
                              {money(amount)}
                              <span className="ml-3 text-muted-foreground">
                                {Math.round((amount / expenses) * 100)}%
                              </span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex min-h-72 flex-col items-center justify-center px-3 text-center">
                      <CircleDollarSign className="size-10 text-primary/50" />
                      <h3 className="mt-5 font-medium">
                        See the shape of your spending
                      </h3>
                      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                        Add an expense to see your category breakdown.
                      </p>
                      <Button
                        variant="ghost"
                        className="mt-4 text-primary"
                        onClick={() => open("expense")}
                      >
                        Add your first expense
                        <ArrowUpRight />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
          )}
          {(view === "Savings" || view === "Debts") && (
            <Card className="shadow-none">
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle>
                  {view === "Savings"
                    ? "Your savings goals"
                    : "Your debt balances"}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => open(selected)}
                >
                  <Plus />
                  Add {selected}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                  {(view === "Debts"
                    ? debts
                    : records.filter((record) => record.kind === "saving")
                  ).map((record) => {
                    const balance =
                      "balance" in record
                        ? Number(record.balance)
                        : record.amount;
                    const progress =
                      record.kind === "debt"
                        ? ((record.amount - balance) / record.amount) * 100
                        : (record.amount / (record.target || record.amount)) *
                          100;
                    return (
                      <div key={record.id} className="rounded-xl border p-5">
                        <Badge variant="secondary" className="font-normal">
                          {record.category}
                        </Badge>
                        <h3 className="mt-4 font-medium">{record.name}</h3>
                        <p className="mt-3 text-2xl tracking-tight tabular-nums">
                          {money(balance)}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {record.kind === "debt"
                            ? `${money(record.minimum)} minimum / month`
                            : `${money(record.target)} goal`}
                        </p>
                        <Progress
                          aria-label={`${record.name} progress`}
                          value={Math.min(100, progress)}
                          className="mt-5 h-2"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-3 text-destructive"
                          onClick={() => requestDelete(record)}
                        >
                          Delete
                        </Button>
                      </div>
                    );
                  })}
                </div>
                {(view === "Debts"
                  ? debts.length
                  : records.filter((record) => record.kind === "saving")
                      .length) === 0 && (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Your {view.toLowerCase()} will appear here when you add a
                    record.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
          <Card className="overflow-hidden shadow-none">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
              <div>
                <CardTitle>
                  {view === "Overview" ? "Recent activity" : `${view} records`}
                </CardTitle>
                <CardDescription className="mt-2">
                  Your financial story, one entry at a time.
                </CardDescription>
              </div>
              {view === "Overview" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setView("Transactions")}
                >
                  View all transactions
                  <ArrowRight />
                </Button>
              )}
            </CardHeader>
            <CardContent className="px-0">
              <ActivityTable
                records={view === "Overview" ? visible.slice(0, 6) : visible}
                allRecords={records}
                date={date}
                money={money}
                onDelete={requestDelete}
              />
              {visible.length === 0 && (
                <div className="flex flex-col items-center px-5 py-12 text-center">
                  {loading ? (
                    <LoaderCircle className="size-8 animate-spin text-primary/60" />
                  ) : (
                    <Wallet className="size-9 text-primary/50" />
                  )}
                  <h3 className="mt-4 font-medium">
                    {loading
                      ? "Loading your records…"
                      : "A fresh start for your finances"}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Add a record to begin tracking this month.
                  </p>
                  {!loading && (
                    <Button
                      variant="ghost"
                      className="mt-4 text-primary"
                      onClick={() => open(selected || "income")}
                    >
                      <Plus />
                      Add your first record
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          <footer className="flex flex-wrap justify-between gap-2 pb-3 text-[11px] text-muted-foreground">
            <span>Pocket · Small steps. Stronger finances.</span>
            <span>Your finances, privately stored.</span>
          </footer>
        </div>
      </main>
      <RecordDialog
        open={modal}
        onOpenChange={(open) => {
          if (!busy) setModal(open);
        }}
        kind={kind}
        onKindChange={setKind}
        currency={currency}
        date={date}
        debts={debts}
        money={money}
        busy={busy}
        error={error}
        onSubmit={save}
      />
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this record?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleteTarget?.name}” will be permanently deleted.
              {deleteTarget?.kind === "debt" &&
                " Its linked payments will also be deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p role="alert" className="text-sm text-destructive">
              {deleteError}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault();
                void remove();
              }}
            >
              {deleting && <LoaderCircle className="animate-spin" />}
              {deleting ? "Deleting…" : "Delete record"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
