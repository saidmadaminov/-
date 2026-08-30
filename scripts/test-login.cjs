// Сквозная проверка: логин всех ролей, ключевые страницы и AI-поиск.
const BASE = "http://localhost:3000";

async function login(login, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login, password }),
  });
  if (!res.ok) throw new Error(`login ${login}: ${res.status}`);
  const setCookie = res.headers.get("set-cookie") || "";
  return setCookie.split(";")[0];
}

async function page(path, cookie) {
  const res = await fetch(`${BASE}${path}`, { headers: cookie ? { cookie } : {} });
  return `${path} -> ${res.status}`;
}

async function ai(query, cookie) {
  const res = await fetch(`${BASE}/api/ai/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({ query }),
  });
  const data = await res.json();
  return `AI "${query}" -> ${res.status}, offers: ${data.offers?.length ?? "ERR"}`;
}

(async () => {
  const customer = await login("+996700111111", "Demo1234");
  const business = await login("tech@naydi.kg", "Demo1234");
  const admin = await login("admin@naydi.kg", "Admin123!");
  console.log("logins OK (customer, business, admin)");

  console.log(await page("/home", customer));
  console.log(await page("/business-dashboard", business));
  console.log(await page("/admin", admin));
  console.log(await page("/orders", customer));
  console.log(await page("/favorites", customer));
  console.log(await page("/messages", customer));
  console.log(await page("/profile", customer));
  console.log(await page("/assistant", customer));
  console.log(await page("/map?type=SERVICE", customer));
  console.log(await page("/search?q=santehnik&type=SERVICE", customer));

  console.log(await ai("Найди сантехника до 2000 сом рядом со мной", customer));
  console.log(await ai("нужен iphone до 90000", customer));
  console.log(await ai("перевезти диван сегодня вечером", customer));
})().catch((e) => {
  console.error("FAIL:", e.message);
  process.exit(1);
});
