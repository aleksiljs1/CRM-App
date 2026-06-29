# Section 9: Performance, Notifications & Export

This section covers three sets of features that touch many parts of the Kreston CRM: the **personal performance scorecard** that every staff member gets (with an animated score, ranking, and metric breakdown), the **AI-powered performance tools** for managers and bosses (an AI period report, plus saved report history that can be exported), the **notification bell** in the top bar (unread badge, dropdown list, mark-as-read, and live pop-up alerts), and the **"Export to Excel" buttons** that appear across the app. The live app is at **https://kreston-crm.onrender.com**. Everything below is written click-by-click so no technical knowledge is needed.

> **About the AI features:** The app uses Google's Gemini AI to write the performance reports and tips. AI takes a few seconds to think (often 3-10 seconds), so when you click an AI button you will see a spinning loader first. This is normal - please wait, do not click again.

> **Login accounts used in this section:**
> - **Staff (personal scorecard):** `audit.senior@kreston.al` / `audit123` - this is "Jeta Rexhepi".
> - **Manager:** `audit.manager@kreston.al` / `audit123` (sees only their own department).
> - **Admin:** `admin@kreston.al` / `admin123` (sees the whole firm).

---

## Features

### My Performance scorecard (personal score & ranking)
- **What it does:** Shows a logged-in staff member their own performance score out of 100, an animated circular gauge, a coloured status label, and where they rank against everyone else in the firm.
- **Who can access it:** Any non-admin staff member (Senior, Associate, Junior, Intern, etc.). Use `audit.senior@kreston.al` / `audit123`.
- **Steps to test:**
  1. Log in as `audit.senior@kreston.al`.
  2. In the left-hand menu click **My Performance**.
  3. Watch the big number in the middle of the ring - it should count up from 0 to the final score and stop.
  4. Look just below for the coloured status pill, then look for the "Your ranking" line.
- **Expected result:** You see a large circular gauge with a score (0-100). The ring and number are colour-coded: green with the word "Excellent" if the score is 80 or higher, amber with "On track" if 60-79, or red with "Needs focus" if under 60. You also see "Your ranking #X of Y employees" and a row of small numbered chips with your own rank highlighted in teal. A department tag (e.g. "AUDIT") shows in the top-right.

### Score breakdown metric cards
- **What it does:** Shows the six numbers that feed into the performance score, each on its own little card with an icon and a trend note.
- **Who can access it:** Same as above - any staff member on their **My Performance** page.
- **Steps to test:**
  1. While on **My Performance** (logged in as `audit.senior@kreston.al`), scroll down below the big gauge to the "Score breakdown" area.
  2. Read each of the six cards.
- **Expected result:** Six cards appear: **Tasks Completed** (shown as completed/total, e.g. 12/20), **On-time Rate** (a %), **High Priority Done** (a number), **Emails Handled** (a number), **Clients Managed** (a number), and **Avg Tasks / Month** (a number). Each card has an icon and a small trend line underneath (e.g. "↑ 5% vs last month"). Hovering a card lifts it slightly.

### Loading and error states on My Performance
- **What it does:** Shows a spinner while the score is being calculated, and a friendly message if it cannot load.
- **Who can access it:** Any staff member.
- **Steps to test:**
  1. Log in as `audit.senior@kreston.al` and click **My Performance**.
  2. Watch the screen for the first moment it opens.
- **Expected result:** A spinning teal circle appears briefly while data loads, then the scorecard appears. If data genuinely cannot be loaded you would instead see a short red error message instead of a blank page.

### AI Period Report (manager / boss view)
- **What it does:** Generates an AI-written performance report for a chosen time window (Today, This Week, or This Month). For each employee it gives a score, a short summary, and tips for the manager, plus an overall department health summary.
- **Who can access it:** ADMIN, PARTNER, and MANAGER only. A Manager sees only their own department; Admin/Partner see everyone. Use `audit.manager@kreston.al` / `audit123` or `admin@kreston.al` / `admin123`.
- **Steps to test:**
  1. Log in as `audit.manager@kreston.al`.
  2. Open the performance area from the menu (e.g. **Team & Performance** / **AI Performance Tracker**).
  3. In the "AI Period Report" box, click one of the three pills: **Today**, **This Week**, or **This Month** (This Week is selected by default).
  4. Click the **Generate Report** button.
  5. Wait a few seconds for Gemini to respond (a spinning brain animation shows "AI is generating ... report").
