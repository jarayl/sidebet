"use client";

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:8000/api/v1/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      // Force reload to clear any cached state
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleGetStarted = () => {
    router.push("/register");
  };

  const handleLogin = () => {
    router.push("/login");
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">Welcome to SideBet</h1>
        <div className="flex justify-center gap-4 mb-4">
          <Button variant="default" onClick={handleGetStarted}>Get Started</Button>
          <Button variant="outline" onClick={handleLogin}>Learn More</Button>
        </div>
        <div className="flex justify-center">
          <Button variant="destructive" onClick={handleLogout}>Logout (Clear Session)</Button>
        </div>
      </div>
    </main>
  )
}
