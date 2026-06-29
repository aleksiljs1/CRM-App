# Section 7: Clients, Processes & Templates

This section covers the firm-side (staff) tools for managing the client portfolio, the service "Processes" that define which documents are required (used mainly by the **Legal** and **Audit** departments), and the reusable **Document Templates** with fill-in-the-blank placeholders. It also covers how staff see the documents a client uploads and how the AI (Google Gemini) checks those documents. All testing is done in the live app at https://kreston-crm.onrender.com — log in with the staff accounts listed in each feature.

**Logins you will use here:**
- `admin@kreston.al` / `admin123` (Admin — full access)
- `partner@kreston.al` / `partner123` (Partner)
- `legal.manager@kreston.al` / `legal123` (Legal department manager)
- `audit.manager@kreston.al` / `audit123` (Audit department manager)

---

## CLIENTS

### View the client list / portfolio
- **What it does:** Shows the firm's clients as cards with their name, company, and a colored status badge (Lead, Prospect/Active, Churned/Inactive).
- **Who can access it:** Any logged-in staff member. Admins and Partners see all clients; Managers see clients in their department or assigned to them; other staff see only clients assigned to them personally.
- **Steps to test:**
  1. Log in as `admin@kreston.al`.
  2. In the left menu, open **Clients** (Admins can also use the admin Clients page which shows the full table with edit controls).
  3. Look at the list of clients.
- **Expected result:** You see client cards/rows, each with the client name, company name, and a status badge. If there are no clients you see a friendly "No clients yet" empty-state message instead of a blank screen.

### Add a new client
- **What it does:** Creates a brand-new client record (company, contact, email, phone, industry, status) and assigns it to a staff member.
- **Who can access it:** Admin, Partner, and Manager only. Other roles will not see the "Add Client" button.
- **Steps to test:**
  1. Log in as `admin@kreston.al` and open the Clients page (the admin Clients page has the full add form).
  2. Click **Add Client** (the green button with a plus icon).
  3. Fill in Company name, Contact name, and Contact email (these three are required). Optionally add Phone, Industry, choose a Status, and pick a staff member to assign.
  4. Click **Create** / **Save**.
- **Expected result:** A green success toast appears and the new client shows up in the list immediately. If you leave a required field empty, the form stops you and will not save.

### Edit a client
- **What it does:** Lets you change an existing client's company, contact details, industry, status, or assignment.
- **Who can access it:** Admin, Partner, Manager.
- **Steps to test:**
  1. Log in as `admin@kreston.al` and open the admin Clients page.
  2. Find a client row and click the **pencil (edit)** icon.
  3. Change a field (for example the phone number or status) and click **Save**.
- **Expected result:** A success toast appears and the client row updates with your changes.

### Assign a client to a staff member
- **What it does:** Sets which employee "owns" / manages the client account. This drives who can see the client and who the client can message.
- **Who can access it:** Admin, Partner, Manager (done inside the Add/Edit client form).
- **Steps to test:**
  1. Open the Add or Edit client form (admin Clients page).
  2. In the **Assigned to** dropdown, pick a staff member.
  3. Save.
- **Expected result:** The client now shows that staff member as its account manager. That staff member will see this client in their own client list.

### Change client status (Lead / Active / Inactive)
- **What it does:** Tracks where the client is in the relationship using a colored badge — Lead (amber), Active (green), Inactive/Churned (red/grey).
- **Who can access it:** Admin, Partner, Manager (via the Edit form). Everyone can see the badge.
- **Steps to test:**
  1. Edit a client and change the **Status** dropdown to a different value (e.g. Lead -> Active).
  2. Save and look at the client's badge in the list.
- **Expected result:** The badge color and label update to match the new status.

### Filter clients by status
- **What it does:** Quick tabs at the top of the Clients page (All, Leads, Prospects, Active, Churned) narrow the list to one status, each with a count.
- **Who can access it:** Any logged-in staff member.
- **Steps to test:**
  1. Open the Clients page.
  2. Click each filter tab in turn (e.g. **Active**, then **Leads**).
- **Expected result:** The list shows only clients matching the chosen status, and the selected tab is highlighted. Clicking **All** shows everyone again.

### Search clients
- **What it does:** Lets you type to find a client by company name or contact name.
- **Who can access it:** Any logged-in staff member.
- **Steps to test:**
  1. Open the Clients page.
  2. Type part of a company or contact name into the **Search clients...** box.
- **Expected result:** The list narrows to matching clients as you type. Clearing the box restores the full list. (Search ignores upper/lower case.)

