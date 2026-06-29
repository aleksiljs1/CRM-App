# Section 8: Client Portal

This section covers everything an external CLIENT (a company that hires Kreston, not a Kreston employee) sees and does after logging in. The client portal is a single dashboard page where a client tracks the work Kreston is doing for them, uploads the documents Kreston has asked for, gets AI help understanding those documents, and chats directly with their assigned Kreston staff. It is reached at https://kreston-crm.onrender.com and is completely separate from the staff/admin side of the app.

**Logins used in this section**
- Primary client: `client@alpha.com` / `client123` (this company is "Alpha Corp").
- Other clients (all use password `client123`): `anisa@betaconsulting.al`, `fatmir@gammaimport.al`.
- Kreston staff (for two-window cross-checks only): `admin@kreston.al` / `admin123`.

> Note on the AI features: the assistant runs on Google Gemini and talks to the internet, so answers are NOT instant. After you ask a question or run a check, expect a short wait (often 5-20 seconds) with a "Thinking..." or spinning indicator before the answer appears. This is normal.

---

### Client Login

- **What it does:** Lets a client sign in with email and password and automatically sends them to their client dashboard.
- **Who can access it:** Anyone with a client account (e.g. `client@alpha.com`). The same login page is shared with Kreston staff; the app routes each person to the correct dashboard based on their role.
- **Steps to test:**
  1. Go to https://kreston-crm.onrender.com (if you are already logged in, log out first).
  2. You should land on the "Kreston CRM - Sign in to your account to continue" login card.
  3. In the Email box type `client@alpha.com`.
  4. In the Password box type `client123`.
  5. Click **Sign In**.
- **Expected result:** The button briefly shows "Signing in...", then you are taken to the client dashboard at a URL ending in `/dashboard/client`, with a heading that says "Welcome, Alpha Corp". If you type a wrong password, a red "Invalid email or password" message appears instead and you stay on the login page.

---

### Client Dashboard Overview (Welcome header + 4 metric cards)

