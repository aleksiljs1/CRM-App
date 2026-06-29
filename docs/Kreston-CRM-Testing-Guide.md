# How to Use This Guide

This guide lists **every feature** of the Kreston CRM, big and small, with
click-by-click steps and the result you should expect. It is written for
testers — no technical knowledge required.

The application is live at: **https://kreston-crm.onrender.com**

## Before you start
- **First load may be slow.** If nobody has used the site for a while it can take
  ~40 seconds to wake up on the first visit. After that it is fast.
- **Log in** at the URL above using one of the accounts in the next section.
- **Confirmation messages (toasts)** appear briefly in a corner of the screen
  after most actions (e.g. "Saved", or an error in red).

## General tips that apply throughout
- **AI features use Google Gemini.** Buttons labelled AI / Simplify / Ask /
  Enhance / Prioritise / Period Report send data to Gemini and take a few
  seconds — wait for the spinner to finish.
- **Real-time features** (chat, live task updates, notifications) are best tested
  with **two browser windows** side by side, each logged in as a different user
  (use a normal window and a private/incognito window).
- **The Emails tab needs a connected mailbox.** Each user connects their own
  Gmail (via a Gmail App Password) in Settings -> Email. See Section 4. Outlook
  is not supported yet.
- **Roles matter.** Many features are visible only to certain roles. Each test
  says which login to use.


# Login Accounts

Every password follows the pattern shown. The site is at
https://kreston-crm.onrender.com.

| Role | Email | Password |
|---|---|---|
| Admin (sees everything) | admin@kreston.al | admin123 |
| Partner (firm-wide) | partner@kreston.al | partner123 |
| Client (portal) | client@alpha.com | client123 |
| HR Manager | hr.manager@kreston.al | hr123 |
| Audit Manager | audit.manager@kreston.al | audit123 |
| Audit Senior (Jeta Rexhepi) | audit.senior@kreston.al | audit123 |
| Legal Manager | legal.manager@kreston.al | legal123 |
| Tax Manager | tax.manager@kreston.al | tax123 |
| Payroll Manager | payroll.manager@kreston.al | payroll123 |
| Advisory Manager | advisory.manager@kreston.al | advisory123 |
| Finance Manager | finance.manager@kreston.al | finance123 |

**Full pattern:** staff emails are `<department>.<level>@kreston.al` with password
`<department>123`.
Departments: hr, audit, legal, tax, payroll, advisory, marketing, finance.
Levels: manager, senior, associate, junior, intern (availability varies by
department).

Extra client portal logins (all password client123): anisa@betaconsulting.al,
fatmir@gammaimport.al, lindita@thetatech.al, marsel@iotahotels.al,
vera@kappaagri.al, artan@deltaholdings.al, violeta@epsilonpharma.al,
besnik@zetaconstruction.al, dorina@etaretail.al.


# Contents

1. Logging In, Roles & Navigation
2. Admin Console
3. Manager & Partner Tools
4. Email Inbox & Settings
5. Tasks
6. Calendar, Documents & Team Chat
7. Clients, Processes & Templates
8. Client Portal
9. Performance, Notifications & Export

Appendix: Known Limitations & Tester Notes


# Section 1: Logging In, Roles & Navigation

This section covers how people sign in to the Kreston CRM, what happens depending on their role, and the things every signed-in user can do no matter their job: moving around the left-hand menu, viewing and editing their profile, uploading a profile picture, switching between light and dark mode, using the menu on a phone, and signing out. The live app is at **https://kreston-crm.onrender.com**. Everything below is click-by-click, so you do not need any technical knowledge to follow it.

> **Tip for testers:** Each account "type" (role) sees a different menu and a different sidebar background colour. When a step says "log in as X", use the matching email and password from the **Login Accounts** list at the bottom of this section.

---

## Roles & What Each Can Broadly Access

