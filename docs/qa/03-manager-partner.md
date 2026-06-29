# Section 3: Manager & Partner Tools

This section covers everything a Manager or Partner uses to run their team: the management dashboards, the team roster (with per-person task history and adding employees), the client pipeline board, AI-powered performance tracking, department settings (auto-assign rule and Legal document templates), and the firm-wide reports/analytics page. Most data is scoped by department: a Manager sees only their own department, while Partners and Admins see firm-wide. Several performance features call Google's Gemini AI to generate written reviews and reports.

Logins you will use in this section:
- Manager: `audit.manager@kreston.al` / `audit123` (any department works, e.g. `hr.manager@kreston.al` / `hr123`)
- Partner: `partner@kreston.al` / `partner123`
- Admin: `admin@kreston.al` / `admin123`
- Staff (to test "no access"): `<dept>.<level>@kreston.al` / `<dept>123`, e.g. `audit.senior@kreston.al` / `audit123`

The live app is at https://kreston-crm.onrender.com.

---

### Manager Management Dashboard
- **What it does:** The Manager's home screen. Shows department-scoped headline numbers (employees, active clients, open tasks, completion rate), a platform stats strip, two charts, a department workload table, upcoming deadlines, quick action links, and recent activity.
- **Who can access it:** Manager (sees only their own department). Partner/Admin see a firm-wide version of this page.
- **Steps to test:**
  1. Log in as `audit.manager@kreston.al` / `audit123`.
  2. Go to the Manager dashboard (the default landing page after login, or via the sidebar).
  3. Read the title at the top - it should name your department (e.g. "Audit Management Dashboard") and show today's date.
  4. Look at the four big "Overview" cards: Total Employees, Active Clients, Open Tasks, Completion Rate (shown as a percentage with "X of Y tasks completed" beneath).
  5. Look at the "Platform" strip: Total tasks, Completed, Unread emails, Pending submissions.
  6. Scroll to "Trends" and confirm the two charts: "Tasks by Team" (open tasks per person) and "Tasks by Status".
  7. Scroll to the "Department Workload" table and "Upcoming deadlines" list.
- **Expected result:** All numbers and lists load with real data for your department. The department name appears in the title and in a pill in the top-right. Charts show data, or show "No open tasks" / "No upcoming deadlines" if empty.

### Dashboard "Export KPIs" button
- **What it does:** Downloads the dashboard's key numbers as an Excel file.
- **Who can access it:** Manager / Partner / Admin (whoever can see the dashboard).
- **Steps to test:**
  1. On the Manager dashboard, find the "Export KPIs" button in the top-right.
  2. Click it.
- **Expected result:** An Excel (.xlsx) file downloads to your computer.

### Dashboard quick-action links and "View Team" button
- **What it does:** Shortcut buttons that jump to other manager screens.
- **Who can access it:** Manager / Partner / Admin.
- **Steps to test:**
  1. On the dashboard, click the "View Team" button (top-right).
  2. Go back, then in the "Quick actions" section click each tile: My Team, Client Pipeline, Team Performance, Reports.
- **Expected result:** Each click opens the matching page (Team, Client Pipeline, Performance, Reports). "View all" next to deadlines opens the Tasks page.

### Department Workload table (color-coded ratios)
- **What it does:** Lists each department with its staff count, open task count, and a tasks-per-person ratio. The ratio is color-coded: green when under 3, amber when 3-5, red when above 5.
- **Who can access it:** Manager (their department), Partner/Admin (all departments).
- **Steps to test:**
  1. On the dashboard, scroll to "Department Workload".
  2. Check the Ratio column colors.
- **Expected result:** Each row shows Department, Staff, Open tasks, and a colored ratio pill. If a department has tasks but zero staff, the ratio shows "N/A".

