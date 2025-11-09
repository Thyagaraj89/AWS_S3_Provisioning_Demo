"use client";
import { useSession, signOut, signIn } from "next-auth/react";

export default function HeaderBar() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="text-xs text-white/60">Loading…</div>;
  }

  if (!session) {
    // not signed in
    return (
      <button
        onClick={() => signIn(undefined, { callbackUrl: "/dashboard" })}
        className="inline-flex items-center rounded-xl bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
      >
        Sign in
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="hidden sm:block text-xs text-white/70">
        {session.user?.email ?? "Signed in"}
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="inline-flex items-center rounded-xl bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
        title="Sign out"
      >
        Logout
      </button>
    </div>
  );
}