- **Expected result:** After the wait, a teal "Overview" banner appears with a 2-3 sentence department summary, followed by a grid of employee cards. Each card shows a coloured score circle (green/amber/red), a short summary, an amber "Manager Tips" box, and a clickable "X completed tasks" line that expands to list the tasks with their priority and hours taken. If something goes wrong you see a red "Failed to generate report" message.

### Expand completed-tasks list inside a report
- **What it does:** Lets you open or close the list of tasks an employee finished, shown inside each employee card of an AI report.
- **Who can access it:** ADMIN, PARTNER, MANAGER (anyone viewing an AI report).
- **Steps to test:**
  1. After generating an AI Period Report (above), find an employee card that shows "X completed tasks".
  2. Click that line.
- **Expected result:** The list expands to show each task title, a coloured priority tag (URGENT/HIGH/MEDIUM/LOW), and how many hours it took. Clicking the line again collapses it.

### Report History (saved past reports)
- **What it does:** Keeps a list of the last reports that were generated, so they can be reviewed again later without re-running the AI.
- **Who can access it:** ADMIN, PARTNER, MANAGER. Managers see only their department's reports; Admin/Partner see all.
- **Steps to test:**
  1. Log in as `audit.manager@kreston.al` and open the performance/AI tracker page.
  2. Generate at least one AI Period Report (see above) so history has something in it.
  3. Scroll to the "Report History" section.
- **Expected result:** A table lists past reports with Date & Time, a "how long ago" note, the Period (Day/Week/Month tag), the Department, and who generated it. A counter shows how many reports exist. If none exist yet, it says "No reports generated yet."

### View a historical report
- **What it does:** Re-opens a previously generated report full-screen so you can read it again.
- **Who can access it:** ADMIN, PARTNER, MANAGER.
- **Steps to test:**
  1. In the "Report History" table, click the **View** (eye icon) button on any row.
  2. To leave, click **Back to Current** at the top.
- **Expected result:** The full report opens with an amber "Historical Report" banner naming the date, period, and who generated it, followed by the same overview banner and employee cards as a fresh report. "Back to Current" returns you to the main view.

### Export a historical report to Excel
- **What it does:** Downloads the report you are viewing as an Excel (.xlsx) file with one row per employee.
- **Who can access it:** ADMIN, PARTNER, MANAGER.
- **Steps to test:**
  1. Open a historical report with **View** (above).
  2. Click the **Export Report** button (download icon) in the amber banner.
- **Expected result:** An Excel file named like `kreston_performance-report_2026-06-29.xlsx` downloads. A small "Excel exported successfully" toast appears (or "Export failed" if it could not). Opening the file shows columns: Name, Score, Summary, Manager Tips, Tasks Completed. The header row is white text on a teal background and has filter arrows.

### Export Employee Performance Scores to Excel
- **What it does:** Downloads the full performance scoreboard for all visible employees as an Excel file.
- **Who can access it:** ADMIN, PARTNER, MANAGER (Manager gets only their department; Admin/Partner get everyone).
- **Steps to test:**
  1. Log in as `audit.manager@kreston.al` (or `admin@kreston.al`).
  2. On the performance/AI tracker page, scroll to "Employee Performance Scores".
  3. Click **Export Scores** (download icon), or on the Admin firm-wide page click **Export Performance**.
- **Expected result:** An Excel file `kreston_performance_<date>.xlsx` downloads with a "Performance Scores" sheet. Columns include Rank, Name, Role, Sub-Role, Department, Score, Tasks Completed, Total Tasks, On-Time %, High Priority Done, Emails Handled, Clients Managed, Avg Pickup Hours, Avg Cycle Hours, and Revisions. A success toast shows on the page.

### Firm-Wide Performance Dashboard (Admin)
- **What it does:** Gives admins a firm-level view: department comparison table, top 10 performers, department workload health, and an overdue-tasks alert. Includes its own Export button.
- **Who can access it:** ADMIN (and Partner). Use `admin@kreston.al` / `admin123`.
- **Steps to test:**
  1. Log in as `admin@kreston.al`.
  2. Open **Firm Performance** from the menu.
