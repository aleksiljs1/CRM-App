import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  const users = [
    // ── Global ──
    {
      email: "admin@kreston.al",
      name: "Elena Marku",
      password: "admin123",
      role: "ADMIN" as const,
      department: null,
    },
    {
      email: "partner@kreston.al",
      name: "Arben Dervishi",
      password: "partner123",
      role: "PARTNER" as const,
      department: null,
    },
    {
      email: "client@alpha.com",
      name: "John Alpha",
      password: "client123",
      role: "CLIENT" as const,
      department: null,
    },

    // ── HR Department ──
    {
      email: "hr.manager@kreston.al",
      name: "Besa Hoxha",
      password: "hr123",
      role: "MANAGER" as const,
      department: "HR" as const,
    },
    {
      email: "hr.senior@kreston.al",
      name: "Dritan Kelmendi",
      password: "hr123",
      role: "SENIOR" as const,
      subRole: "Senior HR Specialist",
      department: "HR" as const,
    },
    {
      email: "hr.associate@kreston.al",
      name: "Elira Basha",
      password: "hr123",
      role: "ASSOCIATE" as const,
      subRole: "Senior Associate",
      department: "HR" as const,
    },
    {
      email: "hr.junior@kreston.al",
      name: "Fjolla Gashi",
      password: "hr123",
      role: "JUNIOR" as const,
      subRole: "Junior HR Coordinator",
      department: "HR" as const,
    },
    {
      email: "hr.intern@kreston.al",
      name: "Genti Shehu",
      password: "hr123",
      role: "INTERN" as const,
      department: "HR" as const,
    },

    // ── Audit Department ──
    {
      email: "audit.manager@kreston.al",
      name: "Ilir Brahimi",
      password: "audit123",
      role: "MANAGER" as const,
      department: "AUDIT" as const,
    },
    {
      email: "audit.senior@kreston.al",
      name: "Jeta Rexhepi",
      password: "audit123",
      role: "SENIOR" as const,
      subRole: "Senior Auditor",
      department: "AUDIT" as const,
    },
    {
      email: "audit.associate@kreston.al",
      name: "Klea Murati",
      password: "audit123",
      role: "ASSOCIATE" as const,
      subRole: "Audit Associate",
      department: "AUDIT" as const,
    },
    {
      email: "audit.junior@kreston.al",
      name: "Luan Berisha",
      password: "audit123",
      role: "JUNIOR" as const,
      subRole: "Junior Auditor",
      department: "AUDIT" as const,
    },

    // ── Legal Department ──
    {
      email: "legal.manager@kreston.al",
      name: "Mira Topalli",
      password: "legal123",
      role: "MANAGER" as const,
      department: "LEGAL" as const,
    },
    {
      email: "legal.senior@kreston.al",
      name: "Niko Çela",
      password: "legal123",
      role: "SENIOR" as const,
      subRole: "Senior Legal Counsel",
      department: "LEGAL" as const,
    },
    {
      email: "legal.associate@kreston.al",
      name: "Ornela Kapllani",
      password: "legal123",
      role: "ASSOCIATE" as const,
      subRole: "Junior Associate",
      department: "LEGAL" as const,
    },
    {
      email: "legal.junior@kreston.al",
      name: "Petrit Lika",
      password: "legal123",
      role: "JUNIOR" as const,
      subRole: "Legal Intern",
      department: "LEGAL" as const,
    },

    // ── Accounting & Tax Department ──
    {
      email: "tax.manager@kreston.al",
      name: "Qemal Zorba",
      password: "tax123",
      role: "MANAGER" as const,
      department: "ACCOUNTING_TAX" as const,
    },
    {
      email: "tax.senior@kreston.al",
      name: "Rina Hyseni",
      password: "tax123",
      role: "SENIOR" as const,
      subRole: "Senior Tax Advisor",
      department: "ACCOUNTING_TAX" as const,
    },
    {
      email: "tax.associate@kreston.al",
      name: "Sokol Duka",
      password: "tax123",
      role: "ASSOCIATE" as const,
      subRole: "Tax Associate",
      department: "ACCOUNTING_TAX" as const,
    },
    {
      email: "tax.junior@kreston.al",
      name: "Teuta Vata",
      password: "tax123",
      role: "JUNIOR" as const,
      subRole: "Junior Accountant",
      department: "ACCOUNTING_TAX" as const,
    },

    // ── Bookkeeping & Payroll Department ──
    {
      email: "payroll.manager@kreston.al",
      name: "Uran Krasniqi",
      password: "payroll123",
      role: "MANAGER" as const,
      department: "BOOKKEEPING_PAYROLL" as const,
    },
    {
      email: "payroll.senior@kreston.al",
      name: "Vjosa Malaj",
      password: "payroll123",
      role: "SENIOR" as const,
      subRole: "Senior Payroll Specialist",
      department: "BOOKKEEPING_PAYROLL" as const,
    },
    {
      email: "payroll.associate@kreston.al",
      name: "Xheni Daci",
      password: "payroll123",
      role: "ASSOCIATE" as const,
      subRole: "Bookkeeping Associate",
      department: "BOOKKEEPING_PAYROLL" as const,
    },
    {
      email: "payroll.junior@kreston.al",
      name: "Ylber Tafa",
      password: "payroll123",
      role: "JUNIOR" as const,
      subRole: "Junior Bookkeeper",
      department: "BOOKKEEPING_PAYROLL" as const,
    },

    // ── Advisory Department ──
    {
      email: "advisory.manager@kreston.al",
      name: "Zana Përgjoka",
      password: "advisory123",
      role: "MANAGER" as const,
      department: "ADVISORY" as const,
    },
    {
      email: "advisory.senior@kreston.al",
      name: "Ardi Canaj",
      password: "advisory123",
      role: "SENIOR" as const,
      subRole: "Senior Business Consultant",
      department: "ADVISORY" as const,
    },
    {
      email: "advisory.associate@kreston.al",
      name: "Blerina Shala",
      password: "advisory123",
      role: "ASSOCIATE" as const,
      subRole: "Advisory Associate",
      department: "ADVISORY" as const,
    },
    {
      email: "advisory.junior@kreston.al",
      name: "Çelik Hoti",
      password: "advisory123",
      role: "JUNIOR" as const,
      subRole: "Junior Analyst",
      department: "ADVISORY" as const,
    },

    // ── Marketing Department ──
    {
      email: "marketing.manager@kreston.al",
      name: "Dafina Osmani",
      password: "marketing123",
      role: "MANAGER" as const,
      department: "MARKETING" as const,
    },
    {
      email: "marketing.associate@kreston.al",
      name: "Ermal Peci",
      password: "marketing123",
      role: "ASSOCIATE" as const,
      subRole: "Digital Marketing Specialist",
      department: "MARKETING" as const,
    },

    // ── Finance (Internal) Department ──
    {
      email: "finance.manager@kreston.al",
      name: "Flora Thaçi",
      password: "finance123",
      role: "MANAGER" as const,
      department: "FINANCE" as const,
    },
    {
      email: "finance.senior@kreston.al",
      name: "Gëzim Rama",
      password: "finance123",
      role: "SENIOR" as const,
      subRole: "Senior Financial Analyst",
      department: "FINANCE" as const,
    },
    {
      email: "finance.associate@kreston.al",
      name: "Hana Koci",
      password: "finance123",
      role: "ASSOCIATE" as const,
      subRole: "Finance Associate",
      department: "FINANCE" as const,
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
