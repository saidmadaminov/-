const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
(async () => {
  const cities = await p.city.findMany();
  console.log("cities:", JSON.stringify(cities.map((c) => ({ id: c.id, name: c.name }))));
  const users = await p.user.findMany({ select: { id: true, email: true, phone: true, cityId: true } });
  console.log("users:", JSON.stringify(users));
  await p.$disconnect();
})();
