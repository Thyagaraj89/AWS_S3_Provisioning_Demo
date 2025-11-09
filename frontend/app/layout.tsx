import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import HeaderBar from "@/components/HeaderBar";

export const metadata = {
  title: "Thyagaraj Demo",
  description: "Provision AWS safely with one click"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* SessionProvider must wrap ANY component that uses useSession */}
        <AuthProvider>
          <div className="app-aurora" />
          <header className="sticky top-0 z-20 border-b border-white/10 bg-black/30 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
              <div className="text-[15px] font-semibold tracking-wide">
                <span className="text-brand-cyan">⚡ Raj AWS</span> Deploy
              </div>
              <HeaderBar />
            </div>
          </header>

          <main className="relative mx-auto max-w-6xl px-5 py-8">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
