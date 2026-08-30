const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
(async () => {
  const owners = await p.user.findMany({ where: { role: { in: ["BUSINESS", "SPECIALIST"] } } });
  for (const u of owners) {
    await p.subscription.upsert({
      where: { userId: u.id },
      update: { plan: "TRIAL", status: "ACTIVE", trialEndsAt: new Date(Date.now() + 30 * 24 * 3600 * 1000) },
      create: { userId: u.id, plan: "TRIAL", status: "ACTIVE", trialEndsAt: new Date(Date.now() + 30 * 24 * 3600 * 1000) },
    });
  }
  console.log("trial subscriptions set for", owners.length, "owners");
  await p.$disconnect();
})();
