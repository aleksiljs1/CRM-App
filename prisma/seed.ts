import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  const users = [
    {
      email: "admin@kreston.al",
      name: "Admin User",
      password: "admin123",
      role: "ADMIN" as const,
      department: null,
    },
    {
      email: "partner@kreston.al",
      name: "Partner User",
      password: "partner123",
      role: "PARTNER" as const,
      department: null,
    },
    {
      email: "hr.manager@kreston.al",
      name: "HR Manager",
      password: "hr123",
      role: "MANAGER" as const,
      department: "HR" as const,
    },
    {
      email: "hr.associate@kreston.al",
      name: "HR Associate",
      password: "hr123",
      role: "ASSOCIATE" as const,
      subRole: "Senior Associate",
      department: "HR" as const,
    },
    {
      email: "client@alpha.com",
      name: "Alpha Corp Client",
      password: "client123",
      role: "CLIENT" as const,
      department: null,
    },
    {
      email: "audit.manager@kreston.al",
      name: "Audit Manager",
      password: "audit123",
      role: "MANAGER" as const,
      department: "AUDIT" as const,
    },
    {
      email: "audit.senior@kreston.al",
      name: "Audit Senior",
      password: "audit123",
      role: "SENIOR" as const,
      subRole: "Senior Auditor",
      department: "AUDIT" as const,
    },
    {
      email: "legal.manager@kreston.al",
      name: "Legal Manager",
      password: "legal123",
      role: "MANAGER" as const,
      department: "LEGAL" as const,
    },
    {
      email: "legal.associate@kreston.al",
      name: "Legal Associate",
      password: "legal123",
      role: "ASSOCIATE" as const,
      subRole: "Junior Associate",
      department: "LEGAL" as const,
    },
    {
      email: "tax.manager@kreston.al",
      name: "Tax Manager",
      password: "tax123",
      role: "MANAGER" as const,
      department: "ACCOUNTING_TAX" as const,
    },
    {
      email: "tax.junior@kreston.al",
      name: "Tax Junior",
      password: "tax123",
      role: "JUNIOR" as const,
      subRole: "Junior Accountant",
      department: "ACCOUNTING_TAX" as const,
    },
    {
      email: "payroll.manager@kreston.al",
      name: "Payroll Manager",
      password: "payroll123",
      role: "MANAGER" as const,
      department: "BOOKKEEPING_PAYROLL" as const,
    },
    {
      email: "advisory.manager@kreston.al",
      name: "Advisory Manager",
      password: "advisory123",
      role: "MANAGER" as const,
      department: "ADVISORY" as const,
    },
  ];

  for (const userData of users) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    await prisma.user.upsert({
      where: { email: userData.email },
      update: { subRole: (userData as any).subRole ?? null },
      create: {
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
        role: userData.role,
        subRole: (userData as any).subRole ?? null,
        department: userData.department,
      },
    });

    console.log(`  Created/updated user: ${userData.email}`);
  }

  // Seed a sample client company
  const hrManager = await prisma.user.findUnique({ where: { email: "hr.manager@kreston.al" } });

  if (hrManager) {
    await prisma.client.upsert({
      where: { id: "seed-client-alpha" },
      update: {},
      create: {
        id: "seed-client-alpha",
        companyName: "Alpha Corp",
        contactName: "John Alpha",
        contactEmail: "client@alpha.com",
        phone: "+355 69 123 4567",
        industry: "Technology",
        status: "ACTIVE",
        assignedToId: hrManager.id,
      },
    });
    console.log("  Created client: Alpha Corp");

    // Seed a sample process type with required documents
    const processType = await prisma.processType.upsert({
      where: { id: "seed-process-audit" },
      update: {},
      create: {
        id: "seed-process-audit",
        name: "Annual Audit",
        department: "AUDIT",
        description: "Full annual audit engagement",
        createdById: hrManager.id,
      },
    });

    const requiredDocs = [
      { name: "Financial Statements (Balance Sheet, P&L)", description: "Annual financial statements" },
      { name: "Trial Balance", description: "Trial balance for the audit period" },
      { name: "Bank Reconciliation Statements", description: "Bank reconciliation for all accounts" },
      { name: "Board Resolution", description: "Board resolution authorizing the audit" },
      { name: "Previous Year Audit Report", description: "Prior year audit report for reference" },
      { name: "Tax Compliance Certificate", description: "Certificate from tax authority" },
    ];

    // Delete existing required documents to avoid duplication on re-seed
    await prisma.requiredDocument.deleteMany({ where: { processTypeId: processType.id } });

    for (const doc of requiredDocs) {
      await prisma.requiredDocument.create({
        data: {
          processTypeId: processType.id,
          documentName: doc.name,
          description: doc.description,
          isMandatory: true,
        },
      });
    }
    console.log("  Created process type: Annual Audit with 6 required documents");

    // Seed sample emails for HR
    // Delete existing seed emails to avoid duplication on re-seed
    await prisma.email.deleteMany({ where: { threadId: { in: ["thread-001", "thread-002", "thread-003"] } } });

    // Thread 1: standalone email
    await prisma.email.create({
      data: {
        threadId: "thread-001",
        senderEmail: "client@alpha.com",
        senderName: "John Alpha",
        recipientDept: "HR",
        subject: "Urgent - Payroll correction needed for March",
        body: "Dear Kreston team, we noticed an error in the March payroll for employee #45. The overtime hours were not included in the final calculation. Please correct this as soon as possible.",
        isIncoming: true,
        isReplied: false,
        clientId: "seed-client-alpha",
      },
    });

    // Thread 2: create sequentially so parentId can reference the previous email
    const thread2Root = await prisma.email.create({
      data: {
        threadId: "thread-002",
        senderEmail: "hr@beta.com",
        senderName: "Beta LLC HR",
        recipientDept: "HR",
        subject: "Employee onboarding documents",
        body: "Hello, we are sending the onboarding documents for our new employee. Please find attached the employment contract and ID copy. We will send the remaining documents shortly.",
        isIncoming: true,
        isReplied: true,
        repliedAt: new Date(Date.now() - 86400000),
      },
    });

    const thread2Reply1 = await prisma.email.create({
      data: {
        threadId: "thread-002",
        parentId: thread2Root.id,
        senderEmail: "hr.manager@kreston.al",
        senderName: "HR Manager",
        recipientDept: "HR",
        subject: "Re: Employee onboarding documents",
        body: "Thank you for the documents. We still need the Tax Registration Number and Social Insurance Registration to complete the onboarding.",
        isIncoming: false,
        isReplied: true,
        userId: hrManager.id,
      },
    });

    await prisma.email.create({
      data: {
        threadId: "thread-002",
        parentId: thread2Reply1.id,
        senderEmail: "hr@beta.com",
        senderName: "Beta LLC HR",
        recipientDept: "HR",
        subject: "Re: Re: Employee onboarding documents",
        body: "Here are the remaining documents attached. Please confirm once the onboarding is complete.",
        isIncoming: true,
        isReplied: false,
      },
    });

    // Thread 3: standalone email
    await prisma.email.create({
      data: {
        threadId: "thread-003",
        senderEmail: "office@gamma.com",
        senderName: "Gamma Ltd",
        recipientDept: "HR",
        subject: "Question about payroll schedule",
        body: "Hi, could you please let us know the payroll processing schedule for Q2? We need to align our internal processes.",
        isIncoming: true,
        isReplied: false,
      },
    });
    console.log("  Created 5 sample emails across 3 threads (with parentId links)");

    // Seed document validation test data
    // First, delete any existing submission for this client+process to allow re-seed
    await prisma.clientSubmission.deleteMany({
      where: { clientId: "seed-client-alpha", processTypeId: processType.id },
    });

    const submission = await prisma.clientSubmission.create({
      data: {
        clientId: "seed-client-alpha",
        processTypeId: processType.id,
        status: "INCOMPLETE",
      },
    });

    // Fetch the required documents we just created so we can reference their IDs
    const reqDocs = await prisma.requiredDocument.findMany({
      where: { processTypeId: processType.id },
    });
    const reqDocByName = (partial: string) => reqDocs.find((d) => d.documentName.includes(partial));

    const financialStatementsDoc = reqDocByName("Financial Statements");
    const trialBalanceDoc = reqDocByName("Trial Balance");
    const bankReconDoc = reqDocByName("Bank Reconciliation");

    await prisma.submittedDocument.createMany({
      data: [
        {
          submissionId: submission.id,
          fileName: "financial_statements_2025.pdf",
          filePath: "/uploads/seed-client-alpha/financial_statements_2025.pdf",
          fileSize: 2_450_000,
          aiMatchedToId: financialStatementsDoc?.id ?? null,
          aiConfidence: 0.92,
          firstPageText: "Financial Statements for Alpha Corp - Year ended December 2025",
        },
        {
          submissionId: submission.id,
          fileName: "trial_balance_march.xlsx",
          filePath: "/uploads/seed-client-alpha/trial_balance_march.xlsx",
          fileSize: 890_000,
          aiMatchedToId: trialBalanceDoc?.id ?? null,
          aiConfidence: 0.88,
          firstPageText: null,
        },
        {
          submissionId: submission.id,
          fileName: "bank_reconciliation_Q4.pdf",
          filePath: "/uploads/seed-client-alpha/bank_reconciliation_Q4.pdf",
          fileSize: 1_200_000,
          aiMatchedToId: bankReconDoc?.id ?? null,
          aiConfidence: 0.95,
          firstPageText: null,
        },
      ],
    });
    console.log("  Created ClientSubmission (INCOMPLETE) with 3 submitted documents for Alpha Corp");
  }

  console.log("\nSeeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
