const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
(async () => {
  const pr = await p.product.findFirst();
  const sv = await p.service.findFirst();
  const b = await p.business.findFirst();
  const s = await p.specialist.findFirst();
  console.log(JSON.stringify({ product: pr.id, service: sv.id, business: b.id, specialist: s.id }));
  await p.$disconnect();
})();
