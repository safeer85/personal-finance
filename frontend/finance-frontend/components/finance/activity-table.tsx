"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  CircleDollarSign,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Entry, MoneyFormatter } from "./types";

export function ActivityTable({
  records,
  allRecords,
  date,
  money,
  onDelete,
}: {
  records: Entry[];
  allRecords: Entry[];
  date: string;
  money: MoneyFormatter;
  onDelete: (record: Entry) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/50 hover:bg-muted/50">
          {["Transaction", "Category", "Date", "Amount"].map((heading) => (
            <TableHead
              key={heading}
              className={cn(
                "text-xs font-medium",
                heading === "Amount" && "text-right",
              )}
            >
              {heading}
            </TableHead>
          ))}
          <TableHead className="w-12">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((record) => {
          const Icon =
            record.kind === "income"
              ? ArrowDownLeft
              : record.kind === "saving"
                ? CircleDollarSign
                : ArrowUpRight;
          return (
            <TableRow key={record.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-xl bg-orange-50 text-orange-700",
                      record.kind === "income" &&
                        "bg-emerald-50 text-emerald-700",
                      record.kind === "saving" &&
                        "bg-violet-50 text-violet-700",
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <div>
                    <p className="font-medium">{record.name}</p>
                    <p className="text-xs capitalize text-muted-foreground">
                      {record.kind}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="font-normal">
                  {record.kind === "payment"
                    ? allRecords.find((debt) => debt.id === record.category)
                        ?.name || "Debt payment"
                    : record.category}
                </Badge>
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {record.date}
                {record.date > date && (
                  <span className="ml-2 text-xs">Planned</span>
                )}
              </TableCell>
              <TableCell
                className={cn(
                  "text-right font-medium tabular-nums",
                  record.kind === "income" && "text-emerald-700",
                )}
              >
                {record.kind === "income"
                  ? "+"
                  : record.kind === "debt"
                    ? ""
                    : "−"}
                {money(record.amount)}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Delete ${record.name}`}
                  onClick={() => onDelete(record)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
