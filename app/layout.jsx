import "./globals.css";
import { Inter } from "next/font/google";
import { ToastProvider } from "@/components/ui/ToastProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "StockMaster",
  description: "Modular Inventory Management System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen antialiased`}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
