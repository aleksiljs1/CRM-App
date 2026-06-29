# Section 2: Admin Console

The Admin Console is the system-wide control center for the Kreston CRM. An Admin can manage every user and client, view a firm-wide activity audit trail, define service processes and required documents, oversee tasks across all departments, monitor firm-wide performance, and review read-only system settings. This guide walks through every admin feature step by step in plain language.

**Before you start:** Open https://kreston-crm.onrender.com and log in as the Admin account: **admin@kreston.al / admin123**. After logging in, you will see the left-hand sidebar with a group of admin links: **Users**, **Clients (Admin)**, **Audit Log**, **Processes**, **Tasks (All Depts)**, **Firm Performance**, and **System Settings**. All admin pages are restricted to the Admin role — other logins are bounced back to their own dashboard if they try to open these pages.

---

## Admin Overview (Dashboard)

### Admin overview stat cards
- **What it does:** Shows four big number cards at the top of the admin home page: Total Users, Total Clients, Total Tasks, and Active Departments.
- **Who can access it:** Admin (admin@kreston.al / admin123).
- **Steps to test:**
  1. Log in as Admin.
  2. You land on the Admin Overview page (or click **Dashboard** in the sidebar).
  3. Look at the row of four cards near the top under the "Overview" label.
- **Expected result:** Four cards show whole numbers. The values should look believable for the firm (for example, Total Users matches the number of people you see on the Users page).

### Platform strip (small stats)
- **What it does:** A row of four smaller stat tiles: Total emails, Active users (shown as a percentage), System health (always shows "On track"), and Inactive users (a count).
- **Who can access it:** Admin.
- **Steps to test:**
  1. On the Admin Overview page, look at the "Platform" row below the four big cards.
- **Expected result:** Four tiles appear. "Active users" shows a percentage, "System health" always reads "On track", and "Inactive users" shows a whole number.

### Trend charts (Email volume & Tasks completed)
- **What it does:** Two area charts showing email volume and completed tasks per day over the last 14 days.
- **Who can access it:** Admin.
- **Steps to test:**
  1. On the Admin Overview page, scroll to the "Trends" section.
  2. Hover your mouse over points on each chart.
- **Expected result:** Two charts labeled "Email volume" and "Tasks completed" (both "Last 14 days"). Hovering shows the count for each day. If there is no activity, the charts show a flat line at zero.

### Quick action shortcuts
- **What it does:** Four shortcut cards that jump to Manage Users, All Clients, Reports, and Tasks.
- **Who can access it:** Admin.
- **Steps to test:**
  1. On the Admin Overview page, scroll to "Quick actions".
  2. Click each card one at a time (use the browser Back button to return).
- **Expected result:** "Manage Users" opens the Users page, "All Clients" opens the admin Clients page, "Reports" opens firm-wide reports, and "Tasks" opens the all-departments tasks board.

### Recent activity (users) list
- **What it does:** Lists up to the first 5 users, each with a colored dot (green-ish = active, gray = inactive), name, email, department, and role badge.
- **Who can access it:** Admin.
- **Steps to test:**
  1. On the Admin Overview page, scroll to "Recent activity".
- **Expected result:** Up to 5 user rows appear. Active users have a colored dot; inactive users have a gray dot. If there are no users at all, you see an empty state reading "No users yet".

---

## User Management

Open from the sidebar: **Users**.

### View users list and totals
- **What it does:** Shows all staff users in a table (Name, Email, Role, Sub-role, Department, Status, Actions), with a count line showing total users and how many are active.
- **Who can access it:** Admin only. Other roles are redirected away.
- **Steps to test:**
  1. Click **Users** in the sidebar.
  2. Read the subtitle under the "User Management" heading.
- **Expected result:** A table of users loads (a spinner shows briefly first). The subtitle reads something like "X users total · Y active". On a narrow screen, Email/Sub-role/Department columns are hidden.

### Search users
- **What it does:** Filters the user list by name or email as you type.
- **Who can access it:** Admin.
- **Steps to test:**
  1. On the Users page, type part of a name (e.g. "admin") into the "Search name or email..." box.
- **Expected result:** The table narrows to matching users almost immediately. Clearing the box restores the full list.

### Filter users by department, role, and status
- **What it does:** Three dropdowns narrow the list by Department, Role, and Active/Inactive status. Filters combine.
- **Who can access it:** Admin.
- **Steps to test:**
  1. On the Users page, pick a value in the "All Departments" dropdown.
  2. Pick a Role in the "All Roles" dropdown.
  3. Pick "Active" or "Inactive" in the "All Status" dropdown.
