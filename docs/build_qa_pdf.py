# -*- coding: utf-8 -*-
"""
Merge the per-area QA mini-docs into one master guide and render a polished PDF.
Uses Windows Arial/Consolas (Unicode) so em-dashes, arrows and quotes survive.
"""
import os
import re
from fpdf import FPDF
from fpdf.fonts import FontFace

BASE = r"C:\Users\Admin\Desktop\hacathine\kreston-crm"
QA_DIR = os.path.join(BASE, "docs", "qa")
MASTER_MD = os.path.join(BASE, "docs", "Kreston-CRM-Testing-Guide.md")
OUT_PDF = r"C:\Users\Admin\Desktop\Kreston-CRM-Testing-Guide.pdf"
FONTS = r"C:\Windows\Fonts"

TEAL = (0, 150, 136)
TEAL_DARK = (0, 110, 100)
GREY = (90, 90, 90)
DARK = (35, 35, 35)

# ---------------------------------------------------------------------------
# 1. Front matter (cover handled in code; these are markdown bodies)
# ---------------------------------------------------------------------------

HOW_TO = """# How to Use This Guide

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
"""

ACCOUNTS = """# Login Accounts

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
"""

TOC = """# Contents

1. Logging In, Roles & Navigation
2. Admin Console
3. Manager & Partner Tools
4. Email Inbox & Settings
5. Tasks
6. Calendar, Documents & Team Chat
7. Clients, Processes & Templates
8. Client Portal
9. Performance, Notifications & Export
10. Latest Updates — Targeted Tests

Appendix: Known Limitations & Tester Notes
"""

APPENDIX = """# Appendix: Known Limitations & Tester Notes

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
"""

# ---------------------------------------------------------------------------
# 2. Assemble master markdown
# ---------------------------------------------------------------------------

def build_master():
    parts = [HOW_TO, ACCOUNTS, TOC]
    for name in sorted(os.listdir(QA_DIR)):
        if name.endswith(".md"):
            with open(os.path.join(QA_DIR, name), "r", encoding="utf-8") as f:
                parts.append(f.read().strip())
    parts.append(APPENDIX)
    master = "\n\n".join(parts)
    with open(MASTER_MD, "w", encoding="utf-8") as f:
        f.write(master)
    return master

# ---------------------------------------------------------------------------
# 3. PDF renderer
# ---------------------------------------------------------------------------

def strip_code(text):
    # remove inline-code backticks (keep the value); keep ** for fpdf markdown
    return text.replace("`", "")

class GuidePDF(FPDF):
    def __init__(self):
        super().__init__(format="A4")
        self.add_font("Arial", "", os.path.join(FONTS, "arial.ttf"))
        self.add_font("Arial", "B", os.path.join(FONTS, "arialbd.ttf"))
        self.add_font("Arial", "I", os.path.join(FONTS, "ariali.ttf"))
        self.add_font("Arial", "BI", os.path.join(FONTS, "arialbi.ttf"))
        self.add_font("Mono", "", os.path.join(FONTS, "consola.ttf"))
        self.set_auto_page_break(auto=True, margin=18)
        self.set_margins(18, 18, 18)
        self.cover = False

    def footer(self):
        if self.page_no() == 1:  # cover page
            return
        self.set_y(-14)
        self.set_font("Arial", "I", 8)
        self.set_text_color(150, 150, 150)
        self.cell(0, 8, f"Kreston CRM — QA Testing Guide      |      Page {self.page_no()}",
                  align="C")

EPW = 210 - 36  # effective page width with 18mm margins


def render_cover(pdf):
    pdf.cover = True
    pdf.add_page()
    pdf.set_fill_color(*TEAL)
    pdf.rect(0, 0, 210, 297, style="F")
    pdf.set_y(95)
    pdf.set_font("Arial", "B", 30)
    pdf.set_text_color(255, 255, 255)
    pdf.multi_cell(0, 14, "Kreston CRM", align="C")
    pdf.ln(2)
    pdf.set_font("Arial", "B", 20)
    pdf.multi_cell(0, 11, "QA Testing Guide", align="C")
    pdf.ln(6)
    pdf.set_font("Arial", "", 12)
    pdf.multi_cell(0, 7, "Complete feature list and step-by-step test instructions",
                   align="C")
    pdf.ln(20)
    pdf.set_font("Arial", "", 11)
    pdf.multi_cell(0, 7, "https://kreston-crm.onrender.com", align="C")


def flush_table(pdf, rows):
    if not rows:
        return
    pdf.set_font("Arial", "", 8)
    pdf.set_text_color(*DARK)
    headings = FontFace(emphasis="BOLD", color=(255, 255, 255), fill_color=TEAL)
    with pdf.table(
        width=EPW,
        text_align="LEFT",
        headings_style=headings,
        line_height=5,
        markdown=True,
        first_row_as_headings=True,
        cell_fill_color=(245, 248, 247),
        cell_fill_mode="ROWS",
    ) as table:
        for r in rows:
            row = table.row()
            for cell in r:
                row.cell(strip_code(cell))
    pdf.ln(2)


