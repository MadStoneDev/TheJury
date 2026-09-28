import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Sign in | TheJury",
  description: "Sign in to TheJury to create polls and manage your results.",
  robots: { index: false, follow: true },
};

export default function Page() {
  return <LoginForm />;
}