### Partner Overview Dashboard
- **What it does:** The Partner's firm-wide home screen with overview cards, a platform strip, two activity charts (Emails received, Tasks completed), quick actions, and a recent-activity area.
- **Who can access it:** Partner.
- **Steps to test:**
  1. Log in as `partner@kreston.al` / `partner123`.
  2. Open the Partner dashboard.
  3. Confirm the title reads "Partner Overview" with a "Partner" pill top-right.
  4. Click the "View Reports" button top-right.
- **Expected result:** The page loads with overview cards and two trend charts. Note for testers: several Partner-dashboard numbers (Total Clients, Open Tasks, Total Employees, the percentage stats, and the trend charts) are placeholder/demo values and may show 0 or fixed figures like "94%" - this is expected current behavior, not a bug. The "Recent activity" area shows a "Nothing to review yet" empty state. "View Reports" opens the Reports page.

### Team page - tabs (Team / Performance)
- **What it does:** The Team page has two tabs at the top: "Team" (member cards) and "Performance" (loads the AI Performance Tracker inside the same page).
- **Who can access it:** Manager / Partner / Admin. (Staff can open the page and see colleagues, but do not get the Add Employee / Export buttons.)
- **Steps to test:**
  1. Log in as a Manager and open My Team (`/dashboard/manager/team`).
  2. Confirm the "Team" tab is selected by default.
  3. Click the "Performance" tab.
- **Expected result:** "Team" shows overview cards and member cards. Clicking "Performance" swaps the view to the AI Performance Tracker (see Performance features below).

### Team overview stat cards
- **What it does:** Four summary cards above the member list: Team Members, Avg Completion, Open Tasks, Overdue Tasks (the Overdue card turns red when above zero).
- **Who can access it:** Anyone who can open the Team page.
- **Steps to test:**
  1. On the Team tab, look at the four cards across the top.
- **Expected result:** Numbers match the team shown. Avg Completion is the average completion rate across members. Overdue Tasks shows red styling only when greater than 0.

### Team member cards
- **What it does:** One card per colleague showing avatar initials, name, email, role (or sub-role) badge, a completion-rate progress bar, a stats grid (Total / Completed / In Progress / Overdue), emails sent, a "View Tasks" link, and a per-person task history panel.
- **Who can access it:** Manager sees their department's members; Partner/Admin see all non-client users.
- **Steps to test:**
  1. On the Team tab, look at the member cards grid.
  2. Pick one card and read the badge (purple = Manager, blue = Senior, etc.), the green progress bar, and the four stat numbers.
  3. Click "View Tasks" on a card.
- **Expected result:** Each card shows correct stats. "View Tasks" opens the Tasks workspace page.

### View a member's tasks by period (Day / Week / Month)
- **What it does:** Each member card has a "View Tasks:" toggle with Today / Week / Month buttons. Clicking one fetches that person's tasks for the period and shows a summary (completed / active / overdue) plus a task list with status, priority, and hours-to-complete.
- **Who can access it:** Manager / Partner / Admin can view any member; a regular staff user can only view their own.
- **Steps to test:**
  1. On a member card, click "Today" under "View Tasks:".
  2. Wait for the small spinner; the panel expands showing a summary row and a task list.
  3. Click "Week", then "Month" to switch periods.
  4. Click the active period button again to collapse the panel.
- **Expected result:** The summary shows counts in green (completed), blue (active), and red (overdue, only if any). The task list shows each task with a status pill, priority pill, and "Xh" where available. If there are none, "No tasks found for this period." appears. Clicking the highlighted button again hides the panel.

### Add Employee
- **What it does:** Opens a modal to create a new staff account (name, email, password, role, optional sub-role). For a Manager, the new employee is automatically placed in the Manager's own department. Allowed roles are Senior, Associate, Junior, Assistant, Intern only - you cannot create another Manager, Partner, Admin, or Client.
- **Who can access it:** Manager / Partner / Admin only (button is hidden for staff).
- **Steps to test:**
  1. On the Team tab, click "Add Employee" (top-right).
  2. Fill in Name, Email (e.g. `test.new@kreston.al`), and a Password.
  3. Pick a Role from the dropdown. Note the Department badge is fixed to your department with "Auto-set to your department".
  4. Click "Create Employee".
