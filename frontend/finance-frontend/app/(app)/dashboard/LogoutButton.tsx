"use client";
import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="mt-4 rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
    >
      Logout
    </button>
  );
}
