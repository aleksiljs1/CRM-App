# Section 5: Tasks

The Task Management System is a Kanban-style board where each task moves through five stages: **To Do → In Progress → Review → Approved → Completed**. Managers create and assign tasks (manually or with AI help), employees pick them up and progress them, reviewers approve them, and everyone can comment and attach files. Tasks are department-scoped (you only see your own department's tasks), update live across users via real-time websockets, and there is a separate Admin view that shows every department at once.

Where to find it:
- **Team view (everyone):** the app's left menu → **Workspace → Tasks** (`/dashboard/workspace/tasks`).
- **Admin cross-department view (admin only):** **Admin → Tasks** (`/dashboard/admin/tasks`).

Login reminder: `<dept>.<level>@kreston.al` / `<dept>123` (for example `audit.manager@kreston.al` / `audit123`, `audit.senior@kreston.al` / `audit123`, `audit.junior@kreston.al` / `audit123`). Admin is `admin@kreston.al` / `admin123`.

---

### The Kanban board (5 columns)
- **What it does:** Shows all visible tasks arranged in five columns by status (To Do, In Progress, Review, Approved, Completed). Each column shows a count of how many tasks it holds.
- **Who can access it:** Everyone who is logged in.
- **Steps to test:**
  1. Log in (e.g. `audit.manager@kreston.al` / `audit123`).
  2. Open **Workspace → Tasks**.
  3. Look at the board: five columns left to right.
  4. Check the small number badge at the top of each column.
- **Expected result:** Five columns appear with their labels and a count badge each. Empty columns say "No tasks". Tasks appear as cards inside the matching column.

---

### Task card details
- **What it does:** Each task is a card showing its title, priority badge, client name (if linked), department badge, deadline, a paperclip count if it has attachments, and the assignee's first name or initials.
- **Who can access it:** Everyone.
- **Steps to test:**
  1. Open the Tasks board.
  2. Look at any task card.
  3. Note the priority colour (Urgent = red, High = orange, Medium = amber, Low = grey).
  4. Find a task with a past deadline.
- **Expected result:** Overdue tasks (deadline in the past and not Completed) get a red left border and red deadline text with a warning triangle. Deadlines read in plain language: "Due today", "Due tomorrow", "Due in 3 days", "Overdue by 2d", or a date. Cards with files show a paperclip and a number.

---

### Create a task
- **What it does:** Opens a "New Task" form to add a task with title, description, priority, deadline, assignee, optional client, optional file attachments (and, for some departments, a linked process).
- **Who can access it:** Managers and above only (MANAGER, PARTNER, ADMIN). Lower roles do not see the "New Task" button.
- **Steps to test:**
  1. Log in as `audit.manager@kreston.al` / `audit123`.
  2. Open **Workspace → Tasks** and click **New Task** (top right).
  3. Type a Title (required). Add a Description.
  4. Pick a Priority and a Deadline.
  5. Choose an "Assign to" person, or leave "Unassigned (anyone can pick up)".
  6. Click **Create Task**.
- **Expected result:** A green "Task created successfully" message appears, the form closes, and the new task appears in the **To Do** column. If you leave the title blank, the Create button stays disabled.

---

### Assign a task to a person (manual)
- **What it does:** Lets the creator pick who the task goes to from a dropdown of team members.
- **Who can access it:** Managers and above (during task creation).
- **Steps to test:**
  1. As a manager, open **New Task**.
  2. In "Assign to", pick a team member (e.g. a Junior).
  3. Create the task.
  4. Log in as that person in another window and open Tasks in "Mine" view.
- **Expected result:** The card shows the chosen person's first name. The assignee gets a "New Task Assignment" notification and sees the task under their tasks.

---

### Assign a task with AI (Gemini)
- **What it does:** Suggests the best team member for the task based on each person's current workload (active tasks, tasks completed this month, tasks in review). Uses Google's Gemini AI, so it can take a few seconds.
- **Who can access it:** Managers and above (the "Assign with AI" button is on the New Task form). The user must have a department set.
- **Steps to test:**
  1. As `audit.manager@kreston.al`, open **New Task**.
  2. Type a Title and Description.
  3. Click **Assign with AI** (next to the "Assign to" label).
  4. Wait a few seconds (the button shows "Thinking...").
- **Expected result:** A toast appears like "AI suggests: [name] — [reason]", and the "Assign to" dropdown automatically selects that person. If the AI service fails, you get "AI assignment failed". (Note: this only suggests within your own department.)

---

### Open a task (detail view)
- **What it does:** Clicking a card opens a pop-up showing the full workflow bar, description, priority, deadline, assignee, creator, client, department, attachments, status timeline, action buttons, and comments.
- **Who can access it:** Everyone (within their department; you cannot open a task from another department).
- **Steps to test:**
  1. On the board, click any task card.
  2. Scroll through the pop-up.
  3. Click the **X** (top right) to close.
- **Expected result:** A detail pop-up opens with all the task information and a coloured workflow progress bar showing the current stage in brand colour and completed stages in green.

---

### Move a task forward (change status / progress dialog)
- **What it does:** Advances a task one stage (To Do → In Progress → Review → Approved → Completed) via a "Move to ..." button. A small dialog asks for an optional progress note and optional file attachment before moving.
- **Who can access it:** Depends on role and stage:
  - Anyone assigned can do **To Do → In Progress** and **In Progress → Review**.
  - Assigned reviewers (Senior/Associate) can also do **Review → Approved**.
  - Only managers and above can do **Approved → Completed** (and all transitions).
- **Steps to test:**
  1. Log in as `audit.junior@kreston.al` / `audit123` and open a task assigned to you that is in **To Do**.
  2. Click **Move to In Progress**.
  3. In the dialog, optionally type what you did and/or attach a PDF/Word/Excel file.
  4. Click **Move to In Progress** to confirm.
  5. Repeat to move it to **Review**.
- **Expected result:** A success toast appears ("Task started. Good luck!", "Task sent for review successfully.", etc.). If you wrote a note, it is posted as a team comment. Any attached file is added to the task. The card moves to the next column.

---

### Send a task back (Review → In Progress)
- **What it does:** A "Send Back" button returns a task in Review to In Progress and reassigns it to the original worker who submitted it.
- **Who can access it:** Managers and above, or the assigned reviewer (Senior/Associate), on a task that is in **Review**.
- **Steps to test:**
  1. Log in as `audit.manager@kreston.al` and open a task in the **Review** column.
  2. Click **Send Back**.
- **Expected result:** The task returns to **In Progress** and goes back to the person who originally submitted it. That person gets a "Revision Required" notification.

---

### Reset a task to To Do
- **What it does:** A "Reset to To Do" button moves any non-To Do task back to the start.
- **Who can access it:** Managers and above only.
- **Steps to test:**
  1. As a manager, open a task that is in In Progress, Review, Approved, or Completed.
  2. Click **Reset to To Do**.
- **Expected result:** Toast "Task reset to To Do." and the card moves to the To Do column.

---

### Assign a reviewer (Review stage)
- **What it does:** When a task reaches **Review** it becomes unassigned and joins the department pool; a manager then picks a reviewer from a dropdown (only Senior, Associate, or Manager can be chosen).
- **Who can access it:** Managers and above (the "Assign Reviewer" dropdown only appears for them on Review tasks).
- **Steps to test:**
  1. As `audit.manager@kreston.al`, open a task in **Review** (it shows "Needs Reviewer").
  2. In the amber "Assign Reviewer" box, pick a Senior or Associate.
- **Expected result:** The task's assignee updates to "Reviewing: [name]". The chosen reviewer gets a "New Task Assignment" notification. The dropdown only lists Senior/Associate/Manager.

---

### 24-hour auto-assign rule (reviewer auto-assignment)
- **What it does:** If a task sits in **Review** with no reviewer for too long (24 hours by default, or a per-department setting), the system automatically assigns it to the Senior/Associate in that department who has the fewest review tasks.
- **Who can access it:** Runs automatically in the background for managers (the manager's open Tasks page checks every 60 seconds). Can also fire from the system's polling.
- **Steps to test:**
  1. This is time-based (24h), so it is hard to trigger live. To observe the mechanism, have a task sit unassigned in Review past the threshold.
  2. Keep a manager's Tasks page open and wait (it auto-checks once a minute).
- **Expected result:** When an overdue Review task is auto-assigned, the manager sees a toast like "1 task(s) auto-assigned to reviewers", the chosen reviewer gets a "Review Auto-Assigned" notification, and the department manager is also notified. The board refreshes to show the new assignee.

---

### Delete a task
- **What it does:** Permanently removes a task via a "Delete Task" button, after a confirmation prompt.
- **Who can access it:** Managers and above. A Manager can only delete tasks in their own department; Admin/Partner can delete any.
- **Steps to test:**
  1. As `audit.manager@kreston.al`, open a task and click **Delete Task** (red button).
  2. Confirm the "Delete this task? This cannot be undone." pop-up.
- **Expected result:** Toast "Task deleted", the pop-up closes, and the card disappears from the board (for all users in real time).

---

### Task comments
- **What it does:** A Trello-style comment thread on each task, visible to the whole team. Shows author name, role, and how long ago each comment was posted.
- **Who can access it:** Any logged-in user who can see the task can read and post comments.
- **Steps to test:**
  1. Open any task and scroll to **Comments**.
  2. Type a message in the box.
  3. Click **Add comment** (or press Ctrl+Enter).
- **Expected result:** The comment appears at the top of the list immediately, showing your name, your role, and "just now". The comment count badge increases. (Comments are limited to 2000 characters.)

---

### Attachments — upload
- **What it does:** Attach PDF, Word, or Excel files to a task, either when creating it or when moving it forward (in the progress dialog).
- **Who can access it:** Managers when creating; anyone moving a task forward can attach in the progress dialog.
- **Steps to test:**
  1. **On create:** In the New Task form, click **Attach Files**, pick a PDF/Word/Excel file, then create the task.
  2. **On progress:** Open a task, click **Move to ...**, and use **Attach documents** in the dialog before confirming.
- **Expected result:** A "file(s) attached/selected" toast appears; the file shows in the list with an X to remove it. After saving, the task card shows a paperclip with a count, and the file is listed under **Attachments** in the detail pop-up. Non-Office file types are rejected (create) or silently skipped (progress dialog). People involved with the task get a "Documents Added to Task" notification.

---

### Attachments — download / open
- **What it does:** Lets you open or download a file attached to a task.
- **Who can access it:** Everyone who can see the task.
- **Steps to test:**
  1. Open a task that has attachments.
  2. Under **Attachments**, click the file chip (paperclip + file name).
- **Expected result:** The file opens in a new browser tab (or downloads), served from the attachments link.

---

### Status-change history (timeline)
- **What it does:** A "Status Timeline" in the task detail shows every status change: when it happened, the from → to status, and who changed it.
- **Who can access it:** Everyone who can open the task.
- **Steps to test:**
  1. Open a task that has been moved through a few stages.
  2. Scroll to **Status Timeline**.
- **Expected result:** A list of entries like "Created as TODO by [name]", "TODO → IN_PROGRESS by [name]", each with a relative time ("2h ago").

---

### Real-time updates across users (websockets)
- **What it does:** Tasks created, updated, moved, or deleted by one user appear/change/disappear live on every other user's board in the same department — no page refresh needed. Admin sees changes across all departments.
- **Who can access it:** Everyone (each user sees changes within their own department; admin sees firm-wide).
- **Steps to test:**
  1. Open two browser windows (use a normal window and a private/incognito window).
  2. Log in as `audit.manager@kreston.al` / `audit123` in one and `audit.senior@kreston.al` / `audit123` in the other.
  3. Open **Workspace → Tasks** in both.
  4. In the manager window, create a new task (or move/delete an existing one).
- **Expected result:** The other window updates by itself within a second or two — the new card appears, the moved card jumps columns, or the deleted card vanishes — without anyone refreshing the page.

---

### "Mine" vs "Department" view toggle
- **What it does:** A toggle (top right) switches between only the tasks assigned to you ("Mine") and all tasks in your department ("Department").
- **Who can access it:** MANAGER, PARTNER, ADMIN, SENIOR, ASSOCIATE see the toggle. Junior-level roles only ever see "Mine".
- **Steps to test:**
  1. Log in as `audit.manager@kreston.al`.
  2. Note the **Mine / Department** toggle near the top right (managers default to Department).
  3. Click **Mine**, then click **Department**.
- **Expected result:** "Mine" shows only tasks assigned to you; "Department" shows every task in your department. The subtitle text under "Tasks" updates ("My Tasks · ..." vs "All ...").

---

### Status filter pills
- **What it does:** A row of filter pills (All, To Do, In Progress, Review, Approved, Completed) each with a count. Selecting one shows just that status as a single column; "All" shows the full board.
- **Who can access it:** Everyone.
- **Steps to test:**
  1. On the Tasks page, click the **Review** pill.
  2. Then click **All**.
- **Expected result:** Clicking a status pill shows only tasks of that status in a single full-width column. Clicking "All" returns to the 5-column board. Each pill shows a live count, and an "Overdue · N" pill appears in red if any tasks are overdue.

---

### Search tasks
- **What it does:** A search box filters tasks by title (case-insensitive, partial match).
- **Who can access it:** Everyone.
- **Steps to test:**
  1. On the Tasks page, type part of a task title in the **Search tasks...** box.
- **Expected result:** The board narrows to tasks whose title contains your text. Clearing the box restores the full list.

---

### Status counts / stats
- **What it does:** Shows how many tasks are in each status, plus an overdue count.
- **Who can access it:** Everyone (team view via filter pills; Admin view shows coloured badges).
- **Steps to test:**
  1. Team view: read the counts on the filter pills.
  2. Admin view: read the coloured "To Do / In Progress / Review / Approved / Completed / Overdue" badges.
- **Expected result:** Counts match the number of cards in each column and update as tasks move.

---

### Export tasks to Excel
- **What it does:** Downloads the current tasks as an Excel file.
- **Who can access it:** Managers and above (team view) and Admin (admin view).
- **Steps to test:**
  1. As a manager, click **Export Tasks** (top right).
- **Expected result:** Toast "Excel exported successfully" and an Excel file downloads. If it fails, "Export failed" appears.

---

### Department scoping (who sees which tasks)
- **What it does:** Restricts task visibility by department. Regular employees and managers only see their own department's tasks; Admin and Partner can see across departments. The system blocks viewing/editing a task from another department.
- **Who can access it:** Everyone, but with different scope.
- **Steps to test:**
  1. Log in as `audit.manager@kreston.al` and note you only see Audit tasks.
  2. Log in as `legal.manager@kreston.al` / `legal123` and note you only see Legal tasks.
- **Expected result:** Each department user sees only their department's tasks. A non-admin trying to access a task from a different department is denied permission.

---

### Link a process to a task (with required documents)
- **What it does:** When creating a task, certain users can link it to a "Process" (a predefined workflow that lists required Client and Internal documents) and optionally pick a specific document to produce.
- **Who can access it:** ADMIN, and users in the LEGAL or AUDIT departments (the "Link Process" picker only shows for them).
- **Steps to test:**
  1. Log in as `legal.manager@kreston.al` / `legal123` (or `audit.manager`), open **New Task**.
  2. Use the **Link Process** dropdown to pick a process.
  3. Review the previewed Client/Internal document lists; optionally pick a specific document under "Assign Specific Document to Produce".
  4. Create the task.
- **Expected result:** The selected process and its required-document checklist (Client documents and Internal documents, with "Required" markers) appear in the task's detail pop-up under "Process: [name]".

---

### Link a client to a task (surfaces on client portal)
- **What it does:** A task can optionally be linked to a client; when it is, the task and its progress show up on that client's portal in real time.
- **Who can access it:** Managers and above (the Client dropdown is on the New Task form).
- **Steps to test:**
  1. As a manager, open **New Task** and choose a client from the **Client (optional)** dropdown.
  2. Create the task and move it through stages.
- **Expected result:** A hint reads "This task will appear on the client's portal in real time." The client sees the task and its updating progress on their portal as you change its status.

---

### Admin cross-department view
- **What it does:** A dedicated board for Admin that shows tasks from **all** departments at once, with a department filter dropdown. Admin can create tasks for any department, do every status transition, assign reviewers, and delete any task.
- **Who can access it:** Admin only (`admin@kreston.al` / `admin123`). Non-admins who navigate here are redirected to the dashboard.
- **Steps to test:**
  1. Log in as `admin@kreston.al` / `admin123`.
  2. Open **Admin → Tasks** (`/dashboard/admin/tasks`).
  3. Use the **Filter** dropdown to pick a department (e.g. Audit), then "All Departments".
  4. Click **New Task** — note it includes a **Department** dropdown to target any department.
- **Expected result:** The board shows tasks firm-wide; the filter narrows to one department and back. The admin New Task form has an extra Department selector. Admin sees real-time changes from every department.