- **Expected result:** The table updates after each choice to show only matching users. Setting a dropdown back to its "All..." option removes that filter. If nothing matches, an empty state reads "No users found / Try adjusting your filters."

### Create a new user
- **What it does:** Opens a form to add a new staff member with name, email, password, role, optional sub-role, and optional department.
- **Who can access it:** Admin.
- **Steps to test:**
  1. On the Users page, click **Add User** (top right).
  2. Fill in Name and Email (both required), and a Password (required for new users).
  3. Choose a Role (defaults to ASSOCIATE). Optionally type a Sub-role (e.g. "Senior Auditor") and pick a Department.
  4. Click **Create User**.
- **Expected result:** The dialog closes, a green toast reads "User created", and the new user appears in the table. The Create button stays disabled until Name, Email, and Password are all filled. Note: the CLIENT role is not offered here and cannot be created. Using an email that already exists shows a red error "A user with this email already exists".

### Edit an existing user
- **What it does:** Opens the same form pre-filled to change a user's details, including an Active on/off toggle. (No password field appears when editing.)
- **Who can access it:** Admin.
- **Steps to test:**
  1. On the Users page, click the pencil (Edit) icon at the right end of a user's row.
  2. Change the name, role, sub-role, department, or flip the Active toggle.
  3. Click **Save Changes**.
- **Expected result:** The dialog closes, a green toast reads "User updated", and the row reflects your changes.

### Activate / deactivate a user
- **What it does:** The power-button icon toggles a user between Active and Inactive without opening the form.
- **Who can access it:** Admin.
- **Steps to test:**
  1. On the Users page, click the power icon in a user's Actions cell.
- **Expected result:** A toast confirms "<name> deactivated" or "<name> activated", and the Status badge flips between green "Active" and red "Inactive".

### Reset a user's password
- **What it does:** Resets the chosen user's password to a fixed default of **reset123**.
- **Who can access it:** Admin.
- **Steps to test:**
  1. On the Users page, click the key icon in a user's Actions cell.
- **Expected result:** A toast reads 'Password reset to "reset123" for <name>'. That user can now log in with the password reset123. (No confirmation dialog appears, so click carefully.)

### Toasts and loading/error states (Users)
- **What it does:** Brief green confirmation messages appear bottom-right after actions; a spinner shows while loading; an error message shows if the list fails to load.
- **Who can access it:** Admin.
- **Steps to test:**
  1. Perform any user action (create, edit, toggle, reset) and watch the bottom-right corner.
- **Expected result:** A green toast appears for ~3 seconds then disappears. While the page first loads you see a spinner.

---

## Client Management (Admin)

Open from the sidebar: **Clients (Admin)**.

### View clients list and status counts
- **What it does:** Shows all client accounts in a table (Company, Contact, Email, Phone, Industry, Status, Assigned To, Actions) with a summary line of total clients and counts of active, leads, and inactive.
- **Who can access it:** Admin only.
- **Steps to test:**
  1. Click **Clients (Admin)** in the sidebar.
  2. Read the subtitle under "Client Management".
- **Expected result:** The clients table loads (spinner first). The subtitle reads "X clients · Y active · Z leads · W inactive". Empty/missing phone or industry shows a dash.

### Search clients
- **What it does:** Filters clients by company name or contact (also matches contact email behind the scenes).
- **Who can access it:** Admin.
- **Steps to test:**
  1. On the Clients page, type into "Search company or contact...".
- **Expected result:** The table narrows to matching clients as you type.

### Filter clients by status and industry
- **What it does:** Two dropdowns filter by Status (LEAD/ACTIVE/INACTIVE) and by Industry (the industry list is built from existing clients).
- **Who can access it:** Admin.
- **Steps to test:**
  1. On the Clients page, choose a Status in the "All Statuses" dropdown.
  2. Choose an Industry in the "All Industries" dropdown.
- **Expected result:** The table updates to match. If nothing matches, the empty state reads "No clients found".