def render_body(pdf, md):
    pdf.cover = False
    pdf.add_page()
    lines = md.split("\n")
    in_code = False
    code_buf = []
    table_buf = []
    first_h1_seen = False

    def flush_code():
        if not code_buf:
            return
        pdf.ln(1)
        pdf.set_font("Mono", "", 7.5)
        pdf.set_fill_color(244, 244, 244)
        pdf.set_text_color(30, 30, 30)
        for c in code_buf:
            pdf.multi_cell(EPW, 4.4, c.replace("\t", "    "), fill=True)
        pdf.ln(2)
        code_buf.clear()

    i = 0
    while i < len(lines):
        raw = lines[i].rstrip("\n")
        stripped = raw.strip()

        # fenced code
        if stripped.startswith("```"):
            if in_code:
                flush_code()
            in_code = not in_code
            i += 1
            continue
        if in_code:
            code_buf.append(raw)
            i += 1
            continue

        # table rows (buffer consecutive)
        if stripped.startswith("|") and stripped.endswith("|"):
            if re.match(r"^\|[\s\-\|:]+\|$", stripped):
                i += 1
                continue
            cells = [c.strip() for c in stripped.strip("|").split("|")]
            table_buf.append(cells)
            i += 1
            continue
        elif table_buf:
            flush_table(pdf, table_buf)
            table_buf = []

        # blank
        if stripped == "":
            pdf.ln(2.5)
            i += 1
            continue

        # horizontal rule
        if re.match(r"^-{3,}$", stripped) or re.match(r"^\*{3,}$", stripped):
            pdf.ln(1)
            pdf.set_draw_color(210, 210, 210)
            pdf.line(18, pdf.get_y(), 192, pdf.get_y())
            pdf.ln(3)
            i += 1
            continue

        # headings
        m = re.match(r"^(#{1,4})\s+(.*)", stripped)
        if m:
            level = len(m.group(1))
            text = strip_code(m.group(2)).replace("**", "")
            if level == 1:
                if first_h1_seen:
                    pdf.add_page()
                first_h1_seen = True
                pdf.set_font("Arial", "B", 18)
                pdf.set_text_color(*TEAL)
                pdf.ln(1)
                pdf.multi_cell(EPW, 9, text)
                pdf.set_draw_color(*TEAL)
                pdf.line(18, pdf.get_y() + 1, 192, pdf.get_y() + 1)
                pdf.ln(4)
            elif level == 2:
                pdf.set_font("Arial", "B", 13)
                pdf.set_text_color(*TEAL_DARK)
                pdf.ln(2)
                pdf.multi_cell(EPW, 7, text)
                pdf.ln(1)
            elif level == 3:
                pdf.set_font("Arial", "B", 11)
                pdf.set_text_color(40, 40, 40)
                pdf.ln(2)
                pdf.multi_cell(EPW, 6, text)
                pdf.ln(0.5)
            else:
                pdf.set_font("Arial", "B", 10)
                pdf.set_text_color(60, 60, 60)
                pdf.ln(1)
                pdf.multi_cell(EPW, 5.5, text)
            i += 1
            continue

        # blockquote
        if stripped.startswith(">"):
            text = strip_code(stripped.lstrip("> ").strip())
            pdf.set_font("Arial", "I", 9.5)
            pdf.set_text_color(*TEAL_DARK)
            pdf.set_fill_color(235, 249, 247)
            pdf.multi_cell(EPW, 5.5, text, fill=True, markdown=True)
            pdf.ln(1)
            i += 1
            continue

        # bullet (support nested indent)
        bm = re.match(r"^(\s*)[-*]\s+(.*)", raw)
        if bm:
            indent = len(bm.group(1))
            text = strip_code(bm.group(2))
            x_indent = 20 + (6 if indent >= 2 else 0)
            pdf.set_font("Arial", "", 9.5)
            pdf.set_text_color(*DARK)
            pdf.set_x(x_indent)
            pdf.set_font("Arial", "B", 9.5)
            pdf.cell(4, 5, "•")
            pdf.set_font("Arial", "", 9.5)
            pdf.multi_cell(EPW - (x_indent - 18) - 4, 5, text, markdown=True)
            i += 1
            continue

        # numbered list
        nm = re.match(r"^(\s*)(\d+)\.\s+(.*)", raw)
        if nm:
            indent = len(nm.group(1))
            num = nm.group(2)
            text = strip_code(nm.group(3))
            x_indent = 20 + (6 if indent >= 2 else 0)
            pdf.set_font("Arial", "", 9.5)
            pdf.set_text_color(*DARK)
            pdf.set_x(x_indent)
            pdf.set_font("Arial", "B", 9.5)
            pdf.cell(7, 5, f"{num}.")
            pdf.set_font("Arial", "", 9.5)
            pdf.multi_cell(EPW - (x_indent - 18) - 7, 5, text, markdown=True)
            i += 1
            continue

        # paragraph
        text = strip_code(stripped)
        pdf.set_font("Arial", "", 9.5)
        pdf.set_text_color(*DARK)
        pdf.multi_cell(EPW, 5.2, text, markdown=True)
        i += 1

    if table_buf:
        flush_table(pdf, table_buf)
    if code_buf:
        flush_code()


def main():
    md = build_master()
    pdf = GuidePDF()
    render_cover(pdf)
    render_body(pdf, md)
    pdf.output(OUT_PDF)
    print("Master MD:", MASTER_MD)
    print("PDF:", OUT_PDF)
    print("Pages:", pdf.page_no())


if __name__ == "__main__":
    main()