### Invite a client (creates a portal login)
- **What it does:** Creates a client record AND a portal user account with a randomly generated temporary password, so the client can log in to their own portal. The screen then shows the email and temporary password to hand to the client.
- **Who can access it:** Admin, Partner, Manager only.
- **Steps to test:**
  1. Log in as `admin@kreston.al` and open the Clients page.
  2. Click **Invite Client** (paper-plane icon) or **Add Client**.
  3. Fill in Company name, Contact name, and Contact email (required); optionally Phone and Industry.
  4. Click **Create client**.
  5. On the success screen, click **Copy** to copy the credentials.
- **Expected result:** A success toast ("Client created") appears, the dialog switches to a **"Client created"** view showing the client's **Email** and a **Temporary password**, and the Copy button confirms "Credentials copied". The new client appears with status **Lead**. Note: if the email is already used by a user you get an error ("A user with this email already exists") and no client is created.

### Register a client from inside a Process (quick add)
- **What it does:** A shortcut inside the "New Process" screen to register a new client without leaving the page. It creates the client (status Active) and a portal login with the default password `client123`.
- **Who can access it:** Legal/Audit Managers and Admin (the people who can create processes).
- **Steps to test:**
  1. Log in as `legal.manager@kreston.al`.
  2. Go to **Legal Processes** and click **New Process**.
  3. Next to "Attach to Client", click **+ Register New Client**.
  4. Fill Company name, Contact full name, and Contact email (required), then click **Register Client**.
- **Expected result:** The form clears and the new client immediately appears in the "Attach to Client" dropdown. If the email already exists, an alert says a client with that email already exists.

### Export clients to Excel
- **What it does:** Downloads the client list as an Excel (.xlsx) file.
- **Who can access it:** Admin, Partner, Manager (the **Export Clients** button only shows for these roles).
- **Steps to test:**
  1. Open the Clients page as `admin@kreston.al`.
  2. Click **Export Clients** (download icon).
- **Expected result:** An Excel file downloads to your computer and a green toast says "Excel exported successfully". If the download fails you instead see a red "Export failed" toast.

### Delete a client
- **What it does:** Removes a client from the portfolio.
- **Who can access it:** Admin (on the admin Clients page).
- **Steps to test:**
  1. Log in as `admin@kreston.al`, open the admin Clients page.
  2. Click the **trash** icon on a client row and confirm.
- **Expected result:** The client is removed from the list and a confirmation toast appears.

---

## PROCESSES (workflows with required documents)

> Processes are mainly for the **Legal** and **Audit** departments. A process is a service type (e.g. "Company Registration", "Annual Financial Audit") that lists the documents the client must provide and the documents the firm's team must produce.

### View Legal/Audit processes
- **What it does:** Lists the department's processes. Each row shows the name, an optional description, and two badges: how many **client** documents and how many **internal** documents are required. Expanding a row shows the full document checklist.
- **Who can access it:** Legal Manager, Audit Manager (sees only their own department), and Admin (sees all). Other roles see "Access restricted to Legal department managers and administrators."
- **Steps to test:**
  1. Log in as `legal.manager@kreston.al`.
  2. Open **Legal Processes** from the menu.
  3. Click the arrow (chevron) on the left of a process row to expand it.
- **Expected result:** You see the process list (or a "No legal processes yet" empty state). Expanding a row reveals two grouped sections — **Client Documents** (blue) and **Internal Documents** (violet) — each item showing its name, description, and a red **Mandatory** or grey **Optional** tag.

### Create a new process from scratch
- **What it does:** Builds a new process by entering a name, optional description, and adding required documents one at a time, marking each as Client- or Internal-provided and Mandatory or Optional.
- **Who can access it:** Legal/Audit Managers (only for their own department) and Admin.
- **Steps to test:**
  1. Log in as `legal.manager@kreston.al` and open **Legal Processes**.
  2. Click **New Process**.
  3. Type a Process Name (e.g. "Test Process") and an optional Description.
  4. Under **Client Documents**, click **Add**, type a document name, and toggle Mandatory on/off. Repeat under **Internal Documents** if you want.
  5. Click **Create Process**.
- **Expected result:** The dialog closes and the new process appears in the list with the correct client/internal document counts. (The Create button is greyed out until you enter a name.)

### Start a process from a pre-built template
- **What it does:** Loads a ready-made process (e.g. "Company Registration (SHPK)", "Contract Review", "Annual Financial Audit", "Internal Controls Review") with its full document checklist already filled in, so you only need to review and tweak before creating.
- **Who can access it:** Legal/Audit Managers and Admin (inside the New Process dialog).
- **Steps to test:**
  1. In the **New Process** dialog, open the **"Start from a template"** dropdown.
  2. Pick a "Pre-built Process Template" (e.g. *Annual Financial Audit*).
  3. Review the auto-filled name, description, and the long Client/Internal document lists; edit anything if you wish.
  4. Click **Create Process**.