- **Expected result:** The modal closes, a green toast "Employee created" appears bottom-right, and the new person shows up as a card in the team grid. If the email already exists, an inline red error "An employee with this email already exists" appears and nothing is created.

### Export Team (Excel)
- **What it does:** Downloads the team roster and stats as an Excel file.
- **Who can access it:** Manager / Partner / Admin (button hidden for staff).
- **Steps to test:**
  1. On the Team tab, click "Export Team".
- **Expected result:** An Excel file downloads and a green toast "Excel exported successfully" appears (or "Export failed" if something goes wrong).

### Team empty / loading / error states
- **What it does:** Shows a spinner while loading, a friendly empty message if there are no team members, and an error message if the data fails to load.
- **Who can access it:** Anyone on the Team page.
- **Steps to test:**
  1. Open the Team page and watch the brief loading spinner.
  2. (If a department has no staff) confirm the "No team members found" message with a people icon.
- **Expected result:** Spinner during load; "No team members found / There are no employees in your department yet." when empty.

### Client Pipeline board
- **What it does:** A Kanban-style board with three columns - Leads, Active, Inactive - each holding client cards. Above the board are three summary stat cards (one per stage), a filter pill bar, and a search box.
- **Who can access it:** Manager / Partner / Admin via `/dashboard/manager/clients`.
- **Steps to test:**
  1. Log in as a Manager and open Client Pipeline (from the dashboard quick action or sidebar).
  2. Confirm the three summary cards (Leads / Active / Inactive) and the three board columns.
  3. Read a client card: company name, industry tag, contact name + email, who it's assigned to, counts for active tasks and submissions, last-email time, and "Created X ago".
- **Expected result:** Clients appear in the correct column for their status, with accurate counts. Empty columns show "No clients". Note: the cards are not drag-and-drop in this version - status is shown, not changed by dragging.

### Pipeline filter pills and search
- **What it does:** The filter pills (All / Leads / Active / Inactive, each with a count) narrow the board to one stage. The search box filters by company name or contact name.
- **Who can access it:** Manager / Partner / Admin.
- **Steps to test:**
  1. On the pipeline, click the "Leads" pill - only the Leads column shows.
  2. Click "All" to bring back all three columns.
  3. Type part of a company name into the search box.
- **Expected result:** Clicking a pill shows only that stage's column (the pill counts update with the search). Typing in search filters cards live; clearing it restores the full list.

### Export Clients (Excel)
- **What it does:** Downloads the client list as an Excel file.
- **Who can access it:** Manager / Partner / Admin.
- **Steps to test:**
  1. On the Client Pipeline, click "Export Clients".
- **Expected result:** An Excel file downloads with a green "Excel exported successfully" toast (or red "Export failed").

### Invite a new client (with generated credentials)
- **What it does:** Opens a "New client" modal. After you fill in company/contact details (and optionally assign to a Manager/Partner/Admin), the system creates the client account and shows a one-time email + temporary password to copy.
- **Who can access it:** Manager / Partner / Admin.
- **Steps to test:**
  1. On the pipeline, click "New client".
  2. Fill in Company name, Contact name, and Contact email (these are required). Phone, Industry, and "Assign to" are optional.
  3. Click "Create client".
  4. On the success screen, click the copy icons next to Email and Temporary password.
  5. Click "Done".
- **Expected result:** A green success box appears showing the client's sign-in email and a temporary password (with a note that they won't be shown again). Copy buttons show "Email copied" / "Password copied" toasts. After "Done", the new client appears on the board (usually in Leads). If a required field is empty, an inline red error appears instead.

