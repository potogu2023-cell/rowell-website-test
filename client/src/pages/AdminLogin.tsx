import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ShieldCheck } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function requestAccess(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/admin-access/request", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error("Unable to request administrator access");
      setSubmitted(true);
    } catch {
      setError("The access request could not be completed. Please try again or contact your website administrator.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg shadow-sm">
        <CardHeader className="space-y-3">
          <div className="h-11 w-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <CardTitle>ROWELL inquiry dashboard access</CardTitle>
          <p className="text-sm text-muted-foreground">
            Customer inquiries contain personal contact information. Authorized administrators sign in using a short-lived email link.
          </p>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="space-y-4" role="status">
              <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
                If this email is authorized, a one-time sign-in link has been sent. The link expires after 15 minutes.
              </div>
              <Link href="/admin/messages" className="text-sm text-blue-700 underline underline-offset-4">
                Return to the inquiry dashboard
              </Link>
            </div>
          ) : (
            <form onSubmit={requestAccess} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Administrator email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="admin-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                    className="pl-10"
                    required
                    placeholder="name@rowellhplc.com"
                  />
                </div>
              </div>
              {error ? <p className="text-sm text-red-700" role="alert">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Requesting secure link…" : "Email a secure sign-in link"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
