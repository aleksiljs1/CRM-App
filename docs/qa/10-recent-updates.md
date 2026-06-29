# Section 10: Latest Updates — Targeted Tests

These features were added or changed after the first version of this guide.
They are grouped here so reviewers can test the newest behaviour quickly.
Where a feature is also described earlier, that section is noted.

## Email & Clients

### Incoming emails are automatically linked to a client
- **What it does:** When an email arrives from an address that matches a
  client's registered contact email, the system automatically tags that email
  to that client. This is what lets the firm (and the AI) recognise client mail.
- **Who can access it:** Applies to every inbox; Admin/Partner see all emails,
  other staff see their own connected inbox.
- **Steps to test:**
  1. Log in as Admin -> open **Clients** (Admin -> Clients) and either pick an
     existing client or add one, setting its **contact email** to an address you
     can actually send from (e.g. your own spare Gmail).
  2. Log in as a normal user (e.g. audit.senior@kreston.al / audit123) and
     connect a mailbox under **Settings -> Email** (see Section 4).
  3. From the address you set as the client's contact email, send a message to
     the connected mailbox.
  4. Wait ~10 seconds with the **Emails** tab open, then open the new email.
- **Expected result:** The email appears and is associated with that client
  (the client's name/company shows on the email). Mail from an unknown address
  is not linked to any client.
- **Note:** Matching is on the exact registered address. A client writing from a
  different address will not be linked.

### AI "Sort by importance" now prioritises registered clients
- **What it does:** The AI email sorter now knows which emails come from
  registered clients and pushes them higher up the list when urgency is
  otherwise similar, so paying clients are dealt with first.
- **Who can access it:** Manager, Admin, Partner (the AI sort button is hidden
  for other roles). Uses Google Gemini, so allow a few seconds.
- **Steps to test:**
  1. Make sure the inbox has a **mix of unread emails**: at least one from a
     registered client (set up using the test above) and at least one from a
     non-client address, ideally with similar wording so urgency is comparable.
  2. As a Manager/Admin/Partner, open **Emails** and click the AI
     **Sort by importance / Prioritise** button.
  3. Wait for the AI to finish (spinner).
- **Expected result:** After sorting, the email from the registered client is
  ranked **above** the comparable non-client email. (Genuinely urgent non-client
  mail can still outrank a routine client message — client status is a boost,
  not an absolute override.)
- **Note:** AI ordering is generated fresh each time, so exact positions can
  vary slightly between runs; the client email should consistently be near the
  top.

## Tasks

### Auto-assignment now covers ALL active tasks (not only reviews)
- **What it does:** Previously the department timer only auto-assigned unclaimed
  *review* tasks. It now also picks up unclaimed tasks in **To Do** and
  **In Progress**. If a task sits unassigned in its current status longer than
  the department's set time, the system assigns it to the least-busy eligible
  person. Review tasks go to a Senior/Associate; other tasks go to the least-busy
  team member (Senior/Associate/Junior/Assistant/Intern). Finished tasks
  (Approved/Completed) are ignored.
- **Who can access it:** A Manager sets the time for **their own department**
  (Department Settings); the rule then applies to that department's tasks. Each
  department can have its own value (default 24 hours).
- **Steps to test:**
  1. Log in as a Manager (e.g. audit.manager@kreston.al / audit123).
  2. Open **Department Settings** and set **"Auto-assign after"** to the minimum
     (1 hour). Save.
  3. Make sure there is at least one **unassigned** task in your department that
     has been in its status for longer than that time (the seeded demo data
     includes older unassigned tasks; or create one and treat the wait as the
     clock).
  4. Open the **Tasks** page and leave it open (the check runs about every 60
     seconds while a manager has Tasks open).
- **Expected result:** Within about a minute, an eligible unassigned task that
  has waited past the threshold is assigned automatically; you see a
  "task(s) auto-assigned" message, the assignee and the department manager get a
  notification, and the task now shows an assignee.
- **Note:** The threshold is measured in **hours**, so for an instant live demo
  use a task that already entered its status more than an hour ago. The timer is
  checked while a Manager (or above) has the Tasks page open — it is not a
  background server job.
