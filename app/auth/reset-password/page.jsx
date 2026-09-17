import { Suspense } from "react";
import AuthLayout from "@/components/auth/AuthLayout";
import ResetPasswordForm from "./ResetPasswordForm";

export const metadata = {
  title: "Reset Password | StockMaster",
};

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      title="Secure your account"
      subtitle="Enter the OTP we emailed you and set a brand new password to regain access."
    >
      <Suspense fallback={<div className="text-sm text-slate-400">Loading reset form…</div>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