### Department Settings - Review Auto-Assignment
- **What it does:** Sets how many hours the system waits before auto-assigning a review task (if no reviewer was picked) to the Senior or Associate with the fewest active reviews in your department. Value must be 1-168 hours.
- **Who can access it:** Manager / Partner / Admin via `/dashboard/manager/settings`. The API blocks anyone else.
- **Steps to test:**
  1. Log in as a Manager and open Settings.
  2. In "Review Auto-Assignment", change the number in the "Auto-assign after:" box (e.g. 12), or click a quick preset (4h / 8h / 12h / 24h / 48h).
  3. Click "Save Settings".
- **Expected result:** A green toast "Settings saved successfully" appears, and a "Last updated by <your name>" line shows beneath. Entering a value outside 1-168 is clamped back into range. The title shows your department name (e.g. "Audit & Advisory Settings").

### Document Templates (Legal / Admin only)
- **What it does:** Lets you create reusable text templates with `{{placeholder}}` fields. Each template can link to a process, be edited, deleted, expanded to preview its content, and "used" (filled in). This section only appears for the Legal department or for Admin.
- **Who can access it:** Manager of the Legal department, or Admin. (Other-department managers will NOT see this section.)
- **Steps to test:**
  1. Log in as `legal.manager@kreston.al` / `legal123` (or Admin) and open Settings.
  2. Confirm a "Document Templates" section appears below Auto-Assignment.
  3. Click "New Template", enter a Name and Content using `{{name}}` style placeholders, optionally link a process, and watch the "Detected placeholders" chips appear.
  4. Click "Create".
  5. Log in as a non-Legal manager (e.g. `audit.manager@kreston.al`) and open Settings - confirm there is NO Document Templates section.
- **Expected result:** As Legal/Admin you can create the template (toast "Template created") and it appears in the list with a process badge and a field-count badge. Non-Legal managers see only the Auto-Assignment section.

### Edit / Delete / Expand a template
- **What it does:** Each template card has Use, Edit (pencil), and Delete (trash) actions, plus a chevron to expand and preview the full content and placeholder list.
- **Who can access it:** Legal Manager / Admin.
- **Steps to test:**
  1. On a template card, click the chevron to expand it and read the content preview.
  2. Click the pencil to edit, change something, and click "Update".
  3. Click the trash icon and confirm the browser prompt.
- **Expected result:** Expand shows placeholder chips and the raw content. Edit saves with toast "Template updated". Delete shows a confirm dialog, then removes the card with toast "Template deleted".

### Use a template (fill placeholders, copy, download)
- **What it does:** Opens a fill modal with one input per placeholder and a live preview. You can copy the filled text to clipboard or download it as a .txt file.
- **Who can access it:** Legal Manager / Admin.
- **Steps to test:**
  1. On a template card, click "Use".
  2. Type values into the placeholder fields and watch the live preview update on the right.
  3. Click "Copy to Clipboard", then click "Download as Text".
- **Expected result:** The preview replaces each `{{field}}` with what you typed. Copy shows "Copied to clipboard"; Download saves a .txt file named after the template.

### AI Performance Tracker (Performance Scores table)
- **What it does:** Ranks employees by an automatically calculated performance score (0-100, color-coded) and shows per-person stats: tasks completed/total, on-time rate, high-priority count, average tasks per month, emails handled, and clients managed. Scores are computed from real task/email/client data (not AI).
- **Who can access it:** Manager (own department only), Partner / Admin (firm-wide). Staff get a 403 from the API.
- **Steps to test:**
  1. Log in as a Manager, open My Team, and click the "Performance" tab (or open `/dashboard/manager/performance`).
  2. Scroll to "Employee Performance Scores".
  3. Read the ranked table - rank number, name/email, score pill (green 80+, amber 60-79, red below), and the per-person columns.
- **Expected result:** Employees are listed top-to-bottom by score. A Manager sees only their own department's people; Partner/Admin see everyone. If there's no data, "No employee performance data available" shows.

