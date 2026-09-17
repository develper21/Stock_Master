import AuthLayout from "@/components/auth/AuthLayout";
import SignUpForm from "./SignUpForm";

export const metadata = {
  title: "Sign Up | StockMaster",
};

export default function SignUpPage() {
  return (
    <AuthLayout
      title="Digitize every warehouse move"
      subtitle="Create a role-aware workspace with OTP-secured access and realtime stock telemetry."
    >
      <SignUpForm />
    </AuthLayout>
  );
}
