import "./globals.css";
import { Inter } from "next/font/google";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { ToastProvider } from "@/components/ui/ToastProvider";
import StokiqLoader from "@/components/loader/loding";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Stock Master",
  description: "Inventory Management System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen antialiased`}>
        <ErrorBoundary>
          <ToastProvider>{children}</ToastProvider>
        </ErrorBoundary>
        <StokiqLoader />
      </body>
    </html>
  );
}
