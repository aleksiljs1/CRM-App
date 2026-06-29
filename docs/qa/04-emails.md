# Section 4: Email Inbox & Settings

The Email system lets each Kreston staff member connect their own Gmail mailbox and then read, search, reply to, and send emails directly inside the CRM. Once connected, your inbox appears in the Emails tab and refreshes by itself roughly every 10 seconds while the tab is open. The system also includes Google Gemini AI helpers that can improve a reply you are writing and re-order your unread emails by importance.

Live app: https://kreston-crm.onrender.com

**Logins used in this guide:**
- Normal user: `audit.senior@kreston.al` / `audit123` (this person is named "Jeta Rexhepi")
- See-everything admin: `admin@kreston.al` / `admin123`

> **Note on Gmail only:** Right now only Gmail mailboxes are properly supported. Outlook, Yahoo, and others are not supported yet, so testing should be done with a Gmail account.

> **Note on AI speed:** Anything labeled "AI Assist" or "Sort by importance" uses Google Gemini and runs on Google's servers. Expect a few seconds (sometimes 5-15 seconds) of "thinking" before you see a result. This is normal.

---

## How to connect a Gmail mailbox (step by step)

This is the most important setup step. A normal user will NOT see their inbox until they finish this. You connect using your Gmail address plus a special **Gmail App Password** (a 16-character code Google generates) - NOT your normal Gmail login password. App Passwords only work if 2-Step Verification is turned on and IMAP is enabled.

### Part A - Turn on 2-Step Verification (one time, in Google)
1. In a new browser tab, sign in to the Gmail account you want to connect.
2. Go to your Google Account security page (https://myaccount.google.com/security).
3. Find "2-Step Verification" and turn it ON. Follow Google's prompts (you'll confirm with your phone).
4. **Expected result:** 2-Step Verification shows as "On". (If it is off, App Passwords cannot be created in the next step.)

### Part B - Create an App Password (one time, in Google)
1. Go to https://myaccount.google.com/apppasswords.
2. If asked, sign in again.
3. Give the app password a name (for example, "Kreston CRM") and click Create.
4. Google shows a **16-character code**, usually displayed in 4 groups like `abcd efgh ijkl mnop`. Copy it.
5. **Expected result:** You now have a 16-character app password. Keep this tab open or paste the code somewhere safe - Google only shows it once.

### Part C - Enable IMAP in Gmail (one time, in Gmail)
1. Open Gmail in your browser.
2. Click the gear icon (top right) -> "See all settings".
3. Go to the "Forwarding and POP/IMAP" tab.
4. Under "IMAP access", choose "Enable IMAP", then click "Save Changes".
5. **Expected result:** IMAP is enabled.

