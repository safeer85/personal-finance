"use client";

import {
  CreditCard,
  Plus,
  UserRound,
  Pencil,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  cardNames,
  estimateInterest,
  remainingMonthlyPayment,
} from "@/lib/debts";
import type { Debt, Entry, MoneyFormatter } from "./types";

type Props = {
  debts: Debt[];
  payments: Entry[];
  date: string;
  money: MoneyFormatter;
  onAdd: (type: "personal" | "credit_card", issuer?: string) => void;
  onEdit: (debt: Debt) => void;
  onPay: (debt: Debt) => void;
  onCharge: (debt: Debt) => void;
  onDelete: (debt: Debt) => void;
};

export function DebtSection({
  debts,
  payments,
  date,
  money,
  onAdd,
  onEdit,
  onPay,
  onCharge,
  onDelete,
}: Props) {
  const cards = debts.filter((debt) => debt.debtType === "credit_card");
  const people = debts.filter((debt) => debt.debtType === "personal");
  const unknown = debts.filter(
    (debt) => !debt.debtType || debt.debtType === "unspecified",
  );
  function debtCard(debt: Debt) {
    const credit = debt.debtType === "credit_card";
    const estimate = credit
      ? estimateInterest(debt.balance, debt.annualRateBps)
      : 0;
    const limit = debt.creditLimit || 0;
    const overdue = debt.balance > 0 && debt.dueDate && debt.dueDate < date;
    return (
      <article key={debt.id} className="space-y-4 rounded-xl border p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge variant="secondary">
            {credit
              ? cardNames[debt.cardIssuer || ""] || "Credit card"
              : debt.debtType === "personal"
                ? "0% interest"
                : "Needs classification"}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Edit ${debt.name}`}
            onClick={() => onEdit(debt)}
          >
            <Pencil className="size-3.5" />
            Details
          </Button>
        </div>
        <div>
          <h3 className="font-medium">{debt.name}</h3>
          <p className="mt-2 break-words text-2xl tracking-tight tabular-nums">
            {money(debt.balance)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Remaining recorded balance
          </p>
        </div>
        <dl className="space-y-2 text-xs">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">
              {credit ? "Statement minimum" : "Monthly repayment target"}
            </dt>
            <dd className="tabular-nums">{money(debt.minimum)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Remaining this month</dt>
            <dd className="tabular-nums">
              {money(remainingMonthlyPayment(debt, payments))}
            </dd>
          </div>
          {debt.dueDate && (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Due date</dt>
              <dd className={overdue ? "font-medium text-destructive" : ""}>
                {debt.dueDate}
                {overdue ? " · past due date" : ""}
              </dd>
            </div>
          )}
          {credit && (
            <>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Annual interest rate</dt>
                <dd>
                  {debt.annualRateBps == null
                    ? "Not set"
                    : `${debt.annualRateBps / 100}%`}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">
                  Estimated interest · next 30 days
                </dt>
                <dd className="tabular-nums">
                  {estimate === null ? "Set your rate" : money(estimate)}
                </dd>
              </div>
            </>
          )}
        </dl>
        {credit && limit > 0 ? (
          <div>
            <div className="mb-2 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
              <span>Credit limit {money(limit)}</span>
              <span>
                {debt.balance > limit
                  ? "Over limit"
                  : `${Math.round((debt.balance / limit) * 100)}% used`}
              </span>
            </div>
            <Progress
              value={Math.min(100, (debt.balance / limit) * 100)}
              aria-label={`${debt.name} credit used`}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Available credit {money(Math.max(0, limit - debt.balance))}
            </p>
          </div>
        ) : (
          <Progress
            value={
              debt.amount > 0
                ? Math.min(
                    100,
                    Math.max(
                      0,
                      ((debt.amount - debt.balance) / debt.amount) * 100,
                    ),
                  )
                : 0
            }
            aria-label={`${debt.name} repayment progress`}
          />
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={debt.balance === 0}
            onClick={() => onPay(debt)}
          >
            Record payment
            <ArrowUpRight />
          </Button>
          {credit && (
            <Button variant="outline" size="sm" onClick={() => onCharge(debt)}>
              Add charge / interest
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-destructive"
            aria-label={`Delete debt ${debt.name}`}
            onClick={() => onDelete(debt)}
          >
            Delete
          </Button>
        </div>
      </article>
    );
  }
  return (
    <section className="space-y-6" aria-label="Debt accounts">
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { name: "Credit card debt", entries: cards, icon: CreditCard },
          {
            name: "Interest-free personal debt",
            entries: people,
            icon: UserRound,
          },
        ].map(({ name, entries, icon: Icon }) => (
          <Card key={name} className="gap-3 shadow-none">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-sm">{name}</CardTitle>
              <Icon className="size-5 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl tabular-nums">
                {money(
                  entries.reduce((total, debt) => total + debt.balance, 0),
                )}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {entries.length}{" "}
                {name === "Credit card debt" ? "cards" : "personal debts"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Credit cards</CardTitle>
          <CardDescription>
            HNB Gold and BOC Gold, each with its own balance, statement minimum,
            rate and due date.
          </CardDescription>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAdd("credit_card", "hnb_gold")}
            >
              <Plus />
              Add HNB Gold
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAdd("credit_card", "boc_gold")}
            >
              <Plus />
              Add BOC Gold
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">{cards.map(debtCard)}</div>
          {!cards.length && (
            <p className="py-5 text-sm text-muted-foreground">
              Enter your HNB balance when ready. You can set up BOC Gold with a
              zero balance before you start using it.
            </p>
          )}
          <p className="mt-5 rounded-lg bg-muted p-3 text-xs leading-relaxed text-muted-foreground">
            Interest is a scenario: recorded balance × annual rate × 30 / 365.
            It assumes the balance is carried for 30 days with no new
            transactions. Fees, grace periods, and bank billing rules can change
            the actual charge. Estimates do not increase your recorded debt or
            reduce monthly cash automatically.
          </p>
        </CardContent>
      </Card>
      <Card className="shadow-none">
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Money owed to people</CardTitle>
            <CardDescription className="mt-2">
              Interest-free debts and the repayments you agree.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => onAdd("personal")}>
            <Plus />
            Add personal debt
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {people.map(debtCard)}
          </div>
          {!people.length && (
            <p className="py-5 text-sm text-muted-foreground">
              Add the person you owe, the amount, and an optional monthly
              repayment.
            </p>
          )}
        </CardContent>
      </Card>
      {unknown.length > 0 && (
        <Card className="border-amber-200 shadow-none">
          <CardHeader>
            <CardTitle>Existing debts to classify</CardTitle>
            <CardDescription>
              Your balances and payment history are preserved. Open Details to
              choose credit card or interest-free personal debt.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {unknown.map(debtCard)}
          </CardContent>
        </Card>
      )}
    </section>
  );
}