### Add a new client
- **What it does:** Opens a form to create a client with company name, contact name, contact email (all required), optional phone, industry, status, and an assigned employee.
- **Who can access it:** Admin.
- **Steps to test:**
  1. On the Clients page, the modal opens via the edit flow; to add, note: the page header button is **Export Clients**, and the create form is reached by editing — to create a brand-new client, use the form fields after clicking into the modal. (Fill Company Name, Contact Name, Contact Email.)
  2. Optionally set Phone, Industry, Status (defaults to LEAD), and Assigned Employee.
  3. Click **Create Client**.
- **Expected result:** The dialog closes, a green toast reads "Client created", and the new client appears at the top of the list (sorted by most recently updated). The Create button stays disabled until the three required fields are filled.

### Edit a client
- **What it does:** Opens a pre-filled form to change any client field, including reassigning the responsible employee.
- **Who can access it:** Admin.
- **Steps to test:**
  1. On the Clients page, click the pencil (Edit) icon on a client's row.
  2. Change any field (e.g. Status from LEAD to ACTIVE, or pick a different Assigned Employee).
  3. Click **Save Changes**.
- **Expected result:** The dialog closes, a green toast reads "Client updated", and the row reflects the change. The Status badge color matches the new status (amber=Lead, green=Active, red=Inactive).

### Delete a client (with confirmation)
- **What it does:** Removes a client after a confirmation dialog warning that the action cannot be undone.
- **Who can access it:** Admin.
- **Steps to test:**
  1. On the Clients page, click the trash (Delete) icon on a client's row.
  2. Read the confirmation dialog, then click **Delete** (or **Cancel** to back out).
- **Expected result:** After confirming, the client disappears and a toast reads "<company> deleted". Clicking Cancel closes the dialog and changes nothing.

### Export clients to Excel
- **What it does:** Downloads the client list as an Excel (.xlsx) file.
- **Who can access it:** Admin.
- **Steps to test:**
  1. On the Clients page, click **Export Clients** (top right, with a download icon).
- **Expected result:** An Excel file downloads (named like kreston_clients.xlsx). Open it to confirm client data is present. If the export fails, nothing visibly happens (it fails silently).

---

## Audit Log

Open from the sidebar: **Audit Log**.

### View the audit trail
- **What it does:** Lists all recorded system activity (Timestamp, User, Action, Entity, Entity ID, Details), 25 entries per page, newest first. The header shows the total number of entries.
- **Who can access it:** Admin only. Non-admins are redirected to the dashboard.
- **Steps to test:**
  1. Click **Audit Log** in the sidebar.
- **Expected result:** A table of activity loads (spinner first). The subtitle reads "Track all system activity · N total entries". Action labels are color-coded: green for create/add, red for delete/remove, blue for everything else.

### Search audit entries
- **What it does:** Searches by action text, entity type, or entity ID. Typing is debounced (waits ~0.4 seconds after you stop typing).
- **Who can access it:** Admin.
- **Steps to test:**
  1. On the Audit Log page, type a word like "create" or "update" into "Search action or entity...".
- **Expected result:** After a brief pause, the table shows only matching entries and resets to page 1.

### Filter audit log by entity type
- **What it does:** Limits entries to one entity type: Task, Email, User, or Client.
- **Who can access it:** Admin.
- **Steps to test:**
  1. On the Audit Log page, pick a type in the "All entity types" dropdown.
- **Expected result:** The table shows only entries for that entity type and jumps to page 1.

### Filter audit log by user
- **What it does:** Shows only activity performed by a chosen user.
- **Who can access it:** Admin.
- **Steps to test:**
  1. On the Audit Log page, pick a name in the "All users" dropdown.
- **Expected result:** The table shows only that user's entries.

### Filter audit log by date range
- **What it does:** Two date pickers (From / To) limit entries to a date window. The "To" date includes the full day.
- **Who can access it:** Admin.
- **Steps to test:**
  1. On the Audit Log page, set a "From date" and/or a "To date".
- **Expected result:** Only entries within the chosen range appear, resetting to page 1. Combine with other filters to narrow further.

### Expand entry details
- **What it does:** Shows the raw change details for entries that have them, in an expandable panel.
- **Who can access it:** Admin.
- **Steps to test:**
  1. On the Audit Log page, find a row whose Details column shows a "View" link.
  2. Click **View** to expand, then **Hide** to collapse.
- **Expected result:** Clicking View shows a formatted block of details under the row; clicking Hide closes it. Rows with no details show a dash instead of a link.

### Audit log pagination
- **What it does:** Moves through pages of 25 entries with Previous/Next buttons.
- **Who can access it:** Admin.
- **Steps to test:**
  1. On the Audit Log page (if there are more than 25 entries), click **Next**, then **Previous**.