### Part D - Paste it into the CRM (Settings -> Email)
1. Log in to the CRM (for example as `audit.senior@kreston.al` / `audit123`).
2. Navigate to **Settings -> Email** (URL: `/dashboard/settings/email`).
3. In "Email address", type the Gmail address you set up (for example `you@gmail.com`).
4. In "Gmail App Password", paste the 16-character code. The spaces don't matter - the app removes them automatically.
5. Click **Connect Email**.
6. The button shows a spinner while the app actually tries to log in to your Gmail to confirm the credentials work before saving.
7. **Expected result:**
   - On success: a green message "Email connected! Your inbox will now appear in the Emails tab", the page switches to a connected view showing a green check, your email address, and a "Disconnect" button.
   - On failure: a red message such as "Could not connect. Check the email and make sure you used a Gmail App Password (not your normal password), with IMAP enabled in Gmail settings." (This happens if you used your normal password, IMAP is off, or 2-Step/App Password wasn't set up.)

---

## Features

### Connect a mailbox (Settings -> Email)
- **What it does:** Saves your personal Gmail credentials so the CRM can show your inbox. The app verifies the login works before saving it.
- **Who can access it:** Any logged-in user. (Admins and Partners can see all emails even without connecting their own - see "See-all view" below - but anyone can still connect a personal mailbox here.)
- **Steps to test:**
  1. Log in and go to Settings -> Email.
  2. Enter a valid Gmail address and a valid Gmail App Password.
  3. Click "Connect Email".
  4. Then enter a wrong/garbage password and try again (after disconnecting) to test the failure case.
- **Expected result:** Correct credentials show the green "Email connected" card. Wrong credentials show a red error and nothing is saved.

### Disconnect a mailbox
- **What it does:** Removes your saved Gmail credentials from the CRM. Your inbox stops syncing.
- **Who can access it:** Any logged-in user who has already connected a mailbox.
- **Steps to test:**
  1. Go to Settings -> Email while connected.
  2. Click the "Disconnect" button.
- **Expected result:** A message "Email disconnected." appears, and the page returns to the "enter email + app password" form. For a normal (non-admin) user, the Emails tab will now show the yellow warning banner again.

### Mailbox-not-connected warning banner
- **What it does:** Warns a normal user that they have no inbox to show, and gives a shortcut to set it up. While not connected, the app does not try to fetch mail (polling stays off).
- **Who can access it:** Normal (non-admin/non-partner) users who have NOT connected a mailbox. Admins and Partners never see this banner.
- **Steps to test:**
  1. Log in as `audit.senior@kreston.al` / `audit123` with no mailbox connected (disconnect first if needed).
  2. Open the Emails tab (`/dashboard/workspace/emails`).
- **Expected result:** A yellow banner reading "You don't have an email connected" with the text "Go to Settings and add your email to see your inbox here." and a "Go to Settings" button that links to Settings -> Email.

### View your inbox (Emails tab)
- **What it does:** Shows your connected mailbox's emails from roughly the last 30 days (both read and unread), newest first.
- **Who can access it:** A normal user sees only their own connected inbox. Admins and Partners see ALL emails in the system.
- **Steps to test:**
  1. Connect a mailbox (or log in as admin).
  2. Open the Emails tab.
  3. Look at the list on the left side.
- **Expected result:** A list of emails showing sender name, time (e.g. "5m ago"), subject, and a short preview line. The header reads "Your inbox" for a normal user, or a department inbox label for an admin/partner. If there are no emails, an "No emails found" empty state with an inbox icon is shown.

### Live auto-refresh (polling)
- **What it does:** Automatically checks the connected Gmail for new mail about every 10 seconds while the Emails tab is open, and pulls new messages into the list.
- **Who can access it:** Normal users with a connected mailbox, and admins/partners (who poll on the all-emails view). It does NOT run for a normal user without a connected mailbox.
- **Steps to test:**
  1. Open the Emails tab with a connected mailbox.
  2. From a different account/phone, send a new email to that Gmail address.
  3. Wait about 10 seconds without refreshing the page.
- **Expected result:** A green toast appears (e.g. "1 new email(s) received") and the new email appears at the top of the list automatically.

### Open an email / read a thread
- **What it does:** Opens the full conversation for the selected email on the right side, showing each message in a chat-style layout (incoming messages on the left, your sent messages on the right). Opening it marks the conversation as read.
- **Who can access it:** Anyone who can see the email in their list.
- **Steps to test:**
  1. Click an email in the left-hand list.
  2. Watch the right panel load the conversation.
- **Expected result:** The right side shows the subject, sender name and email at the top, and the message body (or whole thread). The email's unread dot turns to "read" in the list. On a phone, a "Back" button appears to return to the list.

### Read / Unread / Replied indicators
- **What it does:** Small colored dots and bold text tell you the status of each email at a glance.
- **Who can access it:** Anyone viewing the email list.
- **Steps to test:**
  1. Look at the colored dot on the right of each list item and whether the text is bold.
  2. Open an unread email, then look at it again in the list.
- **Expected result:**
  - Unread incoming email: bold text and a red dot (tooltip "Unread").
  - Read email: normal weight text and a grey dot (tooltip "Read").
  - Replied email: a green dot (tooltip "Replied").
  - Emails the AI marked high priority also show a colored left accent bar and an "Urgent" (red) or "Important" (amber) tag.

### Filter tabs (All / Unread / Read / Un-replied / Replied)
- **What it does:** Narrows the email list to a chosen status.
- **Who can access it:** Anyone viewing the Emails tab.
- **Steps to test:**
  1. Click each tab in turn: All, Unread, Read, Un-replied, Replied.
  2. (An extra "AI Ordered" tab appears only after you run "Sort by importance" - see that feature.)
- **Expected result:** The list updates to show only emails matching the chosen status. "Unread" shows incoming emails not yet read; "Un-replied" shows incoming emails you haven't answered; "Replied" shows answered ones. The active tab is highlighted.

### Search emails
- **What it does:** Finds emails by typing into the search box. It matches the subject, sender name, sender email, and message body.
- **Who can access it:** Anyone viewing the Emails tab.
- **Steps to test:**
  1. Type a word you know appears in an email (e.g. part of a subject or a sender's name) into "Search emails...".
  2. Wait a moment (it searches automatically after you stop typing, about half a second).
- **Expected result:** The list narrows to matching emails. If nothing matches, it shows "No emails match your search". Clearing the box restores the full list.

### Pagination
- **What it does:** Splits long email lists into pages so the list stays manageable.
- **Who can access it:** Anyone whose filtered list has more than one page.
- **Steps to test:**
  1. Use an account/filter with many emails.
  2. At the bottom of the list, use the left/right arrow buttons.
- **Expected result:** A line reads "Page X of Y (N total)". The right arrow moves forward, the left arrow moves back; arrows are disabled at the first/last page. The controls only appear when there is more than one page.

### Compose a new email
- **What it does:** Opens a popup to write and send a brand-new email (with optional file attachments).
- **Who can access it:** Any staff role. Clients cannot send (the CLIENT role is blocked by the server).
- **Steps to test:**
  1. Click the "Compose" button (top right of the Emails tab).
  2. Fill in "To" (a valid email with an @), "Subject", and "Message". All three are required.
  3. Optionally click "Attach Files" and pick a PDF, Word, or Excel file.
  4. Click "Send Email".
- **Expected result:** The "Send Email" button is disabled until To, Subject, and Message are all filled. On success a green "Email sent successfully" toast appears, the popup closes, and the sent email is added to your list. Invalid input (e.g. missing @ in the address, or a disallowed file type) shows a red error.

### Reply to an email
- **What it does:** Sends a reply within the open conversation. Marks the original email as "Replied" and adds your reply to the thread.
- **Who can access it:** Any staff role. Clients are blocked from replying.
- **Steps to test:**
  1. Open an email in the right panel.
  2. Type into the "Write your reply..." box at the bottom.
  3. Click "Send Reply" (or press Ctrl+Enter as a shortcut).
- **Expected result:** A green "Reply sent" toast, the reply appears in the thread (right-aligned as an outgoing message), the reply box clears, and the original email's status changes to "Replied" (green dot). The "Send Reply" button is disabled while the box is empty.

### Attachments - add, view, and download
- **What it does:** Lets you attach documents to a new email or reply, and lets you open/download documents that arrived on emails. Allowed types: PDF, Word (.doc/.docx), and Excel (.xls/.xlsx).
- **Who can access it:** Any staff role for sending; anyone viewing a thread can open received attachments.
- **Steps to test:**
  1. In Compose or in a reply, click "Attach"/"Attach Files" and pick a PDF/Word/Excel file. Confirm it appears in a chip with the file name; click the small "x" to remove it before sending.
  2. Open an email/thread that has an attachment and click the attachment chip (shows a file icon, the file name, and its size like "1.2 MB").
  3. Try attaching a disallowed file type (e.g. a .png image) to confirm it is rejected.
- **Expected result:** Allowed files attach and send. Clicking a received attachment opens/downloads it in a new browser tab. A disallowed file type produces a red error such as "File type not allowed... Allowed: PDF, Word, Excel."

### AI Assist - enhance/improve a reply draft (Gemini)
- **What it does:** Takes a rough draft you typed and rewrites it into a polished, professional reply using Google Gemini, taking the conversation (and any matched client info) into account.
- **Who can access it:** Anyone composing a reply (the "AI Assist" button sits in the reply box).
- **Steps to test:**
  1. Open an email and type a short, rough draft in the reply box (e.g. "ok send docs tomorrow").
  2. Click the "AI Assist" button (sparkle icon).
  3. Wait a few seconds (Gemini is working - the button shows "Enhancing...").
- **Expected result:** The reply text is replaced with a more professional, well-structured version of your draft, and a green toast "Reply enhanced by AI" appears. The button is disabled when the reply box is empty. If the AI service fails, a red "AI Assist failed" toast appears and your draft is left as-is. You can edit the result before sending.

### AI Sort by importance - prioritize emails (Gemini)
- **What it does:** Asks Google Gemini to rank your unread, un-replied emails from most to least urgent (looking at keywords like "urgent/deadline", how long they've waited, and business impact). It then shows them in that order under a new "AI Ordered" tab and tags urgent/important ones.
- **Who can access it:** Only ADMIN, PARTNER, and MANAGER roles. (A normal Audit Senior may see the button but the action is restricted to those roles on the server.)
- **Steps to test:**
  1. Log in as an admin/partner/manager with several unread emails.
  2. Click "Sort by importance" (sparkle icon, next to the search box).
  3. Wait a few seconds (the button shows "Analyzing...").
- **Expected result:** A green toast "AI has ordered your emails by importance", and the view switches to a new "AI Ordered" tab where emails are sorted most-urgent first. High-scoring emails get a red "Urgent" or amber "Important" tag and a colored accent bar, and show a "Priority: NN%" in the email header. If it fails, a red "AI prioritization failed" toast appears.

### Export emails to Excel
- **What it does:** Downloads the emails as an Excel spreadsheet.
- **Who can access it:** Only ADMIN, PARTNER, and MANAGER roles see the "Export Emails" button.
- **Steps to test:**
  1. Log in as `admin@kreston.al` / `admin123` (or a partner/manager).
  2. On the Emails tab, click "Export Emails" (download icon, top right).
- **Expected result:** A green "Excel exported successfully" toast and an Excel file downloads to your computer. A normal user (e.g. Audit Senior) does not see this button at all.

### See-all view (Admin / Partner)
- **What it does:** Admins and Partners see every email in the system, not just their own inbox, and never see the "connect a mailbox" warning.
- **Who can access it:** ADMIN and PARTNER roles only.
- **Steps to test:**
  1. Log in as `admin@kreston.al` / `admin123`.
  2. Open the Emails tab.
  3. Compare with what `audit.senior@kreston.al` sees.
- **Expected result:** The admin sees all emails across the firm with no yellow warning banner, while the normal user only sees their own connected inbox (or the warning if not connected).

---

## Quick comparison: what each test login should see

| Capability | Normal user (audit.senior) | Admin (admin@kreston.al) |
| --- | --- | --- |
| Sees own connected inbox only | Yes | N/A (sees all) |
| Sees ALL emails | No | Yes |
| "Connect a mailbox" warning when not connected | Yes | No |
| Compose / Reply | Yes | Yes |
| AI Assist (enhance reply) | Yes | Yes |
| AI "Sort by importance" | Restricted (needs Manager+) | Yes |
| Export Emails to Excel | No (button hidden) | Yes |
