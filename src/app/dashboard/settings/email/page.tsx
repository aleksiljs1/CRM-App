"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Mail, Loader2, CheckCircle2, Link2, Link2Off } from "lucide-react";

export default function EmailSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const loadStatus = async () => {
    try {
      const { data } = await axios.get("/api/settings/email");
      setConnected(!!data.connected);
      setConnectedEmail(data.email || null);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !appPassword.trim()) {
      toast.error("Enter your email and app password.");
      return;
    }
    setSaving(true);
    try {
      const { data } = await axios.post("/api/settings/email", {
        email: email.trim(),
        appPassword,
      });
      setConnected(true);
      setConnectedEmail(data.email);
      setEmail("");
      setAppPassword("");
      toast.success("Email connected! Your inbox will now appear in the Emails tab.");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error || "Failed to connect. Check your credentials."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    setSaving(true);
    try {
      await axios.delete("/api/settings/email");
      setConnected(false);
      setConnectedEmail(null);
      toast.success("Email disconnected.");
    } catch {
      toast.error("Failed to disconnect.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-brand-700 dark:text-brand-400">
          <Mail className="h-5 w-5" />
          Email Settings
        </h1>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          Connect your mailbox so your emails show up live in the Emails tab.
        </p>
      </div>

      {loading ? (
        <Card className="flex items-center justify-center p-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </Card>
      ) : connected ? (
        <Card className="space-y-4 p-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Email connected
              </p>
              <p className="text-[13px] text-muted-foreground">
                {connectedEmail}
              </p>
            </div>
          </div>
          <p className="text-[13px] text-muted-foreground">
            Your inbox is now syncing. Open the Emails tab to see incoming
            messages in real time.
          </p>
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleDisconnect}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Link2Off className="h-4 w-4" />
            )}
            Disconnect
          </Button>
        </Card>
      ) : (
        <Card className="space-y-5 p-6">
          <form onSubmit={handleConnect} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Email address
              </label>
              <Input
                type="email"
                placeholder="you@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Gmail App Password
              </label>
              <Input
                type="password"
                placeholder="abcd efgh ijkl mnop"
                value={appPassword}
                onChange={(e) => setAppPassword(e.target.value)}
                autoComplete="off"
              />
            </div>
            <Button
              type="submit"
              className="gap-2 bg-brand-600 text-white hover:bg-brand-700"
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Link2 className="h-4 w-4" />
              )}
              Connect Email
            </Button>
          </form>

          <div className="rounded-lg border border-border bg-muted/40 p-4 text-[13px] text-muted-foreground">
            <p className="mb-2 font-medium text-foreground">
              How to get a Gmail App Password
            </p>
            <ol className="list-decimal space-y-1 pl-4">
              <li>Turn on 2-Step Verification in your Google Account.</li>
              <li>
                Go to{" "}
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-600 underline"
                >
                  myaccount.google.com/apppasswords
                </a>
                .
              </li>
              <li>Create an app password and paste the 16-character code above.</li>
              <li>Make sure IMAP is enabled in Gmail settings.</li>
            </ol>
          </div>
        </Card>
      )}
    </div>
  );
}
