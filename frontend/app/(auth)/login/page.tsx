// frontend/app/(auth)/login/page.tsx
"use client";
import { signIn } from "next-auth/react";
export default function Login() {
  const useDev = process.env.NEXT_PUBLIC_USE_DEV_AUTH === "true";
  return (
    <main className="max-w-md mx-auto p-6 glass space-y-4">
      <h2 className="text-xl font-semibold">Sign in</h2>
      {useDev ? (
        <button
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20"
          onClick={() => signIn("credentials", { email: "you@example.com", password: "dev", callbackUrl: "/dashboard" })}
        >
          Dev Login
        </button>
      ) : (
        <button
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20"
          onClick={() => signIn("cognito", { callbackUrl: "/dashboard" })}
        >
          Sign in with Cognito
        </button>
      )}
    </main>
  );
}
