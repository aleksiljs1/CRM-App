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

/** Credentials for a single mailbox to poll. */
export interface ImapCredentials {
  user: string;
  password: string;
  host?: string;
}

/**
 * Guess the IMAP server from an email address. Returns null for unknown
 * domains so the caller can ask the user for a custom host.
 */
export function detectImapHost(email: string): string | null {
  const domain = (email.split("@")[1] || "").toLowerCase();
  if (!domain) return null;
  if (domain === "gmail.com" || domain === "googlemail.com")
    return "imap.gmail.com";
  if (
    domain === "outlook.com" ||
    domain === "hotmail.com" ||
    domain === "live.com" ||
    domain === "msn.com"
  )
    return "outlook.office365.com";
  if (domain.endsWith("yahoo.com")) return "imap.mail.yahoo.com";
  if (domain === "icloud.com" || domain === "me.com") return "imap.mail.me.com";
  return null;
}

function buildImapConfig(creds: ImapCredentials) {
  return {
    imap: {
      user: creds.user,
      password: creds.password,
      host: creds.host || "imap.gmail.com",
      port: 993,
      tls: true,
      authTimeout: 10000,
      tlsOptions: { rejectUnauthorized: false },
    },
  };
}

/** Strip angle brackets / whitespace from a Message-ID style header value. */
function normalizeMsgId(id?: string | null): string | null {
  if (!id) return null;
  const cleaned = id.replace(/[<>]/g, "").trim();
  return cleaned || null;
}

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

async function fetchNewEmails(creds?: ImapCredentials) {
  // Fall back to the global env mailbox if no per-user creds are given.
  const resolved: ImapCredentials = creds || {
    user: process.env.SMTP_USER || "",
    password: process.env.SMTP_PASS || "",
  };
  if (!resolved.user || !resolved.password) return [];

  if (isPolling) return []; // prevent overlapping polls
  isPolling = true;

  try {
    const connection = await imapSimple.connect(buildImapConfig(resolved));
    await connection.openBox("INBOX");

    // Pull recent inbox emails (read OR unread) so the user sees their existing
    // mailbox, not just brand-new mail. Limited to the last 30 days and capped
    // below. We do NOT mark messages as read — stay non-invasive.
    // node-imap formats a Date object into the IMAP date format itself.
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const searchCriteria: any[] = [["SINCE", since]];
    const fetchOptions = {
      bodies: [""],
      markSeen: false,
      struct: true,
    };

    const allMessages = await connection.search(searchCriteria, fetchOptions);

    if (allMessages.length === 0) {
      connection.end();
      isPolling = false;
      return [];
    }

    // Newest first, capped so a big inbox doesn't overwhelm the poll.
    const messages = allMessages.slice(-25).reverse();

    console.log(`[IMAP] Fetched ${messages.length} recent email(s)`);

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

        const date = parsed.date || new Date();

        // Build a STABLE thread id so the same message always maps to the same
        // thread (no more random ids creating duplicate "chats"), and real
        // reply chains group under their root. Prefer the first References /
        // In-Reply-To header (the conversation root), else the message's own
        // Message-ID, else a deterministic hash of sender|subject|date.
        const refs = Array.isArray(parsed.references)
          ? parsed.references
          : parsed.references
          ? [parsed.references]
          : [];
        const rootRef = normalizeMsgId(refs[0]) || normalizeMsgId(parsed.inReplyTo);
        const ownId = normalizeMsgId(parsed.messageId);
        const fallback = `thread-${crypto
          .createHash("sha1")
          .update(`${senderEmail}|${subject}|${date.toISOString()}`)
          .digest("hex")
          .slice(0, 12)}`;
        const threadId = rootRef || ownId || fallback;

        newEmails.push({
          threadId,
          senderEmail,
          senderName,
          subject,
          body,
          recipientDept,
          date,
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

/**
 * Test that a mailbox's IMAP credentials actually work.
 * Used by Settings -> Email before saving so users get instant feedback.
 */
async function verifyImapConnection(creds: ImapCredentials): Promise<boolean> {
  try {
    const connection = await imapSimple.connect(buildImapConfig(creds));
    await connection.openBox("INBOX");
    connection.end();
    return true;
  } catch (error) {
    console.error("[IMAP] Verify failed:", error);
    return false;
  }
}

export { fetchNewEmails, detectDepartment, verifyImapConnection };

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
