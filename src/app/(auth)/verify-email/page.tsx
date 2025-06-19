"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Mail, CheckCircle, XCircle } from "lucide-react";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [message, setMessage] = useState("Verifying your email...");
  const [error, setError] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    } else {
      setMessage("Please check your email for the verification link");
    }
  }, [token]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/auth/verify-email/${token}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to verify email");
      }

      setMessage("Email verified successfully! You can now sign in to your account.");
      setIsVerified(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center pb-8 pt-8">
          <div className="mx-auto w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center mb-4">
            {error ? (
              <XCircle className="w-6 h-6 text-white" />
            ) : isVerified ? (
              <CheckCircle className="w-6 h-6 text-white" />
            ) : (
              <Mail className="w-6 h-6 text-white" />
            )}
          </div>
          <CardTitle className="text-2xl font-semibold text-slate-900">
            {error ? "Verification Failed" : isVerified ? "Email Verified!" : "Email Verification"}
          </CardTitle>
          <CardDescription className="text-slate-600">
            {error ? "There was a problem verifying your email" : isVerified ? "Welcome to SideBet" : "Confirming your Harvard email address"}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <div className="text-center space-y-6">
            {error ? (
              <div className="text-sm text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
                {error}
              </div>
            ) : (
              <div className="text-sm text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-200">
                {message}
              </div>
            )}
            <Button asChild className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium">
              <Link href="/login">
                {isVerified ? "Sign in to your account" : "Return to sign in"}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 