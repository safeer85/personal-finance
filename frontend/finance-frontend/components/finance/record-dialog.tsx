"use client";

import { useState, type FormEvent } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Debt, Entry, MoneyFormatter } from "./types";
import { cardNames } from "@/lib/debts";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: string;
  onKindChange: (kind: string) => void;
  currency: string;
  date: string;
  debts: Debt[];
  money: MoneyFormatter;
  busy: boolean;
  error: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  editingDebt?: Entry | null;
  initialDebtType?: "personal" | "credit_card";
  initialCardIssuer?: string;
  paymentDebtId?: string;
};

export function RecordDialog(props: Props) {
  const { kind, busy } = props;
  const editing = props.editingDebt;
  const [debtType, setDebtType] = useState(
    editing?.debtType || props.initialDebtType || "personal",
  );
  const [issuer, setIssuer] = useState(
    editing?.cardIssuer || props.initialCardIssuer || "hnb_gold",
  );
  const credit = kind === "debt" && debtType === "credit_card";
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent
        className="max-h-[90dvh] overflow-y-auto sm:max-w-lg"
        onEscapeKeyDown={(event) => {
          if (busy) event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          if (busy) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">
            {editing ? "Edit debt details" : "Add a record"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Update debt terms without changing the opening balance or payment history."
              : "Give every part of your money a place."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={props.onSubmit} className="space-y-5">
          <fieldset disabled={busy} className="space-y-5 disabled:opacity-70">
            <div className="space-y-2">
              <Label htmlFor="record-kind">Record type</Label>
              <Select
                value={kind}
                onValueChange={props.onKindChange}
                disabled={busy}
                name="kind"
              >
                <SelectTrigger
                  id="record-kind"
                  className="w-full"
                  disabled={Boolean(editing)}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "income",
                    "expense",
                    "saving",
                    "debt",
                    "payment",
                    "card_charge",
                  ].map((value) => (
                    <SelectItem key={value} value={value}>
                      {value === "card_charge"
                        ? "Card charge / interest"
                        : value === "payment"
                          ? "Debt payment"
                          : value[0].toUpperCase() + value.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {kind === "debt" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="debt-type">Debt type</Label>
                  <Select
                    name="debtType"
                    value={debtType}
                    onValueChange={(value) =>
                      setDebtType(value as typeof debtType)
                    }
                  >
                    <SelectTrigger id="debt-type" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">
                        Personal debt — no interest
                      </SelectItem>
                      <SelectItem value="credit_card">Credit card</SelectItem>
                      {debtType === "unspecified" && (
                        <SelectItem value="unspecified" disabled>
                          Choose a debt type
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {credit && (
                  <div className="space-y-2">
                    <Label htmlFor="card-issuer">Credit card</Label>
                    <Select
                      name="cardIssuer"
                      value={issuer}
                      onValueChange={setIssuer}
                    >
                      <SelectTrigger id="card-issuer" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hnb_gold">HNB Gold</SelectItem>
                        <SelectItem value="boc_gold">BOC Gold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="record-name">
                {kind === "debt" && !credit
                  ? "Person / description"
                  : "Description"}
              </Label>
              <Input
                key={kind === "debt" ? `${debtType}:${issuer}` : "name"}
                id="record-name"
                name="name"
                defaultValue={
                  editing?.name || (credit ? cardNames[issuer] : "")
                }
                placeholder={
                  kind === "debt" ? "e.g. Personal loan" : "e.g. Monthly salary"
                }
                required
                maxLength={100}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="record-amount">
                  {kind === "debt" ? "Opening balance" : "Amount"} (
                  {props.currency})
                </Label>
                <Input
                  id="record-amount"
                  name="amount"
                  type="number"
                  inputMode="decimal"
                  min={credit ? "0" : "0.01"}
                  defaultValue={editing ? editing.amount / 100 : undefined}
                  readOnly={Boolean(editing)}
                  max="20000000"
                  step="0.01"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="record-date">Date</Label>
                <Input
                  id="record-date"
                  name="date"
                  type="date"
                  defaultValue={editing?.date || props.date}
                  readOnly={Boolean(editing)}
                  required
                />
              </div>
            </div>
            {kind === "debt" ? (
              <input
                type="hidden"
                name="category"
                value={
                  editing?.category ||
                  (credit ? cardNames[issuer] : "Interest-free personal debt")
                }
              />
            ) : (
              <div className="space-y-2">
                <Label htmlFor="record-category">
                  {kind === "payment"
                    ? "Debt"
                    : kind === "card_charge"
                      ? "Credit card account"
                      : "Category"}
                </Label>
                {kind === "payment" || kind === "card_charge" ? (
                  <Select
                    key="debt-category"
                    name="category"
                    required
                    disabled={busy}
                    defaultValue={props.paymentDebtId}
                  >
                    <SelectTrigger id="record-category" className="w-full">
                      <SelectValue placeholder="Select a debt" />
                    </SelectTrigger>
                    <SelectContent>
                      {props.debts
                        .filter((debt) =>
                          kind === "card_charge"
                            ? debt.debtType === "credit_card"
                            : debt.balance > 0,
                        )
                        .map((debt) => (
                          <SelectItem key={debt.id} value={debt.id}>
                            {debt.name} · {props.money(debt.balance)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    key="text-category"
                    id="record-category"
                    name="category"
                    placeholder={
                      kind === "expense"
                        ? "e.g. Food & groceries"
                        : kind === "saving"
                          ? "e.g. Emergency fund"
                          : "e.g. Salary, loan, freelance"
                    }
                    required
                    maxLength={100}
                    list="record-categories"
                  />
                )}
                <datalist id="record-categories">
                  {[
                    "Salary",
                    "Freelance",
                    "Food & groceries",
                    "Transport",
                    "Housing",
                    "Utilities",
                    "Shopping",
                    "Health",
                    "Emergency fund",
                    "Travel",
                  ].map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
              </div>
            )}
            {kind === "debt" && (
              <div className="space-y-2">
                <Label htmlFor="record-minimum">
                  {credit
                    ? "Statement minimum payment"
                    : "Planned monthly repayment"}
                </Label>
                <Input
                  id="record-minimum"
                  name="minimum"
                  type="number"
                  min="0"
                  max="20000000"
                  step="0.01"
                  defaultValue={editing ? editing.minimum / 100 : 0}
                  required
                />
              </div>
            )}
            {kind === "debt" && (
              <>
                {credit && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="credit-limit">
                        Credit limit (optional)
                      </Label>
                      <Input
                        id="credit-limit"
                        name="creditLimit"
                        type="number"
                        min="0"
                        max="20000000"
                        step=".01"
                        defaultValue={(editing?.creditLimit || 0) / 100}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="annual-rate">
                        Annual interest rate (% p.a.)
                      </Label>
                      <Input
                        id="annual-rate"
                        name="annualRate"
                        type="number"
                        min="0"
                        max="100"
                        step=".01"
                        required
                        defaultValue={
                          editing?.annualRateBps != null
                            ? editing.annualRateBps / 100
                            : undefined
                        }
                        placeholder="From your statement"
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="debt-due-date">
                    {credit
                      ? "Payment due date (optional)"
                      : "Agreed due date (optional)"}
                  </Label>
                  <Input
                    id="debt-due-date"
                    name="dueDate"
                    type="date"
                    defaultValue={editing?.dueDate || ""}
                  />
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {credit
                    ? "Use your statement rate and minimum. The app estimates 30 days of simple interest if the balance is carried, without new transactions. Bank fees and grace-period rules are excluded; estimates are not posted to your balance."
                    : "This debt is interest-free. Set a monthly repayment only if you have agreed one with the person."}
                </p>
              </>
            )}
            {kind === "saving" && (
              <div className="space-y-2">
                <Label htmlFor="record-target">Goal amount (optional)</Label>
                <Input
                  id="record-target"
                  name="target"
                  type="number"
                  min="0"
                  max="20000000"
                  step="0.01"
                />
              </div>
            )}
          </fieldset>
          {props.error && (
            <p
              role="alert"
              className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
            >
              {props.error}
            </p>
          )}
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => props.onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy && <LoaderCircle className="animate-spin" />}
              {busy ? "Saving…" : editing ? "Save debt details" : "Save record"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