- **Expected result:** The name, description, and both document lists fill in automatically with a note "Template loaded with all documents. Edit anything below before creating." After clicking Create, the process appears in the list with all those documents.

### Attach a process to a specific client
- **What it does:** Links the new process to one client so a submission (document checklist for that client) is created for them automatically.
- **Who can access it:** Legal/Audit Managers and Admin.
- **Steps to test:**
  1. In the **New Process** dialog, use the **Attach to Client** dropdown and pick a client (or leave "No client (internal process)").
  2. Finish creating the process.
- **Expected result:** If a client was chosen, that client now has a pending submission for this process (it appears in their portal as documents to upload, and on the process row as a status chip).

### Add or remove required documents on an existing process
- **What it does:** Lets you add a new required document, or delete one, on an already-created process. You set whether it's a Client or Internal document and whether it's Mandatory.
- **Who can access it:** Admin (on the **Process Type Management** page under Admin).
- **Steps to test:**
  1. Log in as `admin@kreston.al` and open **Process Type Management**.
  2. Expand a process and click **Add Document**; fill the name, choose Client/Internal, tick or untick Mandatory, click **Add**.
  3. To remove one, click the **trash** icon on a document, then click the **check** to confirm.
- **Expected result:** The document list updates immediately — the new document appears, or the deleted one disappears.

### Edit / activate-deactivate / delete a process type (Admin)
- **What it does:** Admin-only management of all process types across every department: edit name/department/description, toggle Active/Inactive, or delete the whole process.
- **Who can access it:** Admin only.
- **Steps to test:**
  1. Log in as `admin@kreston.al`, open **Process Type Management** (Manage view).
  2. Click the **pencil** to edit a process; change the name or untick **Active**; click **Update**.
  3. To delete, click the **trash** icon then the **check** to confirm.
- **Expected result:** Edited processes show updated details (and an Active/Inactive badge). Deactivated processes are hidden from the normal Legal/Audit process lists. Deleted processes disappear. Processes are grouped by department with a count.

### Track which documents a client submitted (Process Progress)
- **What it does:** A "Progress" view showing, per process, how many clients have submitted, a progress bar for each client (matched documents out of required), the submission status, and any linked team tasks.
- **Who can access it:** The progress data comes from the stats endpoint which is **Admin and Partner only**. Admin views it on the Process Type Management page.
- **Steps to test:**
  1. Log in as `admin@kreston.al` and open **Process Type Management**.
  2. Click the **Progress** tab at the top right.
  3. Expand a process to see its client submissions and team tasks.
- **Expected result:** Each process shows totals (number of clients, number of tasks). Expanding shows each client's name, a progress bar with "X/Y" documents matched, and a status pill (Incomplete / Under Review / Approved / Complete). Team tasks show who they're assigned to and their status.

---

## CLIENT SUBMISSIONS & AI DOCUMENT CHECKING (staff side)

### See a client's submitted documents on the process row
- **What it does:** On the Legal/Audit Processes list, each process that has client submissions shows a small chip per client with the company name and the submission status (Incomplete / Approved / Complete).
- **Who can access it:** Legal/Audit Managers and Admin (whoever can view the process).
- **Steps to test:**
  1. Make sure a client has uploaded documents for a process (see the client-portal section, or use a process already attached to a client).
  2. Log in as `legal.manager@kreston.al`, open **Legal Processes**, and look at the process rows.
- **Expected result:** Under the process name you see one chip per client, e.g. "Acme LLC — COMPLETE" (green) or "— INCOMPLETE" (amber).

### AI automatically matches uploaded documents to the checklist
- **What it does:** When a client uploads files, Google Gemini reads each file's name and a preview of its contents and decides which required document each upload satisfies. It then marks the submission **Complete** (all required docs matched) or **Incomplete** (some missing).
- **Who can access it:** This runs automatically when a CLIENT uploads. Staff see the result; the notification goes to the client's account manager, the department manager, and anyone with a linked task.
- **Steps to test:**
  1. Log in to the client portal (e.g. a client invited earlier, password `client123` or the temp password), pick a process, and upload one or more files.
  2. Wait a few seconds — the AI check uses Google Gemini, so allow time for it to respond.
  3. Log in as `legal.manager@kreston.al` (or the assigned manager) and check your notifications / the process row.
- **Expected result:** A notification arrives titled "Client Uploaded Documents" or "Client Documents Complete," listing how many documents matched and which are still missing. The submission status updates to Complete or Incomplete accordingly. (If the AI is unavailable it falls back to simple filename matching, so a result still appears.)

