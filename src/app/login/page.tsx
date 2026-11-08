import Link from "next/link";
import { DEMO_PASSWORD } from "@/server/auth";
import { LoginForm } from "./login-form";

const demoAccounts = [
  { email: "maya@example.com", label: "Plaintiff" },
  { email: "jordan@example.com", label: "Plaintiff" },
  { email: "avery@example.com", label: "Attorney, Alder & Finch LLP" },
  { email: "sam@example.com", label: "Paralegal, Pacific Shore Legal" },
  { email: "riley@example.com", label: "Admin" },
];

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-semibold">Sign in</h1>
      <LoginForm demoAccounts={demoAccounts} demoPassword={DEMO_PASSWORD} />
      <p className="mt-8 text-center text-sm text-gray-600">
        Need legal help?{" "}
        <Link href="/submit" className="underline">
          Submit a lead
        </Link>
      </p>
    </div>
  );
}
