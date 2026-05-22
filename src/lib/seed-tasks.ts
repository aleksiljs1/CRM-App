import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding tasks...");

  // Look up users
  const hrManager = await prisma.user.findUnique({
    where: { email: "hr.manager@kreston.al" },
  });
  const hrAssociate = await prisma.user.findUnique({
    where: { email: "hr.associate@kreston.al" },
  });
  const auditManager = await prisma.user.findUnique({
    where: { email: "audit.manager@kreston.al" },
  });

  if (!hrManager || !hrAssociate || !auditManager) {
    console.error(
      "Required users not found. Run the main seed first (prisma/seed.ts)."
    );
    process.exit(1);
  }

  // Look up Alpha Corp client
  const alphaClient = await prisma.client.findFirst({
    where: { companyName: "Alpha Corp" },
  });

  const now = new Date();
  const daysFromNow = (d: number) =>
    new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

  const tasks = [
    // ── TODO (3) ──
    {
      title: "Prepare Q1 financial statements",
      description:
        "Compile balance sheet, income statement, and cash flow for Q1. Ensure all journal entries are posted and reconciled.",
      status: "TODO" as const,
      priority: "HIGH" as const,
      deadline: daysFromNow(5),
      department: "ACCOUNTING_TAX" as const,
      assignedToId: hrAssociate.id,
      createdById: hrManager.id,
      clientId: alphaClient?.id || null,
    },
    {
      title: "Update employee handbook for 2026",
      description:
        "Incorporate new remote work policy, updated leave entitlements, and revised code of conduct sections.",
      status: "TODO" as const,
      priority: "MEDIUM" as const,
      deadline: daysFromNow(14),
      department: "HR" as const,
      assignedToId: hrAssociate.id,
      createdById: hrManager.id,
      clientId: null,
    },
    {
      title: "Set up payroll for new hires",
      description:
        "Register 3 new employees in payroll system: calculate tax withholdings, social insurance, and bank details.",
      status: "TODO" as const,
      priority: "URGENT" as const,
      deadline: daysFromNow(2),
      department: "BOOKKEEPING_PAYROLL" as const,
      assignedToId: hrManager.id,
      createdById: hrManager.id,
      clientId: null,
    },

    // ── IN_PROGRESS (3) ──
    {
      title: "Review tax filing for Alpha Corp",
      description:
        "Cross-check revenue declarations against invoices. Verify VAT calculations and deductible expenses.",
      status: "IN_PROGRESS" as const,
      priority: "URGENT" as const,
      deadline: daysFromNow(-1), // overdue
      department: "ACCOUNTING_TAX" as const,
      assignedToId: hrManager.id,
      createdById: auditManager.id,
      clientId: alphaClient?.id || null,
    },
    {
      title: "Complete payroll reconciliation - May",
      description:
        "Reconcile payroll register against bank disbursements. Investigate and resolve any discrepancies.",
      status: "IN_PROGRESS" as const,
      priority: "HIGH" as const,
      deadline: daysFromNow(3),
      department: "BOOKKEEPING_PAYROLL" as const,
      assignedToId: hrAssociate.id,
      createdById: hrManager.id,
      clientId: null,
    },
    {
      title: "Draft advisory report on cost optimization",
      description:
        "Analyze operational expenses and identify areas for cost reduction. Prepare executive summary with recommendations.",
      status: "IN_PROGRESS" as const,
      priority: "MEDIUM" as const,
      deadline: daysFromNow(7),
      department: "ADVISORY" as const,
      assignedToId: auditManager.id,
      createdById: auditManager.id,
      clientId: alphaClient?.id || null,
    },

    // ── REVIEW (2) ──
    {
      title: "Annual audit working papers - Alpha Corp",
      description:
        "Full set of audit working papers for the annual engagement. Includes sampling documentation and substantive procedures.",
      status: "REVIEW" as const,
      priority: "HIGH" as const,
      deadline: daysFromNow(-3), // overdue
      department: "AUDIT" as const,
      assignedToId: auditManager.id,
      createdById: hrManager.id,
      clientId: alphaClient?.id || null,
    },
    {
      title: "Employee performance evaluation templates",
      description:
        "Updated evaluation forms with new competency framework and 360-degree feedback sections.",
      status: "REVIEW" as const,
      priority: "LOW" as const,
      deadline: daysFromNow(10),
      department: "HR" as const,
      assignedToId: hrAssociate.id,
      createdById: hrManager.id,
      clientId: null,
    },

    // ── APPROVED (2) ──
    {
      title: "Monthly management report - April",
      description:
        "Consolidated management report with KPIs, revenue analysis, and departmental performance metrics.",
      status: "APPROVED" as const,
      priority: "MEDIUM" as const,
      deadline: daysFromNow(1),
      department: "ACCOUNTING_TAX" as const,
      assignedToId: hrManager.id,
      createdById: auditManager.id,
      clientId: null,
    },
    {
      title: "Legal compliance checklist update",
      description:
        "Updated regulatory compliance checklist reflecting recent changes in labor law and data protection regulations.",
      status: "APPROVED" as const,
      priority: "HIGH" as const,
      deadline: daysFromNow(-2), // overdue (approved but not completed)
      department: "LEGAL" as const,
      assignedToId: auditManager.id,
      createdById: hrManager.id,
      clientId: null,
    },

    // ── COMPLETED (3) ──
    {
      title: "Process March invoices",
      description: "Entered and validated all 47 incoming invoices for March billing cycle.",
      status: "COMPLETED" as const,
      priority: "MEDIUM" as const,
      deadline: daysFromNow(-10),
      department: "BOOKKEEPING_PAYROLL" as const,
      assignedToId: hrAssociate.id,
      createdById: hrManager.id,
      clientId: null,
      completedAt: daysFromNow(-8),
    },
    {
      title: "Client onboarding - Alpha Corp",
      description:
        "Completed full onboarding: KYC verification, engagement letter, access setup, and introductory meeting.",
      status: "COMPLETED" as const,
      priority: "HIGH" as const,
      deadline: daysFromNow(-15),
      department: "HR" as const,
      assignedToId: hrManager.id,
      createdById: hrManager.id,
      clientId: alphaClient?.id || null,
      completedAt: daysFromNow(-14),
    },
    {
      title: "Quarterly VAT return filing",
      description: "Filed Q1 VAT return for Alpha Corp. All supporting schedules attached.",
      status: "COMPLETED" as const,
      priority: "URGENT" as const,
      deadline: daysFromNow(-20),
      department: "ACCOUNTING_TAX" as const,
      assignedToId: auditManager.id,
      createdById: hrManager.id,
      clientId: alphaClient?.id || null,
      completedAt: daysFromNow(-18),
    },

    // ── Extra tasks for variety ──
    {
      title: "Prepare bank confirmation letters",
      description:
        "Draft and send bank confirmation letters for all accounts as part of the annual audit.",
      status: "TODO" as const,
      priority: "MEDIUM" as const,
      deadline: daysFromNow(8),
      department: "AUDIT" as const,
      assignedToId: hrAssociate.id,
      createdById: auditManager.id,
      clientId: alphaClient?.id || null,
    },
    {
      title: "Reconcile intercompany balances",
      description:
        "Match and reconcile intercompany receivables/payables across all group entities.",
      status: "IN_PROGRESS" as const,
      priority: "HIGH" as const,
      deadline: daysFromNow(-2), // overdue
      department: "ACCOUNTING_TAX" as const,
      assignedToId: hrManager.id,
      createdById: auditManager.id,
      clientId: alphaClient?.id || null,
    },
  ];

  // Delete existing seed tasks to allow re-running
  await prisma.task.deleteMany({
    where: {
      createdById: { in: [hrManager.id, auditManager.id] },
    },
  });

  for (const taskData of tasks) {
    const { completedAt, ...rest } = taskData as typeof taskData & {
      completedAt?: Date;
    };
    await prisma.task.create({
      data: {
        ...rest,
        completedAt: completedAt || null,
      },
    });
    console.log(`  Created task: ${taskData.title} [${taskData.status}]`);
  }

  console.log(`\nSeeded ${tasks.length} tasks successfully!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
