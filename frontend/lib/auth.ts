// frontend/lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import CognitoProvider from "next-auth/providers/cognito";

const useDevAuth = process.env.USE_DEV_AUTH === "true";

export const authOptions: NextAuthOptions = {
  providers: useDevAuth
    ? [
        Credentials({
          name: "Dev Login",
          credentials: {
            email: { label: "Email", type: "email" },
            password: { label: "Password", type: "password" }
          },
          async authorize(credentials) {
            // accept any non-empty email/pass in dev
            if (credentials?.email && credentials?.password) {
              return { id: "dev-user", email: credentials.email };
            }
            return null;
          }
        })
      ]
    : [
        CognitoProvider({
          clientId: process.env.COGNITO_CLIENT_ID!,
          clientSecret: process.env.COGNITO_CLIENT_SECRET!,
          issuer: process.env.COGNITO_ISSUER! // e.g. https://cognito-idp.ap-southeast-1.amazonaws.com/ap-southeast-1_ABC123
        })
      ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account, user }) {
      if (user && useDevAuth) {
        // add minimal info in dev
        (token as any).role = "dev";
      }
      if (account && !useDevAuth) {
        (token as any).access_token = account.access_token;
        (token as any).id_token = (account as any).id_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (!useDevAuth) {
        (session as any).access_token = (token as any).access_token;
        (session as any).id_token = (token as any).id_token;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET
};