- **Expected result:** You see four sections - Department Comparison (employees, open/completed tasks, completion %, overdue), Top 10 Performers (ranked with scores and on-time %), Department Health cards labelled Underloaded / Balanced / Overloaded with colour coding, and an Overdue Tasks Alert table (or a green "all on track!" message if none). An **Export Performance** button at the top downloads the scores spreadsheet.

### Permission check on performance pages
- **What it does:** Stops ordinary staff from seeing firm-wide / team performance data and AI reports - those are manager/admin only.
- **Who can access it (the protected data):** ADMIN, PARTNER, MANAGER. Ordinary staff are blocked.
- **Steps to test:**
  1. Log in as `audit.senior@kreston.al` (ordinary staff).
  2. Confirm your menu shows **My Performance** but NOT the team/AI performance tracker or firm-wide dashboard.
- **Expected result:** Staff only see their own scorecard. The manager/admin performance data, AI reports, report history, and Excel exports are not available to them (the system rejects such requests as "Forbidden").

### Notification bell - unread count badge
- **What it does:** A bell icon in the top bar shows a small red badge with the number of unread notifications.
- **Who can access it:** Every signed-in user.
- **Steps to test:**
  1. Log in as any user (e.g. `audit.senior@kreston.al`).
  2. Look at the top-right of the screen for the bell icon.
- **Expected result:** If there are unread notifications, a red circle with a number sits on the bell. If the number is over 99 it shows "99+". If everything is read, there is no red badge.

### Notification bell - dropdown list
- **What it does:** Clicking the bell opens a panel listing your most recent notifications (up to 20), newest first.
- **Who can access it:** Every signed-in user.
- **Steps to test:**
  1. Click the bell icon in the top bar.
  2. Read the panel that opens, then click anywhere outside it.
- **Expected result:** A dropdown opens titled "Notifications". Each item shows an icon matching its type, a title, a short message, and a "time ago" stamp (e.g. "5m ago"). Unread items have a bolder title, a tinted teal background, and a small teal dot. If you have none, it says "No notifications". Clicking outside the panel closes it.

### Notification types and their icons
- **What it does:** Different kinds of notifications show different icons so you can tell them apart at a glance: EMAIL (envelope), TASK (checkbox), DOCUMENT (file), SYSTEM (info "i").
- **Who can access it:** Every signed-in user.
- **Steps to test:**
  1. Open the notification dropdown (click the bell).
  2. Compare the round icons on the left of each row.
- **Expected result:** Email-related notices show an envelope icon, task notices show a checkbox icon, document notices show a file icon, and system messages show an info icon. Unread icons are teal; read ones are grey.

### Mark a single notification as read (and follow its link)
- **What it does:** Clicking a notification marks it read and, if it has a link, jumps you to the relevant page.
- **Who can access it:** Every signed-in user.
- **Steps to test:**
  1. Open the bell dropdown.
  2. Click an unread notification (one with the teal dot).
- **Expected result:** That item changes to the read style (no dot, lighter text), the red badge count drops by one, and if the notification points somewhere (e.g. a task or email) you are taken to that page and the dropdown closes.

### Mark all notifications as read
- **What it does:** Clears all unread notifications at once.
- **Who can access it:** Every signed-in user (the option only shows when you have unread items).
- **Steps to test:**
  1. Make sure you have at least one unread notification (red badge visible).
  2. Open the bell dropdown and click **Mark all read** (top-right of the panel).
- **Expected result:** Every item switches to the read style, the red badge disappears, and the "Mark all read" link goes away.

### Real-time new-notification pop-ups (live)
- **What it does:** When a new notification is created for you, it appears instantly without refreshing - it pops into the list, the badge goes up by one, and a small toast slides in. (There is also an automatic refresh every 30 seconds as a backup.)
- **Who can access it:** Every signed-in user.
- **Steps to test (best with two browser windows):**
  1. Open the app in Window A logged in as `audit.senior@kreston.al` and keep the bell visible.
  2. In Window B, log in as `audit.manager@kreston.al` (or admin) and do something that notifies Jeta - for example assign her a task, send an email to her department, or send her a chat message.
  3. Watch Window A without refreshing.