- **What it does:** Shows the client a personal welcome with today's date and four summary cards counting their active work, documents, and approvals. All numbers are real data for that client, not samples.
- **Who can access it:** The logged-in client only (each client sees their own company's numbers).
- **Steps to test:**
  1. Log in as `client@alpha.com` / `client123`.
  2. Read the top of the page: it should say "Welcome, Alpha Corp" with "Your client portal · <today's date>" underneath.
  3. Scroll to the "Overview" row and look at the four cards.
- **Expected result:** You see four cards titled:
  - **Active Submissions** - "Processes currently in progress"
  - **Open Work** - "Tasks the firm is working on for you"
  - **Documents Uploaded** - "Across all your submissions"
  - **Approved Items** - "Successfully completed by our team"
  Each shows a number. The numbers should match what is shown elsewhere on the page (e.g. uploading a document later should increase "Documents Uploaded"). Logging in as a different client (e.g. `anisa@betaconsulting.al`) should show that company's name and its own, different numbers.

---

### Overall Progress Ring + "Your active work" list

- **What it does:** A large circular percentage ring shows how far along all of Kreston's work for this client is, and a list underneath shows each active task with its status, a progress bar, who it is assigned to, and its deadline.
- **Who can access it:** The logged-in client.
- **Steps to test:**
  1. Log in as `client@alpha.com` / `client123`.
  2. Look just under the welcome header for the big circle showing a percentage and the word "complete".
  3. Read the headline next to it (e.g. "Your work is 40% complete" with a count like "3 tasks · 2 active").
  4. Below, under the "Your active work" label, review the list of tasks. Each row shows a colored status chip (To Do, In Progress, In Review, Approved, Completed), the task title, a thin progress bar, "Assigned to <name>", and a deadline (e.g. "Due in 3d", "Due today", or red "Overdue by 2d").
- **Expected result:** The ring shows a whole-number percent. Tasks that are not finished appear in the list (up to 6, soonest deadline first). If this client has no tasks at all, you instead see "No active work tracked yet" in the ring area and "No active work right now" in the list.

---

### Live task updates (real-time, two-window test)

- **What it does:** When a Kreston staff member changes the status of one of this client's tasks, the client's dashboard updates instantly without a page refresh, and a small toast notification pops up.
- **Who can access it:** The client sees the update; a Kreston staff member triggers it.
- **Steps to test (needs two browser windows):**
  1. Window A: log in as `client@alpha.com` / `client123` and leave the dashboard open on the "Your active work" list.
  2. Window B (use a different browser or a private/incognito window): log in as `admin@kreston.al` / `admin123`, find a task that belongs to Alpha Corp, and change its status (for example move it from "In Progress" to "Completed").
  3. Switch back to Window A without refreshing.
- **Expected result:** In Window A, a toast appears reading something like "Task updated: <task title> - Completed", and the matching task's status chip and progress bar update on their own. The overall progress ring percentage may also change.

---

### Processes section - viewing required documents and upload status

- **What it does:** Lists each process Kreston is running for the client (e.g. an audit or registration), and for each one shows how many required documents have been received, a progress bar, which specific documents are still missing, and the full list of required documents with a status icon on each.
- **Who can access it:** The logged-in client. The section only appears if the client has at least one process with required documents.
- **Steps to test:**
  1. Log in as `client@alpha.com` / `client123`.
  2. Find the "Processes" section (between the active-work list and the Overview cards).
  3. For each process card, read the process name and the line "X of Y documents received". If any are missing, it shows "-- Missing: <document names>" in amber.
  4. Look at the progress bar and the "X/Y" counter at the right of the bar.
  5. Under "Required Documents", review the list. Each document has a green checkmark (received) or an amber warning icon (still missing), and a red asterisk (*) if it is mandatory.
- **Expected result:** Each process shows an accurate count and progress bar. Documents already provided show green checks; missing ones show amber icons and are also named in the "Missing:" text. A green folder/check icon at the top-left of the card turns to a check when all documents are received.

---

### Uploading / submitting documents

- **What it does:** Lets the client attach one or more files to a process. After upload, the AI automatically reads each file and matches it to the correct required document, then updates the "received / missing" counts.
- **Who can access it:** The logged-in client, on any process that is not yet complete (the "Upload" button is hidden once a process is fully complete).
- **Steps to test:**
  1. Log in as `client@alpha.com` / `client123`.
  2. In the "Processes" section, find a process that still has missing documents and click its blue **Upload** button.
  3. Your computer's file picker opens. Choose one or more files. Accepted types: PDF, Word (.doc/.docx), Excel (.xls/.xlsx), and images (.jpg/.jpeg/.png). You can select several at once.
  4. Wait. The Upload button shows a spinner while the file uploads and the AI matches it (this can take several seconds because of the AI step).
- **Expected result:** A green toast appears like "1 file(s) uploaded. AI matched them to requirements." The process card updates: the "X of Y documents received" count and progress bar increase, matched documents flip from amber to green, and an AI feedback banner appears below the card. The banner is green and says "All required documents have been received. Your submission is complete." if nothing is left, or amber listing exactly which documents are still missing. (Behind the scenes the assigned Kreston staff are notified of the upload.)

---

### "Check with AI" - AI document review

- **What it does:** Asks the AI to review everything the client has uploaded for a process and report, document by document, whether each required item was found, looks correct, or has a problem, plus overall suggestions.
- **Who can access it:** The logged-in client. The "Check with AI" button only appears on a process once at least one file has been uploaded.
- **Steps to test:**
  1. Log in as `client@alpha.com` / `client123` and go to the "Processes" section.
  2. On a process that already has uploads, click the **Check with AI** button (brain icon).
  3. Wait for the AI (the button shows a spinner). A pop-up titled "AI Document Check" appears.
  4. Read the results: an overall status badge (COMPLETE, INCOMPLETE, or NEEDS_REVIEW), a one-line summary, then a list of each required document with a green check (FOUND), red X (MISSING), or amber warning (NEEDS_REVIEW), the matched file name, and feedback. There may also be a blue "Suggestions" box.
  5. Click **Close** (or the X) to dismiss.
- **Expected result:** The pop-up opens with sensible per-document feedback in plain language. If you click "Check with AI" on a process with no uploads, you instead get a red toast "No documents uploaded yet for this process." If the AI fails, you get "AI check failed. Please try again."

---

### "Ask AI" - per-document chat assistant

- **What it does:** Opens a chat where the client can ask questions about one specific required document - what it is, what it should contain, how to obtain it, and (if they uploaded a file) whether it looks correct. Answers are tailored to Albanian legal/business context.
- **Who can access it:** The logged-in client. The "Ask AI" link sits next to each document in a process's "Required Documents" list.
- **Steps to test:**
  1. Log in as `client@alpha.com` / `client123` and open the "Processes" section.
  2. On any process, find a document in the "Required Documents" list and click its **Ask AI** link (speech-bubble icon).
  3. A chat pop-up opens titled "Ask AI: <document name>" with a hint suggesting questions like "What exactly do I need?".
  4. Type a question (e.g. "What is this document and how do I get it?") and press Enter or click the send (arrow) button.
  5. Wait for the "Thinking..." indicator to be replaced by the answer.
  6. Ask a follow-up question to confirm the chat remembers the conversation.
  7. Close with the X.
- **Expected result:** Your question appears as a teal bubble on the right; the AI reply appears as a grey bubble on the left in plain text (no bold/markdown). Replies are relevant to that document. If the AI fails, a red toast "Failed to get AI response. Please try again." appears and your question is removed so you can retry.

---

### "Talk to your team" - chat with assigned Kreston staff

- **What it does:** A collapsible panel in the left sidebar listing the Kreston people this client is allowed to message (their account manager, plus any staff working on one of their tasks). Clicking a person opens a real chat window for back-and-forth messages.
- **Who can access it:** The logged-in client only (the panel is part of the client sidebar).
- **Steps to test:**
  1. Log in as `client@alpha.com` / `client123`.
  2. In the left sidebar, find the "TALK TO YOUR TEAM" header and click it to expand. The sidebar widens and a list of contact cards appears.
  3. Each card shows a person's initials, name, and context underneath ("Your account manager" for the manager, or "Working on: <task title>" for others).
  4. Click a contact card. A chat window opens with that person's name at the top.
  5. Type a message in the box at the bottom and press Enter (or click **Send**).
  6. Close the chat with the X or the Escape key.
- **Expected result:** The contact list loads (spinner first, then cards). Your sent message appears immediately as a teal bubble on the right with a timestamp. If the client has no manager and no tasks, the panel shows "No team contacts yet" instead.

---

### Team chat reply (two-window test)

- **What it does:** Confirms the chat is two-way - a Kreston staff member can reply and the client sees the message.
- **Who can access it:** Client and the staff member on the other side.
- **Steps to test (two windows):**
  1. Window A: log in as `client@alpha.com` / `client123`, expand "Talk to your team", open the chat with the account manager, and send a message such as "Hello, I have a question."
  2. Window B (different browser or incognito): log in as `admin@kreston.al` / `admin123`, open that client's conversation from the staff messaging area, and send a reply.
  3. Return to Window A and re-open the same conversation if needed.
- **Expected result:** The staff reply appears in the client's chat window as a grey bubble on the left, with the client's own messages still showing as teal bubbles on the right. Messages persist when you close and re-open the conversation.

---

### "Team Progress" - what Kreston is doing per process

- **What it does:** Inside each process card, shows the tasks Kreston's team is handling for that process, with the document name, who is handling it, and a status label.
- **Who can access it:** The logged-in client. Only appears on processes that have linked team tasks.
- **Steps to test:**
  1. Log in as `client@alpha.com` / `client123` and open the "Processes" section.
  2. On a process card, look for a "Team Progress" sub-section.
  3. Read each row: a document/task name, "Handled by <role or name>", and a colored status pill.
- **Expected result:** Each row shows a status such as Pending, In Progress, Under Review, Approved, or Done, with a matching color. This is read-only for the client (they cannot change it).

---

### Active submissions reminder banner

- **What it does:** When the client has one or more processes still in progress, a yellow banner near the bottom of the dashboard reminds them they can upload requested documents, with a quick Upload shortcut.
- **Who can access it:** The logged-in client. Only shows when the client has at least one active (incomplete or under-review) submission.
- **Steps to test:**
  1. Log in as `client@alpha.com` / `client123`.
  2. Scroll to the bottom of the dashboard.
- **Expected result:** A yellow/amber banner reads "You have N active submission(s)" with "If your team has asked for documents, you can upload them here." and an **Upload** button. If the client has no active submissions, the banner does not appear.

---

### Client account creation (registration) - staff-only, cross-check

- **What it does:** This is how a client account actually gets created. There is NO public self-signup. A Kreston manager/partner/admin registers the client, which creates both the client record and a login account with the default password `client123`.
- **Who can access it:** Only Kreston staff with role ADMIN, PARTNER, or MANAGER. A client cannot register themselves, and a regular client login cannot create accounts.
- **Steps to test:**
  1. Log in as a Kreston manager/admin (e.g. `admin@kreston.al` / `admin123`).
  2. Go to the Clients area and add a new client, filling in company name, contact name, and contact email (phone and industry are optional).
  3. Save, then log out.
  4. On the login page, sign in with the email you just entered and the password `client123`.
- **Expected result:** The new client can log in and lands on their own `/dashboard/client` portal. If you try to register a client with an email that already exists, the system refuses with "A client with this email already exists." (Note: this registration screen lives on the staff side; it is included here only because it is the origin of every client login. There is no client-facing signup form.)

---

### Access control - clients only see their own data

- **What it does:** Confirms a client cannot see another company's information or reach staff-only screens.
- **Who can access it:** All client logins (used here to verify isolation).
- **Steps to test:**
  1. Log in as `client@alpha.com` / `client123` and note the company name (Alpha Corp) and its numbers.
  2. Log out and log in as `anisa@betaconsulting.al` / `client123`.
  3. Compare the welcome name, processes, tasks, and metrics.
  4. While logged in as a client, try to reach a staff page by editing the address bar (for example change `/dashboard/client` to `/dashboard/admin`).
- **Expected result:** Each client only ever sees their own company name, processes, documents, tasks, and contacts - never another client's. Attempting to open a staff-only page as a client should not show staff data (you should be redirected or blocked).
