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
