import AuthLayout from "@/components/auth/AuthLayout";
import LoginForm from "./LoginForm";

export const metadata = {
  title: "Login | StockMaster",
};

export default function LoginPage() {
  return (
    <AuthLayout
      title="Command the floor with total inventory clarity"
      subtitle="Login with your StockMaster ID to orchestrate receipts, deliveries, and real-time availability."
    >
      <LoginForm />
    </AuthLayout>
  );
}
