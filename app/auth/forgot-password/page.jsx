import AuthLayout from "@/components/auth/AuthLayout";
import ForgotPasswordForm from "./ForgotPasswordForm";

export const metadata = {
  title: "Forgot Password | StockMaster",
};

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Reset access securely"
      subtitle="OTP powered password reset ensures only verified teammates regain control."
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
