"use client";

import { signOut } from "next-auth/react";

export function Topbar() {
  return (
    <header className="flex items-center justify-between p-4 border-b">
      <div className="font-semibold">Personal Finance Tracker</div>

      <button
        className="rounded-lg border px-3 py-2 hover:bg-gray-50"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        Logout
      </button>
    </header>
  );
}
