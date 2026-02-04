import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border p-6 shadow-sm space-y-3">
        <h1 className="text-xl font-semibold">Authentication error</h1>
        <p className="text-sm text-gray-600">
          Something went wrong while signing in. Try again.
        </p>
        <Link
          href="/login"
          className="inline-block rounded-lg bg-black text-white px-4 py-2"
        >
          Back to login
        </Link>
      </div>
    </div>
  );
}