### AI document verification check (deeper review)
- **What it does:** A second, more detailed AI check (Gemini) that reads each uploaded document and reports, per required document, whether it was Found / Missing / Needs Review, with feedback and suggestions, plus an overall status.
- **Who can access it:** This particular check is triggered from the **client** portal (the client clicks a "check my documents" action), but the verified result is stored on the submission for staff to see.
- **Steps to test:**
  1. From the client portal, open a submission and trigger the document check.
  2. Wait for Gemini to respond (this can take several seconds — do not refresh repeatedly).
- **Expected result:** A result appears with an overall status (COMPLETE / INCOMPLETE / NEEDS_REVIEW), a short summary, a per-document breakdown (status, which file matched, feedback), and suggestions. The result is saved so staff see the same assessment.

---

## DOCUMENT TEMPLATES

> Templates are reusable documents (e.g. a Power of Attorney) containing fill-in fields written as `{{placeholderName}}`. The system auto-detects the placeholders and lets you fill them in to produce a finished document. Templates are a **Legal department + Admin** feature.

### View document templates
- **What it does:** Lists saved templates, each showing its name, an optional linked process, how many fill-in fields it has, and who created it. Expanding shows the placeholder tags and the raw template text.
- **Who can access it:** Admin and Legal Manager only. (Audit Manager and other roles cannot access the Templates API.)
- **Steps to test:**
  1. Log in as `legal.manager@kreston.al`.
  2. Open **Settings** (department settings) and scroll to the **Document Templates** section.
  3. Click the arrow on a template to expand it.
- **Expected result:** You see the template list (or "No templates yet. Create your first template to get started."). Expanding shows the `{{field}}` tags and the full template content.

### Create a document template
- **What it does:** Creates a new template with a name, optional description, optional linked process, and content containing `{{placeholder}}` fields. The system automatically detects the placeholders from the content.
- **Who can access it:** Admin and Legal Manager.
- **Steps to test:**
  1. As `legal.manager@kreston.al`, open the **Document Templates** section and click **New Template**.
  2. Enter a Name (required) and optionally a Description and a linked Process.
  3. In **Template Content** (required), type some text including fields like `Hello {{clientName}}, your NIPT is {{nipt}}.`
  4. Notice the **Detected placeholders** chips appear (e.g. clientName, nipt).
  5. Click **Create**.
- **Expected result:** A "Template created" toast appears and the template shows in the list with the correct field count. If you leave Name or Content empty you get a "Name and content are required" error toast.

### Edit a document template
- **What it does:** Updates an existing template's name, description, linked process, or content (placeholders are re-detected from the new content).
- **Who can access it:** Admin and Legal Manager.
- **Steps to test:**
  1. In the Document Templates list, click the **pencil (Edit)** icon on a template.
  2. Change the content (e.g. add a new `{{field}}`), then click **Update**.
- **Expected result:** A "Template updated" toast appears and the template reflects your changes, including any newly detected fields.

### Delete a document template
- **What it does:** Permanently removes a template.
- **Who can access it:** Admin and Legal Manager.
- **Steps to test:**
  1. Click the **trash** icon on a template.
  2. Confirm the browser "Are you sure?" prompt.
- **Expected result:** A "Template deleted" toast appears and the template disappears from the list.

### Fill / use a template
- **What it does:** Opens a form with one box per placeholder; as you type, a live preview on the right shows the finished document with your values filled in. You can then copy it or download it as a text file.
- **Who can access it:** Admin and Legal Manager.
- **Steps to test:**
  1. Click **Use** (play icon) on a template.
  2. Type values into the placeholder fields on the left (e.g. clientName = "Acme LLC").
  3. Watch the **Live Preview** on the right update.
  4. Click **Copy to Clipboard**, then click **Download as Text**.
- **Expected result:** The preview replaces each `{{field}}` with your typed value as you type. "Copy to Clipboard" shows a "Copied to clipboard" toast; "Download as Text" downloads a `.txt` file named after the template. Fields you leave blank stay shown as `{{field}}` in the preview.

---

## General things to verify across this section

- **Toasts:** Successful actions (create, update, delete, export, copy) show a short green message; failures show a red one. Confirm they appear and then fade.
- **Empty states:** Clients, Processes, and Templates each show a clear "nothing here yet" message (never a blank screen) when there is no data.
- **Role restrictions:** Logging in as a non-manager staff member or as `audit.manager@kreston.al` for Templates should hide or block the management actions. Non-Legal/non-Admin users opening the Legal Processes page should see the "Access restricted" message.
- **AI wait time:** Anything that says it checks documents uses Google Gemini and may take several seconds. Wait for the result rather than refreshing.
