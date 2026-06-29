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
