import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * One-time cleanup: collapse duplicate INCOMING emails that the old (broken)
 * de-dup logic let pile up. Groups incoming mail by
 * (userId, senderEmail, subject, body), keeps the earliest row in each group,
 * repoints any replies onto the keeper, and deletes the rest.
 *
 * Run a DRY RUN first (default):   npx tsx prisma/dedup-emails.ts
 * Then actually delete:            npx tsx prisma/dedup-emails.ts --apply
 *
 * Only touches isIncoming = true rows — sent replies are never deleted.
 */

const APPLY = process.argv.includes("--apply");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function groupKey(e: {
  userId: string | null;
  senderEmail: string;
  subject: string;
  body: string;
}) {
  return JSON.stringify([e.userId ?? "", e.senderEmail, e.subject, e.body]);
}

async function main() {
  console.log(APPLY ? "=== APPLY MODE (will delete) ===" : "=== DRY RUN (no changes) ===");

  const incoming = await prisma.email.findMany({
    where: { isIncoming: true },
    select: {
      id: true,
      userId: true,
      senderEmail: true,
      subject: true,
      body: true,
      threadId: true,
      createdAt: true,
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });

  const groups = new Map<string, typeof incoming>();
  for (const e of incoming) {
    const k = groupKey(e);
    const arr = groups.get(k);
    if (arr) arr.push(e);
    else groups.set(k, [e]);
  }

  let dupGroups = 0;
  let toDeleteIds: string[] = [];
  const repoints: { childIds: string[]; keeperId: string; keeperThread: string }[] = [];

  for (const arr of groups.values()) {
    if (arr.length <= 1) continue; // no duplicates
    dupGroups++;
    const keeper = arr[0]; // earliest (already sorted asc)
    const dups = arr.slice(1);
    const dupIds = dups.map((d) => d.id);
    toDeleteIds.push(...dupIds);

    // Find replies that point at any of the duplicate rows so we can repoint
    // them onto the keeper before deleting.
    const children = await prisma.email.findMany({
      where: { parentId: { in: dupIds } },
      select: { id: true },
    });
    if (children.length > 0) {
      repoints.push({
        childIds: children.map((c) => c.id),
        keeperId: keeper.id,
        keeperThread: keeper.threadId,
      });
    }
  }

  console.log(`Incoming emails scanned: ${incoming.length}`);
  console.log(`Duplicate groups found:  ${dupGroups}`);
  console.log(`Rows to delete:          ${toDeleteIds.length}`);
  console.log(`Reply rows to repoint:   ${repoints.reduce((n, r) => n + r.childIds.length, 0)}`);

  if (!APPLY) {
    console.log("\nDry run complete. Re-run with --apply to perform the cleanup.");
    return;
  }

  if (toDeleteIds.length === 0) {
    console.log("Nothing to delete.");
    return;
  }

  await prisma.$transaction(async (tx) => {
    for (const r of repoints) {
      await tx.email.updateMany({
        where: { id: { in: r.childIds } },
        data: { parentId: r.keeperId, threadId: r.keeperThread },
      });
    }
    const del = await tx.email.deleteMany({ where: { id: { in: toDeleteIds } } });
    console.log(`Deleted ${del.count} duplicate email rows.`);
  });

  console.log("Cleanup complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