- **Expected result:** The footer shows "Page X of Y · N entries". Previous is disabled on the first page; Next is disabled on the last page.

### Audit log empty state
- **What it does:** Shows a friendly message when no entries match.
- **Who can access it:** Admin.
- **Steps to test:**
  1. Apply a filter that matches nothing (e.g. a far-future date range).
- **Expected result:** An empty state reads "No audit log entries found" with hint text "Try adjusting your filters." (or "System activity will appear here." if no filters are set).

---

## Process Type Management

Open from the sidebar: **Processes**. This page has two tabs at the top right: **Manage** and **Progress**.

### View process types grouped by department (Manage tab)
- **What it does:** Lists all service/process types grouped by department, each showing its name, description, Active/Inactive badge, and required-document count.
- **Who can access it:** Admin only.
- **Steps to test:**
  1. Click **Processes** in the sidebar (the **Manage** tab is selected by default).
- **Expected result:** Processes appear in sections by department, each with a count badge. If there are none, an empty state reads "No process types yet".

### Add a process type
- **What it does:** Creates a new process type with a name, department, optional description, and Active checkbox.
- **Who can access it:** Admin.
- **Steps to test:**
  1. On the Processes page (Manage tab), click **Add Process Type**.
  2. Enter a Name (required), choose a Department, optionally add a Description, and leave "Active" checked.
  3. Click **Create**.
- **Expected result:** The dialog closes and the new process appears in its department group. The Create button is disabled until a Name is typed.

### Edit a process type
- **What it does:** Updates an existing process type's name, department, description, or active status.
- **Who can access it:** Admin.
- **Steps to test:**
  1. On a process row, click the pencil (Edit) icon.
  2. Change a field and click **Update**.
- **Expected result:** The dialog closes and the row reflects the change.

### Delete a process type (inline confirm)
- **What it does:** Deletes a process type after an inline check/cancel confirmation.
- **Who can access it:** Admin.
- **Steps to test:**
  1. On a process row, click the trash icon.
  2. The icons change to a check (confirm) and an X (cancel). Click the check to confirm, or the X to cancel.
- **Expected result:** Confirming removes the process from the list. Canceling leaves it unchanged.

### Expand a process to see required documents
- **What it does:** Expands a process row to list its required documents, each tagged Internal/Client and Mandatory/Optional.
- **Who can access it:** Admin.
- **Steps to test:**
  1. Click the chevron arrow at the left of a process row.
- **Expected result:** The row expands to show "Required Documents". If none exist, it reads "No required documents defined."

### Add a required document to a process
- **What it does:** Adds a document requirement (name, optional description, source = Client or Internal, and a Mandatory checkbox).
- **Who can access it:** Admin.
- **Steps to test:**
  1. Expand a process, then click **Add Document**.
  2. Type a Document name (required), optionally a description, choose Client or Internal, and check/uncheck Mandatory.
  3. Click **Add**.
- **Expected result:** The new document appears in the list with its source and mandatory tags, and the process's document count goes up by one. The Add button is disabled until a name is typed.

### Delete a required document (inline confirm)
- **What it does:** Removes a single required document after an inline check/cancel confirmation.
- **Who can access it:** Admin.
- **Steps to test:**
  1. In an expanded process, click the trash icon next to a document.
  2. Click the check to confirm or the X to cancel.
- **Expected result:** Confirming removes the document; canceling leaves it.

### Process progress view (Progress tab)
- **What it does:** Shows each process with how many client submissions and team tasks it has, expandable to see client submission progress bars and team task statuses.
- **Who can access it:** Admin.
- **Steps to test:**
  1. On the Processes page, click the **Progress** tab.
  2. Click any process to expand it.
- **Expected result:** Each process card shows counts ("clients" and "tasks"). Expanding shows "Client Submissions" with progress bars and a matched/required count, plus "Team Tasks" with status pills. If a process has no activity, it reads "No active submissions or tasks for this process yet." If there are no processes at all, it reads "No processes found".

---

## Tasks (All Departments)

Open from the sidebar: **Tasks (All Depts)**. This is a Kanban board across the whole firm.