### Export Performance Scores (Excel)
- **What it does:** Downloads the performance scores table as Excel.
- **Who can access it:** Manager / Partner / Admin.
- **Steps to test:**
  1. In the Performance Scores section, click "Export Scores".
- **Expected result:** An Excel file downloads with a green "Excel exported successfully" toast.

### Generate AI Period Report (Day / Week / Month) — uses Gemini AI
- **What it does:** Picks a time period and asks Google Gemini AI to write a performance report: an overall summary plus a per-employee card with a score, written summary, "Manager Tips", and a collapsible list of completed tasks. Generated reports are also saved to history.
- **Who can access it:** Manager / Partner / Admin.
- **Steps to test:**
  1. On the Performance page, find the "AI Period Report" box near the top.
  2. Choose a period pill (Today / This Week / This Month).
  3. Click "Generate Report".
  4. Wait through the animated "AI is generating..." loader.
  5. When results appear, click the "X completed tasks" toggle on an employee card to expand the task list.
- **Expected result:** After a short wait, a teal "Overview" summary box appears followed by employee cards sorted by score, each with a summary, amber "Manager Tips", and an expandable completed-tasks list. This is AI-generated text (Gemini). If it fails, a red "Failed to generate report. Please try again." message shows.

### Report History (view / export past reports)
- **What it does:** A table of previously generated AI reports with date/time, period, department, who generated it, and a "View" button. Viewing opens the saved report full-screen with a "Back to Current" button and an "Export Report" Excel button.
- **Who can access it:** Manager / Partner / Admin.
- **Steps to test:**
  1. After generating at least one report, scroll to "Report History".
  2. Click "View" on a row.
  3. On the historical view, click "Export Report", then "Back to Current".
- **Expected result:** History lists saved reports with a count badge. "View" shows the full saved report inside an amber "Historical Report" banner. "Export Report" downloads Excel ("Excel exported successfully" toast). "Back to Current" returns to the live page. If none exist yet, "No reports generated yet." shows.

### Firm Analytics / Reports page (Admin only)
- **What it does:** The firm-wide analytics page at `/dashboard/reports`: KPI cards (active clients, leads, open/overdue tasks, unread emails, submissions in progress with trend pills), trend charts (emails, tasks completed, new clients), task distribution by department/status/priority, a client submission funnel, average task-completion and email-response times by department, a top-10 workload chart, a full department breakdown table, and a recent audit-log activity list.
- **Who can access it:** Admin ONLY. Important: although the Manager and Partner dashboards have "Reports" buttons linking here, the page redirects any non-Admin user back to the dashboard.
- **Steps to test:**
  1. Log in as `admin@kreston.al` / `admin123` and open `/dashboard/reports`.
  2. Confirm the "Firm Analytics" title and the six KPI cards, then scroll through Trends, Task distribution, Submission funnel, Performance & SLA, Workload, Department breakdown, and Recent activity.
  3. Log out and log in as `partner@kreston.al` / `partner123` (or a Manager), then click the "View Reports" / "Reports" button.
- **Expected result:** As Admin, the full analytics page loads with real firm-wide data and charts. As Partner or Manager, clicking through to `/dashboard/reports` redirects you back to the dashboard (you do NOT see the analytics page). Note this for testers: the dashboard "Reports" links are only functional for Admin.

### Department scoping check (Manager vs Partner/Admin)
- **What it does:** Confirms that a Manager only sees their own department's data across these tools, while Partner/Admin see firm-wide.
- **Who can access it:** Test with both a Manager and a Partner/Admin login.
- **Steps to test:**
  1. Log in as `audit.manager@kreston.al` and note the team members, clients, and performance rows - all should be Audit.
  2. Log out and log in as `partner@kreston.al` (or Admin) and open the same Team and Performance pages.
- **Expected result:** The Manager's lists are limited to their department. The Partner/Admin lists include people and clients across all departments.
