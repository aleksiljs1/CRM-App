import imapSimple from "imap-simple";
import { simpleParser } from "mailparser";
import crypto from "crypto";

/**
 * Gmail IMAP Poller
 * Checks inbox every N seconds for new emails and saves them to the DB.
 * Uses IMAP UNSEEN flag so each email is only processed once.
 */

let isPolling = false;
let pollInterval: ReturnType<typeof setInterval> | null = null;

const IMAP_CONFIG = {
  imap: {
    user: process.env.SMTP_USER || "",
    password: process.env.SMTP_PASS || "",
    host: "imap.gmail.com",
    port: 993,
    tls: true,
    authTimeout: 10000,
    tlsOptions: { rejectUnauthorized: false },
  },
};

/**
 * Detect department from email subject and body using keyword matching.
 */
function detectDepartment(subject: string, body: string): string {
  const text = (subject + " " + body).toLowerCase();
  if (text.includes("audit") || text.includes("assurance")) return "AUDIT";
  if (text.includes("tax") || text.includes("accounting") || text.includes("vat")) return "ACCOUNTING_TAX";
  if (text.includes("payroll") || text.includes("salary") || text.includes("bookkeeping")) return "BOOKKEEPING_PAYROLL";
  if (text.includes("legal") || text.includes("law") || text.includes("compliance") || text.includes("contract")) return "LEGAL";
  if (text.includes("advisory") || text.includes("consulting")) return "ADVISORY";
  if (text.includes("marketing") || text.includes("campaign") || text.includes("brand")) return "MARKETING";
  if (text.includes("budget") || text.includes("expense") || text.includes("finance") || text.includes("invoice")) return "FINANCE";
  return "HR"; // default fallback
}

async function fetchNewEmails() {
  if (isPolling) return; // prevent overlapping polls
  isPolling = true;

  try {
    const connection = await imapSimple.connect(IMAP_CONFIG);
    await connection.openBox("INBOX");

    // Search for UNSEEN (unread) emails
    const searchCriteria = ["UNSEEN"];
    const fetchOptions = {
      bodies: [""],
      markSeen: true, // mark as read so we don't process again
      struct: true,
    };

    const messages = await connection.search(searchCriteria, fetchOptions);

    if (messages.length === 0) {
      connection.end();
      isPolling = false;
      return [];
    }

    console.log(`[IMAP] Found ${messages.length} new email(s)`);

    const newEmails = [];

    for (const msg of messages) {
      try {
        const rawEmail = msg.parts.find((p: any) => p.which === "")?.body || "";
        const parsed = await simpleParser(rawEmail);

        const senderEmail =
          parsed.from?.value?.[0]?.address || "unknown@email.com";
        const senderName =
          parsed.from?.value?.[0]?.name || senderEmail.split("@")[0];
        const subject = parsed.subject || "(No Subject)";
        let body = parsed.text || parsed.html || "";

        // Clean HTML
        body = body.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
        if (body.length > 5000) body = body.slice(0, 5000);

        // Detect department from content
        const recipientDept = detectDepartment(subject, body);

        newEmails.push({
          threadId: `thread-${crypto.randomUUID().slice(0, 8)}`,
          senderEmail,
          senderName,
          subject,
          body,
          recipientDept,
        });
      } catch (parseErr) {
        console.error("[IMAP] Failed to parse email:", parseErr);
      }
    }

    connection.end();
    isPolling = false;
    return newEmails;
  } catch (error) {
    console.error("[IMAP] Polling error:", error);
    isPolling = false;
    return [];
  }
}

export { fetchNewEmails, detectDepartment };

export function startPolling() {
  if (pollInterval) return; // already running
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log("[IMAP] No credentials configured, skipping email polling");
    return;
  }
  console.log("[IMAP] Starting email poller (every 10 seconds)");
  // Don't poll immediately on startup - wait first interval
  pollInterval = setInterval(() => {
    fetchNewEmails(); // fire and forget - results saved via API
  }, 10000);
}

export function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
    console.log("[IMAP] Polling stopped");
  }
}