- **Expected result:** Within a moment, Window A shows a small pop-up toast with the notification title and message, the red badge on the bell increases by one, and the new item appears at the top of the dropdown list. If the live pop-up does not appear, it will still show up within about 30 seconds because of the automatic refresh.

### Export to Excel - Tasks
- **What it does:** Downloads the task list as an Excel file.
- **Who can access it:** ADMIN, PARTNER, MANAGER (Manager gets only their department).
- **Steps to test:**
  1. Log in as `audit.manager@kreston.al` (or admin).
  2. Go to the **Tasks** page.
  3. Click the **Export** button (download icon).
- **Expected result:** A file `kreston_tasks_<date>.xlsx` downloads with columns Title, Status, Priority, Assigned To, Created By, Client, Department, Deadline, Created, Completed, and Time in Progress (hrs). Header row is white-on-teal with filter arrows.

### Export to Excel - Clients
- **What it does:** Downloads the client list as an Excel file.
- **Who can access it:** ADMIN, PARTNER, MANAGER (Manager gets only clients in their department).
- **Steps to test:**
  1. Log in as a manager or admin and open the **Clients** page.
  2. Click the **Export** button.
- **Expected result:** A file `kreston_clients_<date>.xlsx` downloads with columns Company, Contact Name, Email, Phone, Industry, Status, Assigned To, and Created.

### Export to Excel - Emails
- **What it does:** Downloads the emails list as an Excel file.
- **Who can access it:** ADMIN, PARTNER, MANAGER (Manager gets only their department's emails).
- **Steps to test:**
  1. Log in as a manager or admin and open the **Emails** page.
  2. Click the **Export** button.
- **Expected result:** A file `kreston_emails_<date>.xlsx` downloads with columns From, Subject, Department, Received, Read (Yes/No), Replied (Yes/No), Replied At, and AI Importance.

### Export to Excel - Team Members
- **What it does:** Downloads the team roster with per-person task stats as an Excel file.
- **Who can access it:** ADMIN, PARTNER, MANAGER (Manager gets only their department).
- **Steps to test:**
  1. Log in as `audit.manager@kreston.al` and open the **Team & Performance** / team page.
  2. Click the **Export** button.
- **Expected result:** A file `kreston_team_<date>.xlsx` downloads with columns Name, Email, Role, Sub-Role, Department, Total Tasks, Completed, In Progress, Overdue, Completion Rate %, and Emails Handled.

### Export to Excel - Dashboard KPIs
- **What it does:** Downloads the dashboard's key numbers (KPIs) as a small two-column Excel file.
- **Who can access it:** ADMIN, PARTNER, MANAGER (Manager gets their department's numbers; Admin gets firm-wide).
- **Steps to test:**
  1. Log in as `audit.manager@kreston.al` and go to the manager **Dashboard**.
  2. Click the **Export KPIs** button.
- **Expected result:** A file `kreston_dashboard-kpis_<date>.xlsx` downloads with two columns (Metric, Value) listing Total Employees, Active Clients, Open Tasks, Completion Rate %, Unread Emails, and Pending Submissions.

### Export button - loading and result feedback
- **What it does:** Every Export button disables itself and shows a spinner while building the file, then shows a small toast saying it succeeded or failed.
- **Who can access it:** ADMIN, PARTNER, MANAGER.
- **Steps to test:**
  1. On any page with an Export button (Tasks, Clients, Emails, Team, Performance, KPIs), click **Export**.
  2. Watch the button and the bottom-right of the screen.
- **Expected result:** The button shows a spinning icon and cannot be clicked again until done. When finished, the .xlsx file downloads and a brief toast appears (green/teal "Excel exported successfully", or red "Export failed").

### Export permission check
- **What it does:** Prevents ordinary staff and clients from exporting data - only managers and bosses can.
- **Who can access it:** ADMIN, PARTNER, MANAGER only.
- **Steps to test:**
  1. Log in as `audit.senior@kreston.al` (ordinary staff).
  2. Note that the export buttons described above do not appear on the pages staff can see.
- **Expected result:** Ordinary staff have no export buttons, and any attempt to export is rejected by the system as "Forbidden". Only Admin, Partner, and Manager accounts can download these spreadsheets.
