"use client";

import type { FormEvent } from "react";
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
import type { Debt, MoneyFormatter } from "./types";

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
};

export function RecordDialog(props: Props) {
  const { kind, busy } = props;
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
            Add a record
          </DialogTitle>
          <DialogDescription>
            Give every part of your money a place.
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
              >
                <SelectTrigger id="record-kind" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["income", "expense", "saving", "debt", "payment"].map(
                    (value) => (
                      <SelectItem key={value} value={value}>
                        {value === "payment"
                          ? "Debt payment"
                          : value[0].toUpperCase() + value.slice(1)}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="record-name">Description</Label>
              <Input
                id="record-name"
                name="name"
                placeholder={
                  kind === "debt" ? "e.g. Personal loan" : "e.g. Monthly salary"
                }
                required
                maxLength={100}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="record-amount">Amount ({props.currency})</Label>
                <Input
                  id="record-amount"
                  name="amount"
                  type="number"
                  inputMode="decimal"
                  min="0.01"
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
                  defaultValue={props.date}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="record-category">
                {kind === "payment" ? "Debt" : "Category"}
              </Label>
              {kind === "payment" ? (
                <Select
                  key="debt-category"
                  name="category"
                  required
                  disabled={busy}
                >
                  <SelectTrigger id="record-category" className="w-full">
                    <SelectValue placeholder="Select a debt" />
                  </SelectTrigger>
                  <SelectContent>
                    {props.debts
                      .filter((debt) => debt.balance > 0)
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
            {kind === "debt" && (
              <div className="space-y-2">
                <Label htmlFor="record-minimum">Minimum monthly payment</Label>
                <Input
                  id="record-minimum"
                  name="minimum"
                  type="number"
                  min="0"
                  max="20000000"
                  step="0.01"
                  defaultValue="0"
                  required
                />
              </div>
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
              {busy ? "Saving…" : "Save record"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