The left-hand menu shows different items depending on who is logged in. The table below lists every role, the colour wash you should see behind the sidebar, and the menu items that role can see. (This is taken directly from the app's menu rules.)

| Role | Sidebar colour (light / dark) | Example login | Menu items they see |
|------|-------------------------------|---------------|----------------------|
| **ADMIN** | Slate grey / very dark grey | admin@kreston.al | Dashboard, Email Settings, Emails, Documents, Chats, Users, Clients (Admin), Audit Log, Processes, Tasks (All Depts), Firm Performance, System Settings. (Also "Processes" for the HR area.) Admin sees the most. |
| **PARTNER** | Indigo / dark indigo | partner@kreston.al | Dashboard, Emails, Tasks, Calendar, Documents, Chats, Email Settings, Clients, Client Pipeline, Reports, Team & Performance, Dept Settings. |
| **MANAGER** | Blue / dark blue | (a department `.manager` account, e.g. audit.manager@kreston.al) | Dashboard, Emails, Tasks, Calendar, Documents, Chats, Email Settings, Clients, Client Pipeline, Reports, Team & Performance, Dept Settings. Managers in the LEGAL or AUDIT departments also see a "Processes" item. |
| **SENIOR** | Emerald green / dark green | audit.senior@kreston.al (Jeta Rexhepi) | Dashboard, Emails, Tasks, Calendar, Documents, Chats, My Performance, Email Settings, Clients. |
| **ASSOCIATE** | Cyan / dark cyan | (a department `.associate` account) | Dashboard, Emails, Tasks, Calendar, Documents, Chats, My Performance, Email Settings, Clients. |
| **JUNIOR** | Amber / dark amber | (a department `.junior` account) | Dashboard, Emails, Tasks, Calendar, Documents, Chats, My Performance, Email Settings. |
| **ASSISTANT** | Orange / dark orange | (an assistant account, if present) | Dashboard, Emails, Tasks, Calendar, Documents, Chats, My Performance, Email Settings. |
| **INTERN** | Pink / dark pink | (a department `.intern` account) | Dashboard, Emails, Tasks, Calendar, Documents, Chats, My Performance, Email Settings. |
| **CLIENT** | Brand teal / dark teal | client@alpha.com | A reduced menu plus a "Talk to your team" panel at the bottom of the sidebar (see the Client sidebar feature below). |

**Quick way to read the table:** Admins manage the whole firm and system settings. Partners and Managers manage clients, teams, and reports. Seniors and Associates do the daily work and can see Clients. Juniors, Assistants and Interns do the daily work but cannot see Clients. Clients only see their own area and a way to chat with their Kreston team.

---

## Features

### Public landing page
- **What it does:** The very first page anyone sees when they open the app. It shows the Kreston logo, the app name, a short tagline, and a single "Sign In" button.
- **Who can access it:** Anyone, even people who are not logged in.
- **Steps to test:**
  1. Open a browser and go to **https://kreston-crm.onrender.com**.
  2. Look at the centre of the page.
  3. Click the **Sign In** button.
- **Expected result:** You see a round logo with a "K", the title "Kreston CRM", the tagline "AI-powered client relationship management for Kreston Albania", and a "Sign In" button. Clicking the button takes you to the login page.

### Logging in (Sign In)
- **What it does:** Lets a user enter their email and password to enter the CRM.
- **Who can access it:** Anyone with a valid account (all roles).
- **Steps to test:**
  1. Go to the login page (click "Sign In" on the landing page, or go to **https://kreston-crm.onrender.com/login**).
  2. In the **Email** box type `admin@kreston.al`.
  3. In the **Password** box type `admin123`.
  4. Click **Sign In**.
- **Expected result:** The button briefly shows "Signing in..." and then you are taken to your dashboard. For the admin account you land on the admin dashboard. (See "Role-based redirect after login" below for where each role lands.)

### Login error message (wrong email or password)
- **What it does:** Shows a clear red error message when the login details are wrong, without letting you in.
- **Who can access it:** Anyone on the login page.
- **Steps to test:**
  1. Go to the login page.
  2. Type any email, for example `admin@kreston.al`.
  3. Type a wrong password, for example `wrongpassword`.
  4. Click **Sign In**.
- **Expected result:** A red box appears at the top of the form reading **"Invalid email or password"**. You stay on the login page and are not signed in. (You can then correct the password and try again.)

### Login required-field check
- **What it does:** Stops the form from being submitted if the email or password box is empty.
- **Who can access it:** Anyone on the login page.
- **Steps to test:**
  1. Go to the login page.
  2. Leave both boxes empty (or fill only one).
  3. Click **Sign In**.
- **Expected result:** The form does not submit. The browser highlights the empty box and asks you to fill it in. Nothing happens until both boxes have something in them.

### "Signing in..." loading state
- **What it does:** While the system is checking your login, the button text changes and the form is locked so you cannot click twice.
- **Who can access it:** Anyone logging in.
- **Steps to test:**
  1. Go to the login page and enter a valid email and password.
  2. Click **Sign In** and watch the button immediately.
- **Expected result:** The button text changes from "Sign In" to **"Signing in..."** and the email/password boxes and button are temporarily greyed out (disabled) until the check finishes.

### Role-based redirect after login
- **What it does:** After a successful login, the app automatically sends each person to the correct home dashboard for their role.
- **Who can access it:** All roles (each goes to their own destination).
- **Steps to test:** Log in (one at a time) with each of these and note where you land:
  1. `admin@kreston.al` / `admin123`
  2. `partner@kreston.al` / `partner123`
  3. `client@alpha.com` / `client123`
  4. `audit.manager@kreston.al` / `audit123` (a manager-level account)
  5. `audit.senior@kreston.al` / `audit123` (a staff account that is not admin/partner/client/manager)
- **Expected result:**
  - Admin lands on the Admin dashboard.
  - Partner lands on the Partner dashboard.
  - Client lands on the Client dashboard.
  - Manager lands on the Manager dashboard.
  - Any other staff role (Senior, Associate, Junior, Assistant, Intern) lands on the general **Workspace** dashboard.

### Visiting the dashboard while logged out (protection)
- **What it does:** Prevents people who are not signed in from reaching the dashboard; it sends them to the login page instead.
- **Who can access it:** N/A — this protects everyone.
- **Steps to test:**
  1. Make sure you are signed out (see "Signing out" below).
  2. In the address bar, go directly to **https://kreston-crm.onrender.com/dashboard**.
- **Expected result:** You are bounced to the **login page** and cannot see any dashboard content until you sign in.

### Inactive account cannot log in
- **What it does:** Accounts that have been switched off (deactivated) by an admin are not allowed to sign in, even with the correct password.
- **Who can access it:** N/A — this is a safety check.
- **Steps to test:** (Requires an account that an admin has marked inactive.)
  1. Go to the login page.
  2. Enter the email and correct password of a deactivated account.
  3. Click **Sign In**.
- **Expected result:** Login fails with the red **"Invalid email or password"** message; the user is not allowed in.

### Left-hand navigation menu (sidebar)
- **What it does:** The vertical menu on the left of every dashboard page. It lists the sections that role is allowed to open, and clicking an item opens that section.
- **Who can access it:** All signed-in users (the list of items differs by role — see the Roles table above).
- **Steps to test:**
  1. Log in as any account, e.g. `audit.senior@kreston.al` / `audit123`.
  2. Look at the menu down the left side.
  3. Click several menu items (for example **Tasks**, then **Calendar**, then **Documents**).
- **Expected result:** Each click opens the matching page. The item you are currently on is highlighted in the brand teal colour with a teal icon. The menu only lists items allowed for your role (a Senior, for example, will NOT see "Users", "Audit Log", or "System Settings").

### Per-role sidebar colour
- **What it does:** Tints the whole sidebar a different colour for each role, so you can tell at a glance who is logged in.
- **Who can access it:** All signed-in users.
- **Steps to test:**
  1. Log in as `admin@kreston.al` and note the sidebar colour.
  2. Sign out and log in as `partner@kreston.al`; note the colour.
  3. Repeat for `client@alpha.com` and `audit.senior@kreston.al`.
- **Expected result:** The sidebar background changes per role: Admin = slate grey, Partner = indigo, Manager = blue, Senior = emerald green, Associate = cyan, Junior = amber, Assistant = orange, Intern = pink, Client = brand teal. (See the colour column in the Roles table.)

### Department-specific menu item (Processes)
- **What it does:** A "Processes" menu item appears only for Managers who belong to the **Legal** or **Audit** department (Admins always see their own Processes item).
- **Who can access it:** Admins; Managers in the Legal or Audit departments.
- **Steps to test:**
  1. Log in as an Audit manager, e.g. `audit.manager@kreston.al` / `audit123`.
  2. Look for a **Processes** item in the menu.
  3. Sign out and log in as a manager from a different department (e.g. `hr.manager@kreston.al` / `hr123`).
- **Expected result:** The Audit (or Legal) manager sees the "Processes" item; a manager from a non-Legal/Audit department (like HR) does not.

### Brand header in the sidebar
- **What it does:** Shows the Kreston logo and "Kreston CRM" name at the top of the sidebar.
- **Who can access it:** All signed-in users.
- **Steps to test:**
  1. Log in as any account.
  2. Look at the very top of the left menu.
- **Expected result:** You see the Kreston logo image next to the words "Kreston CRM".

### User card at the bottom of the sidebar (name + role badge)
- **What it does:** Shows the logged-in person's small profile picture (or their first initial), their name, and their role (or sub-role) underneath the name.
- **Who can access it:** All signed-in users.
- **Steps to test:**
  1. Log in as `audit.senior@kreston.al` / `audit123`.
  2. Look at the bottom-left of the screen.
- **Expected result:** You see a small round avatar (or the letter "J" if no picture), the name **"Jeta Rexhepi"**, and below it the role/sub-role text (e.g. "SENIOR").

### "View profile" link (click your name/avatar)
- **What it does:** Clicking your name or avatar in the bottom-left opens your Profile page.
- **Who can access it:** All signed-in users.
- **Steps to test:**
  1. Log in as any account.
  2. Hover over your name/avatar at the bottom-left (a "View profile" tooltip appears).
  3. Click your name/avatar.
- **Expected result:** Your **Profile** page opens, showing your profile picture area and account details.

### Profile page — view account details
- **What it does:** Shows your account information: name, email, role badge, sub-role (if any), department (if any), and the date you became a member.
- **Who can access it:** All signed-in users (everyone sees only their own profile).
- **Steps to test:**
  1. Log in as `audit.senior@kreston.al` / `audit123`.
  2. Click your name/avatar at the bottom-left to open Profile.
  3. Read the "Account information" card.
- **Expected result:** You see Name = Jeta Rexhepi, the email, a Role badge ("SENIOR"), a Department badge (e.g. "Audit & Advisory"), and a "Member since" date. A note at the bottom says to contact your administrator to change your role or department. (Role and department are read-only here.)

### Profile picture — upload via button
- **What it does:** Lets you set a profile picture by choosing an image file from your computer.
- **Who can access it:** All signed-in users.
- **Steps to test:**
  1. Open your Profile page.
  2. Click the **"Upload new picture"** button.
  3. Choose a PNG, JPG, WebP, or GIF image that is under 4 MB.
- **Expected result:** The circle briefly shows a spinning loader, then displays your new picture. A green "Avatar updated" message pops up. Your small avatar in the bottom-left sidebar also updates right away (without needing to log in again).

### Profile picture — drag and drop
- **What it does:** Lets you set a profile picture by dragging an image file straight onto the round picture area.
- **Who can access it:** All signed-in users.
- **Steps to test:**
  1. Open your Profile page.
  2. Drag an image file from your computer over the round picture circle.
  3. While hovering, notice the circle highlights and shows an image icon; then drop the file.
- **Expected result:** While dragging, the circle glows and slightly grows with a picture-add icon. After dropping, the picture uploads (spinner shows), then appears, with a green "Avatar updated" message.

### Profile picture — file type and size validation
- **What it does:** Blocks files that are the wrong type or too large, with a clear message, before anything is uploaded.
- **Who can access it:** All signed-in users.
- **Steps to test:**
  1. Open your Profile page.
  2. Click "Upload new picture" and try choosing a non-image file (for example a PDF or Word document). If the file picker hides non-images, drag a PDF onto the circle instead.
  3. Separately, try uploading an image larger than 4 MB.
- **Expected result:** For a wrong file type you see a red message: "Unsupported file type. Please upload a PNG, JPG, WebP, or GIF image." For an oversized image you see: "Image is too large. Maximum size is 4 MB." Nothing is uploaded in either case.

### Profile picture — remove
- **What it does:** Removes your current profile picture and goes back to showing your initials.
- **Who can access it:** All signed-in users who currently have a picture set.
- **Steps to test:**
  1. Open your Profile page while you have a picture set.
  2. Click the **"Remove"** button (with the trash icon) next to "Upload new picture".
- **Expected result:** The picture disappears and is replaced by your initials in the circle. A green "Avatar removed" message appears, and the small avatar in the bottom-left sidebar also reverts to your initial. The "Remove" button only appears when you actually have a picture.

### Light / Dark mode toggle (theme)
- **What it does:** Switches the whole app between a light colour scheme and a dark colour scheme. Your choice is remembered the next time you open the app.
- **Who can access it:** All signed-in users.
- **Steps to test:**
  1. Log in as any account.
  2. At the bottom-left, find the small moon/sun icon button next to your name (to the left of the sign-out icon).
  3. Click it to switch modes, then click again to switch back.
  4. Refresh the page after switching to dark mode.
- **Expected result:** Clicking the moon icon turns the app dark (and the icon becomes a sun); clicking the sun turns it light again. After a refresh, the app stays in the mode you last chose. There should be no flash of the wrong colour when the page loads.

### Mobile menu (hamburger) and slide-out drawer
- **What it does:** On a phone or narrow window, the left menu is hidden to save space. A "hamburger" button (three lines) at the top-left opens it as a slide-out panel.
- **Who can access it:** All signed-in users on a small/narrow screen.
- **Steps to test:**
  1. Log in as any account.
  2. Make the browser window narrow, or open the site on a phone.
  3. Notice the top bar now shows a three-line menu icon, the logo, and "Kreston CRM".
  4. Tap the three-line icon.
  5. Tap a menu item, or tap the dark area outside the menu, or tap the X at the top of the menu.
- **Expected result:** The menu is hidden on narrow screens until you tap the hamburger. Tapping it slides the menu in from the left over a dark background. Choosing a menu item navigates and closes the menu; tapping outside or the X also closes it. (On a wide screen the menu is always shown and the hamburger is hidden.)

### Client sidebar — "Talk to your team" panel
- **What it does:** For Client logins only, the sidebar has a panel to chat with their Kreston team. Opening it widens the sidebar to fit the contact list.
- **Who can access it:** Client accounts only.
- **Steps to test:**
  1. Log in as `client@alpha.com` / `client123`.
  2. Look at the lower part of the sidebar for the "Talk to your team" section.
  3. Click its header to expand it, then click again to collapse it.
- **Expected result:** The panel expands to show the team contacts and the sidebar gets a bit wider; collapsing it returns the sidebar to its normal width.

### Signing out (Log out)
- **What it does:** Ends your session and returns you to the login page.
- **Who can access it:** All signed-in users.
- **Steps to test:**
  1. Log in as any account.
  2. At the bottom-left, find the sign-out icon (an arrow leaving a box) to the right of the theme toggle.
  3. Hover to confirm the "Sign out" tooltip, then click it.
- **Expected result:** You are signed out and taken to the **login page**. Trying to open a dashboard page after this sends you back to login until you sign in again.

---

## Login Accounts (for reference)

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| Admin | admin@kreston.al | admin123 | Sees everything |
| Partner | partner@kreston.al | partner123 | |
| Client | client@alpha.com | client123 | Has "Talk to your team" panel |
| Dept staff | `<dept>.<level>@kreston.al` | `<dept>123` | dept = hr, audit, legal, tax, payroll, advisory, marketing, finance; level = manager, senior, associate, junior, intern |

**Example staff logins:**
- `audit.senior@kreston.al` / `audit123` (named "Jeta Rexhepi") — Senior role.
- `audit.manager@kreston.al` / `audit123` — Manager role (also sees "Processes" because Audit).
- `hr.manager@kreston.al` / `hr123` — Manager role (does NOT see "Processes").
- `tax.junior@kreston.al` / `tax123` — Junior role.

> The email pattern is the department name, a dot, then the level (for example `legal.associate@kreston.al`), and the password is the department name followed by `123` (for example `legal123`).

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

# Section 6: Calendar, Documents & Team Chat

This section covers three workspace areas of the Kreston CRM: the **Calendar** (which plots your tasks by their deadline so you can see what's due and when), the **Documents** hub (a single place that gathers every file from tasks, emails, chats, and manual uploads — with AI tools that can summarise a file or answer questions about it), and **Team Chat** (real-time messaging between colleagues, with typing indicators, file attachments, and pop-up notifications). The app is live at https://kreston-crm.onrender.com.

**Before you start:** Log in at the live site. Standard logins follow the pattern `<dept>.<level>@kreston.al` with password `<dept>123` (for example `audit.manager@kreston.al` / `audit123`, or `hr.manager@kreston.al` / `hr123`). The administrator login is `admin@kreston.al` / `admin123`. The AI document tools use Google Gemini, so expect a few seconds of "thinking" time before an answer appears. To test real-time chat (live delivery and typing indicators) you will need **two browser windows open at the same time**, each logged in as a different person — use a normal window and a private/incognito window so the two logins don't clash.

---

## CALENDAR

The Calendar lives at **Dashboard → Workspace → Calendar**. It does not have separate "create event" buttons — instead it automatically shows your **tasks plotted on the day of their deadline**. Each coloured chip is a task.

### View the monthly calendar
- **What it does:** Shows a full month grid (Sunday–Saturday) with your tasks placed on the day they are due.
- **Who can access it:** Any logged-in staff member.
- **Steps to test:**
  1. Log in (e.g. `audit.manager@kreston.al` / `audit123`).
  2. Open the left menu and click **Calendar** under Workspace.
  3. Look at the grid of days for the current month.
- **Expected result:** A calendar grid appears. Today's date has a coloured (brand) circle around the number. Days that have tasks show small coloured chips with the task titles, plus a little count number in the top-right corner of the day.

### Move between months (Previous / Next / Today)
- **What it does:** Lets you browse to past or future months and jump back to the current month.
- **Who can access it:** Any logged-in staff member.
- **Steps to test:**
  1. On the Calendar, click the **left arrow (‹)** next to the month name — the calendar moves back one month.
  2. Click the **right arrow (›)** — it moves forward one month.
  3. Click the **Today** button.
- **Expected result:** The month name and grid update each time. Clicking **Today** returns you to the current month and highlights today's date.

### Read the priority colour legend
- **What it does:** Explains what the chip colours mean (Urgent = red, High = orange, Medium = amber, Low = grey).
- **Who can access it:** Any logged-in staff member.
- **Steps to test:**
  1. On the Calendar, look at the top-right area near the month navigation.
- **Expected result:** A small legend lists Urgent, High, Medium, Low, each with a matching coloured dot.

### Open a day to see its tasks (day detail panel)
- **What it does:** Clicking any day opens a panel below the calendar listing every task due that day with full details.
- **Who can access it:** Any logged-in staff member.
- **Steps to test:**
  1. Click on a day that shows one or more task chips.
  2. Read the panel that appears under the calendar.
  3. Click **Close** (top-right of the panel) when done.
- **Expected result:** The selected day gets a coloured outline. A panel appears showing the full date and a list of that day's tasks. Each task shows its title, a priority badge, a status badge, and the assignee, client, and department where available. An empty day shows "No tasks scheduled".

### Spot overdue tasks
- **What it does:** Flags tasks whose deadline has passed and that are not yet completed.
- **Who can access it:** Any logged-in staff member.
- **Steps to test:**
  1. Browse to a past month (use the left arrow) where you have an unfinished task.
  2. Look at that day's chip, then click the day to open the detail panel.
- **Expected result:** Overdue task chips have a red outline and a small warning icon. In the day panel the task also shows a red **Overdue** badge.

### See more than 3 tasks on a busy day
- **What it does:** When a day has more than three tasks, the grid shows the first three and a "+N more" label.
- **Who can access it:** Any logged-in staff member.
- **Steps to test:**
  1. Find (or create via Tasks) a day with four or more tasks due.
  2. Look at that day in the grid, then click the day.
- **Expected result:** The grid cell shows three task chips plus a "+N more" label. Clicking the day reveals the complete list in the detail panel.

### Switch between "My Tasks" and "Team" calendar
- **What it does:** Managers can toggle between only their own tasks and all tasks in their department.
- **Who can access it:** Only **Admin, Partner, and Manager** roles (e.g. `audit.manager@kreston.al`). Other staff see only their own tasks and have no toggle.
- **Steps to test:**
  1. Log in as a manager and open the Calendar.
  2. At the top-right, click the **Team** button in the My Tasks / Team toggle.
  3. Click **My Tasks** to switch back.
- **Expected result:** In **Team** view the heading changes to the department's Team Calendar and more tasks appear (the whole department's). On team view, hovering a chip shows the assignee's name in the tooltip. Staff without the manager role will not see this toggle at all.

### Jump to the Kanban board
- **What it does:** Quick link from the calendar to the task board.
- **Who can access it:** Any logged-in staff member.
- **Steps to test:**
  1. On the Calendar, click **View Kanban** (top-right).
  2. In the day detail panel, click **View on board** next to a task.
- **Expected result:** You are taken to the Tasks (Kanban) page.

---

## DOCUMENTS

The Documents hub lives at **Dashboard → Workspace → Documents**. It pulls together files from four sources: **Tasks**, **Emails**, **Chats** (labelled "Client"), and **manual Uploads**. You see documents you're connected to (your tasks/emails/chats) plus files uploaded to your department.

### View all documents and the stat strip
- **What it does:** Lists every document available to you, with a summary strip counting totals by source.
- **Who can access it:** Any logged-in staff member.
- **Steps to test:**
  1. Log in and open **Documents** under Workspace.
  2. Look at the four count cards near the top, then the list below.
- **Expected result:** Four cards show counts for Total Documents, From Tasks, From Emails, and From Uploads. Below, a table lists each document with its name, type, who uploaded it (with an initials avatar), and how long ago. A "featured" card highlights the most recent document at the top.

### Filter documents by source
- **What it does:** Narrows the list to one source: All, Tasks, Email, Client (chat), or Upload.
- **Who can access it:** Any logged-in staff member.
- **Steps to test:**
  1. On Documents, click each pill in turn: **All**, **Tasks**, **Email**, **Client**, **Upload**.
- **Expected result:** The list updates to show only documents from the chosen source. The active pill is highlighted.

### Search documents by name
- **What it does:** Finds documents whose file name contains your search text.
- **Who can access it:** Any logged-in staff member.
- **Steps to test:**
  1. On Documents, type part of a file name into the **Search documents...** box (top-right).
  2. Wait about half a second.
- **Expected result:** The list filters down to matching file names as you type (there is a short delay before results refresh). Clearing the box restores the full list.

### See file type icons and file size
- **What it does:** Each document shows a coloured icon for its type (PDF red, Word blue, Excel green, image purple, other grey) and a size label.
- **Who can access it:** Any logged-in staff member.
- **Steps to test:**
  1. On Documents, scan the list and the featured card at the top.
- **Expected result:** Each row has a type icon and a "Type" tag (PDF / Word / Excel / Image / Other). The featured card shows the type and a human-readable size (e.g. "1.2 MB").

### Upload a document (manual upload)
- **What it does:** Uploads one or more files from your computer; they are saved to your department's documents.
- **Who can access it:** Any logged-in staff member.
- **Steps to test:**
  1. On Documents, click **Upload Document** (top-right, brand-coloured).
  2. Choose one or more PDF, Word, or Excel files and confirm.
  3. Wait for the upload to finish.
- **Expected result:** A green toast says "X document(s) uploaded", the file appears at the top of the list tagged "Manual Upload", and the From Uploads / Total counts increase. (The **Upload to Process** button works the same way — it also uploads files.)

### Download a document
- **What it does:** Downloads the original file to your computer.
- **Who can access it:** Any logged-in staff member (for documents in their scope).
- **Steps to test:**
  1. On Documents, click the **Download** icon at the end of any row (or the **Download** pill in the featured card).
- **Expected result:** The file downloads with its original name.

### Delete a document
- **What it does:** Permanently removes a document.
- **Who can access it:** Any logged-in staff member. For files attached to tasks, only the task's owner/creator or an Admin/Partner/Manager can delete.
- **Steps to test:**
  1. On Documents, click the **trash** icon at the end of a row.
  2. Confirm the "Delete this document?" pop-up.
- **Expected result:** A "Document deleted" toast appears and the row disappears; the counts drop by one. (Trying to delete someone else's task attachment without permission shows a "Failed to delete" error.)

### AI — Simplify a document (plain-language summary)
- **What it does:** Uses Google Gemini to read a PDF/Word/Excel file and produce a short, plain-language summary: what it is, key points, dates/deadlines, action items, and a summary.
- **Who can access it:** Any logged-in staff member. The Simplify button only appears for **PDF, Word, or Excel** files (not images or other types).
- **Steps to test:**
  1. On Documents, find a PDF/Word/Excel file.
  2. Click the **Simplify** button (the sparkle/wand icon in the row, or the **Simplify** pill in the featured card).
  3. Wait a few seconds for the AI.
- **Expected result:** A pop-up titled **AI Summary** appears showing a spinner ("Analyzing and simplifying document..."), then a tidy, bullet-pointed plain-language summary. You can click **Ask a follow-up question** to switch to the Ask AI tool, or **Close** to dismiss.

### AI — Ask a question about a document
- **What it does:** Uses Gemini to answer your typed questions based only on the contents of that document, in a chat-style window.
- **Who can access it:** Any logged-in staff member. The Ask AI button only appears for **PDF, Word, or Excel** files.
- **Steps to test:**
  1. On Documents, click the **Ask AI** button (brain/sparkle icon in the row, or **Ask AI** pill in the featured card) on a PDF/Word/Excel file.
  2. Type a question, e.g. "What is the total amount?" or "What are the deadlines?", and press the send button (or Enter).
  3. Wait a few seconds, then ask a second question.
- **Expected result:** A pop-up titled **Ask AI** opens. Your question appears as a chat bubble on the right; after an "Analyzing document..." spinner, the AI's answer appears on the left. You can keep asking follow-up questions and they stack as a conversation. If the answer isn't in the document, the AI says so.

### AI tools are hidden for unsupported files
- **What it does:** Confirms AI buttons only appear for supported document types.
- **Who can access it:** Any logged-in staff member.
- **Steps to test:**
  1. On Documents, find or upload an image (e.g. a PNG/JPG) or a plain text/other file.
  2. Look at that row's action buttons.
- **Expected result:** Only the **Download** and **Delete** icons appear — there are no Ask AI or Simplify buttons for unsupported types.

---

## TEAM CHAT

Team Chat lives at **Dashboard → Workspace → Chats**. It is real-time messaging between colleagues (clients are excluded). Chats are always **one-to-one (direct) conversations** — there are no group chats. A floating **chat pop-up** also appears anywhere in the app when a new message arrives.

> **Tip for real-time tests:** Open two windows logged in as two different people — for example `audit.manager@kreston.al` / `audit123` in a normal window and `hr.manager@kreston.al` / `hr123` in a private/incognito window. Keep both on screen.

### Find a colleague (People tab)
- **What it does:** Lists colleagues you can chat with, filterable by department and searchable by name/email.
- **Who can access it:** Any logged-in staff member (clients are never listed).
- **Steps to test:**
  1. Open **Chats** under Workspace.
  2. Click the **People** tab in the left panel.
  3. Use the department dropdown to filter, and/or type a name in the **Search...** box.
- **Expected result:** A list of colleagues appears, each showing their name, role, and a department badge. Filtering/searching narrows the list. Your own account does not appear.

### Start a new conversation
- **What it does:** Opens (or reuses) a one-to-one chat with a chosen colleague.
- **Who can access it:** Any logged-in staff member.
- **Steps to test:**
  1. In the **People** tab, click a colleague.
- **Expected result:** A chat opens on the right with that person's name in the header (and a green "Online" badge), the view switches to the **Recent Chats** tab, and the new conversation appears in the list. Starting a chat with someone you already have a conversation with reopens the existing one (no duplicate is created).

### Send a text message
- **What it does:** Sends a typed message in the open conversation.
- **Who can access it:** Any logged-in staff member who is a participant.
- **Steps to test:**
  1. Open a conversation, type into the **Type a message...** box.
  2. Click **Send** (or press **Ctrl+Enter**).
- **Expected result:** Your message appears immediately as a brand-coloured bubble on the right labelled "You", with a timestamp. The input clears.

### Real-time message delivery
- **What it does:** Messages appear on the other person's screen instantly without refreshing.
- **Who can access it:** Both participants.
- **Steps to test:**
  1. Open the same conversation in both windows (User A and User B).
  2. As User A, send a message.
- **Expected result:** The message appears in User B's window within a second or two on the left side, without User B refreshing. User B's conversation list also bumps the chat to the top.

### Typing indicator
- **What it does:** Shows "<name> is typing..." to the other person while you type.
- **Who can access it:** Both participants.
- **Steps to test:**
  1. With both windows in the same conversation, start typing as User A (don't send).
  2. Watch User B's window.
  3. Stop typing and wait a couple of seconds.
- **Expected result:** User B sees an italic "<User A's name> is typing..." note under the chat header. It disappears a couple of seconds after User A stops typing.

### Attach and send files
- **What it does:** Attaches files (PDF, Word, Excel, images, text, CSV) to a message and lets the recipient download them.
- **Who can access it:** Any logged-in staff member who is a participant.
- **Steps to test:**
  1. In a conversation, click **Attach** (paperclip) and pick one or more files.
  2. Confirm the chips appear above the input, optionally type a message, and click **Send**.
  3. In the other window, click the **Download** icon on the received attachment.
- **Expected result:** A toast confirms files attached; each attached file shows as a chip (removable with the "x") before sending. After sending, the message bubble shows each file with its name, size, and a download icon. The recipient can download the original file.

### Unread badge on conversations
- **What it does:** Marks conversations that have new unread messages.
- **Who can access it:** Both participants.
- **Steps to test:**
  1. As User A, send a message to User B while User B is **not** viewing that conversation (e.g. on the People tab or another chat).
  2. Look at User B's Recent Chats list.
  3. As User B, open that conversation.
- **Expected result:** In User B's list the conversation shows the name in bold and a red "!" badge. Opening the conversation clears the unread state (bold/badge disappear).

### Search your recent chats
- **What it does:** Filters the Recent Chats list by the other person's name.
- **Who can access it:** Any logged-in staff member.
- **Steps to test:**
  1. On the **Recent Chats** tab, type a colleague's name in the **Search...** box.
- **Expected result:** The conversation list filters to chats matching that name.

### Floating chat pop-up notification (anywhere in the app)
- **What it does:** When a new message arrives while you're on any page, a small chat pop-up appears in the bottom-right so you can read and reply without opening the Chats page.
- **Who can access it:** Any logged-in staff member.
- **Steps to test:**
  1. As User B, navigate to a different page (e.g. the Dashboard home or Documents) — **not** the Chats page.
  2. As User A, send User B a message.
  3. Watch the bottom-right of User B's screen.
- **Expected result:** A small chat bar pops up at the bottom-right showing User A's name, a message preview, and an unread count; it briefly flashes/pulses. Clicking it expands a mini chat window where User B can read messages and reply (Enter to send). Up to three pop-ups can stack; each has minimize (–) and close (x) buttons.

### Reply from the chat pop-up
- **What it does:** Lets you send messages and attachments directly from the floating pop-up.
- **Who can access it:** Any logged-in staff member.
- **Steps to test:**
  1. With a pop-up expanded, type a message and press **Enter** (or click send). Optionally attach a file with the paperclip.
- **Expected result:** The message sends and appears in the pop-up and in the other person's chat in real time, exactly like the full Chats page.

### Mobile / narrow-window back navigation
- **What it does:** On small screens the conversation fills the screen; a "Back to chats" link returns to the list.
- **Who can access it:** Any logged-in staff member.
- **Steps to test:**
  1. Narrow the browser window (or use a phone), open a conversation, then click **Back to chats** at the top of the conversation.
- **Expected result:** You return to the conversation list. On wide screens the list and conversation show side by side and this back link is hidden.

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

# Appendix: Known Limitations & Tester Notes

These are intentional notes so testers don't report expected behaviour as bugs.

- **Reports page is Admin-only (for now).** A "Reports" link appears for
  Managers/Partners, but the firm-wide Reports/analytics page currently
  redirects non-admins. Use admin@kreston.al to view it.
- **Two Clients pages exist.** The fully functional client table (add / edit /
  assign / change status / delete / export) lives under **Admin -> Clients**.
  The staff "Clients" link is a lighter view; its top-right button is
  "Export Clients", and adding a client is done through a modal.
- **Password reset** (Admin -> Users) sets the user's password to **reset123**.
- **Partner dashboard figures** are demo placeholders.
- **Email polling runs only while the Emails tab is open**, refreshing about
  every 10 seconds. Close the tab and new mail won't pull until it's reopened.
- **A couple of AI endpoints** (personal improvement tips, firm-wide AI review)
  exist in the system but are not yet wired to a visible button.
- **Free hosting note:** the site sleeps after ~15 minutes idle; the first visit
  afterwards takes ~40 seconds to wake (kept warm by an uptime pinger during the
  evaluation window).
- **AI responses vary.** Gemini output is generated fresh each time, so exact
  wording will differ between runs — that is expected.