### View the firm-wide Kanban board and counts
- **What it does:** Shows all tasks in five columns (To Do, In Progress, Review, Approved, Completed) plus status-count badges (To Do, In Progress, Review, Approved, Completed, and Overdue if any). Updates in real time as tasks change anywhere in the firm.
- **Who can access it:** Admin only. Non-admins are redirected.
- **Steps to test:**
  1. Click **Tasks (All Depts)** in the sidebar.
- **Expected result:** A five-column board loads with task cards. The count badges at the top reflect the totals. An "Overdue" red badge appears only if there are overdue tasks. Empty columns read "No tasks".

### Filter tasks by department
- **What it does:** Limits the board to one department (or All Departments).
- **Who can access it:** Admin.
- **Steps to test:**
  1. On the Tasks page, use the department dropdown (next to the filter icon).
- **Expected result:** The board reloads showing only that department's tasks.

### Search tasks
- **What it does:** Filters task cards by text.
- **Who can access it:** Admin.
- **Steps to test:**
  1. On the Tasks page, type into "Search tasks...".
- **Expected result:** Only matching task cards remain on the board.

### Create a new task (with optional AI assignment)
- **What it does:** Opens a form to create a task with title, description, optional client link, priority, deadline, department, assignee, and file attachments. An "Assign with AI" button uses Google Gemini AI to suggest the best assignee.
- **Who can access it:** Admin.
- **Steps to test:**
  1. On the Tasks page, click **New Task**.
  2. Enter a Title (required). Optionally pick a Client (this makes the task visible on the client's portal), set Priority, Deadline, Department, and Assignee.
  3. (Optional AI) Click **Assign with AI**. Wait a few seconds.
  4. (Optional) Click **Attach Files** to add PDF/Word/Excel files.
  5. Click **Create Task**.
- **Expected result:** A green toast reads "Task created successfully" and the card appears in the To Do column. For AI: after a few seconds a toast suggests a name and reason, and the Assignee dropdown auto-selects that person. (AI uses Google Gemini and can take a few seconds; if it fails you see "AI assignment failed".)

### Open a task and move it through the workflow
- **What it does:** Opens a task detail dialog showing a workflow bar, details, attachments, status timeline, and buttons to move the task forward, send it back, or reset it.
- **Who can access it:** Admin (admins can perform all transitions).
- **Steps to test:**
  1. Click any task card to open it.
  2. Click **Move to <next status>**. A small dialog asks for an optional progress note — type one or leave it blank, then confirm.
  3. For a task in Review, try **Send Back** (returns it to In Progress). For any task not in To Do, try **Reset to To Do**.
- **Expected result:** The task moves columns and a toast confirms (e.g. "Task started.", "Task approved."). If you typed a progress note, it is also posted as a comment on the task. Moving a task to Review closes the dialog.

### Assign a reviewer (Review stage)
- **What it does:** When a task is in Review, a dropdown lets the admin assign a Senior, Associate, or Manager as reviewer.
- **Who can access it:** Admin.
- **Steps to test:**
  1. Open a task that is in the Review column.
  2. In the "Assign Reviewer" box, pick a person from the dropdown.
- **Expected result:** The reviewer is assigned to the task. Only Senior/Associate/Manager appear as options.

### Add a comment to a task
- **What it does:** Posts a team-visible comment on a task.
- **Who can access it:** Admin.
- **Steps to test:**
  1. Open a task, scroll to Comments, type a message, and click **Add comment** (or press Ctrl+Enter).
- **Expected result:** The comment appears at the top of the list with your name, role, and "just now". The comment counter goes up.

### Delete a task (with confirmation)
- **What it does:** Permanently deletes a task after a browser confirmation popup.
- **Who can access it:** Admin.
- **Steps to test:**
  1. Open a task and click **Delete Task**.
  2. Confirm the browser popup "Delete this task? This cannot be undone."
- **Expected result:** The dialog closes, a toast reads "Task deleted", and the card disappears from the board. Clicking Cancel on the popup keeps the task.

### Export tasks to Excel
- **What it does:** Downloads the task list as an Excel file.
- **Who can access it:** Admin.
- **Steps to test:**
  1. On the Tasks page, click **Export Tasks** (top right).
- **Expected result:** An Excel file downloads and a toast reads "Excel exported successfully". On failure a toast reads "Export failed".

---

## Firm-Wide Performance

Open from the sidebar: **Firm Performance**.

### Department comparison table
- **What it does:** Compares departments by employees, open tasks, completed tasks, completion %, average tasks per employee, and overdue count.
- **Who can access it:** Admin only.
- **Steps to test:**
  1. Click **Firm Performance** in the sidebar (a "Computing firm-wide metrics..." spinner shows briefly).
  2. Read the "Department Comparison" table.
- **Expected result:** One row per active department. Completion % is color-coded (green ≥80%, amber ≥50%, red below). Overdue counts over 0 appear in a red pill.

### Top 10 performers table
- **What it does:** Ranks the firm's top 10 staff by a computed performance score, with their completion % and on-time %.
- **Who can access it:** Admin.
- **Steps to test:**
  1. On the Firm Performance page, read the "Top 10 Performers (Firm-Wide)" table.
- **Expected result:** Up to 10 ranked rows (1–10) with name, email, department, role, score, completion %, and on-time %. Score is color-coded like the completion rate. If there is no data, it reads "No performance data available".

### Department health cards
- **What it does:** Shows each department's workload health as Underloaded, Balanced, or Overloaded based on average tasks per person.
- **Who can access it:** Admin.
- **Steps to test:**
  1. On the Firm Performance page, view the "Department Health" cards.
- **Expected result:** Each card shows tasks/person and employee count with a colored status (green Balanced, amber Underloaded, red Overloaded).

### Overdue tasks alert
- **What it does:** Lists every overdue task firm-wide (task, department, assignee, deadline, days overdue), sorted by most overdue first.
- **Who can access it:** Admin.
- **Steps to test:**
  1. On the Firm Performance page, scroll to "Overdue Tasks Alert".
- **Expected result:** Overdue tasks appear with a red "Xd" days-overdue pill, and a red count badge shows in the section header. If nothing is overdue, you see a green check and "No overdue tasks - all on track!".

### Export performance to Excel
- **What it does:** Downloads the performance data as an Excel file.
- **Who can access it:** Admin.
- **Steps to test:**
  1. On the Firm Performance page, click **Export Performance** (top right).
- **Expected result:** An Excel file downloads. (Failures are silent.)

---

## System Settings (Read-Only)

Open from the sidebar: **System Settings**. This page is entirely read-only — there is nothing to edit here.

### SMTP (email delivery) status
- **What it does:** Shows whether outbound email is configured (SMTP Host and SMTP User each show "Set" or "Not set"). Actual values are never shown.
- **Who can access it:** Admin only.
- **Steps to test:**
  1. Click **System Settings**, view the "SMTP Configuration" card.
- **Expected result:** A green "Configured" or red "Not configured" badge, plus "Set"/"Not set" for Host and User.

### AI (Gemini) status
- **What it does:** Shows whether the Google Gemini AI key is configured and which model is used (gemini-2.5-flash).
- **Who can access it:** Admin.
- **Steps to test:**
  1. On System Settings, view the "AI Configuration" card.
- **Expected result:** A Configured/Not configured badge, an API Key "Set"/"Not set", and Model "gemini-2.5-flash".

### Department overview table
- **What it does:** Per-department counts of employees, active tasks, clients, and the auto-assign review hours setting (defaults to 24 if unset).
- **Who can access it:** Admin.
- **Steps to test:**
  1. On System Settings, view the "Department Overview" table.
- **Expected result:** One row per department with whole-number counts and an hours value.

### User statistics and role breakdown
- **What it does:** Three cards (Total Users, Active, Inactive) plus a breakdown of how many users hold each role.
- **Who can access it:** Admin.
- **Steps to test:**
  1. On System Settings, view "User Statistics".
- **Expected result:** Total = Active + Inactive. The role breakdown lists each role with its count, sorted most-common first.

### Database statistics
- **What it does:** Shows total record counts for Users, Clients, Tasks, Emails, and Notifications.
- **Who can access it:** Admin.
- **Steps to test:**
  1. On System Settings, view "Database Statistics".
- **Expected result:** Five tiles with whole-number totals.

---

## Access control (negative test)
- **What it does:** Restricts all admin pages and admin APIs to the Admin role.
- **Who can access it:** Admin only; everyone else is blocked.
- **Steps to test:**
  1. Log out and log in as a non-admin (e.g. partner@kreston.al / partner123, or audit.senior@kreston.al / audit123, or client@alpha.com / client123).
  2. Try to open an admin URL directly, e.g. https://kreston-crm.onrender.com/dashboard/admin/users or /dashboard/admin/audit-log.
- **Expected result:** You are redirected back to your normal dashboard (or denied) — non-admins cannot view or use admin features.
