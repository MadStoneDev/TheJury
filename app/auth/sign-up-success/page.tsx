import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IconMailCheck } from "@tabler/icons-react";
import Link from "next/link";

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2">
            <IconMailCheck className="w-6 h-6 text-emerald-500" />
          </div>
          <CardTitle className="text-2xl font-display">
            Check your email
          </CardTitle>
          <CardDescription>
            We&apos;ve sent you a confirmation link
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            You&apos;ve successfully signed up. Please check your email to
            confirm your account before signing in.
          </p>
          <Link
            href="/auth/login"
            className="text-sm text-emerald-500 hover:text-emerald-400 font-medium transition-colors"
          >
            Back to login
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
