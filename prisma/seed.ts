// Seed с demo-данными для Бишкека. Все demo-сущности помечены isDemo = true
// (раздел 47 ТЗ: не создавать ложных реальных данных, помечать как Demo data).
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Очистка БД…");
  await prisma.$transaction([
    prisma.message.deleteMany(), prisma.conversation.deleteMany(),
    prisma.review.deleteMany(), prisma.favorite.deleteMany(),
    prisma.orderItem.deleteMany(), prisma.order.deleteMany(),
    prisma.payment.deleteMany(), prisma.complaint.deleteMany(),
    prisma.notification.deleteMany(), prisma.searchHistory.deleteMany(),
    prisma.location.deleteMany(), prisma.promotion.deleteMany(),
    prisma.subscription.deleteMany(), prisma.video.deleteMany(),
    prisma.verificationDocument.deleteMany(), prisma.verification.deleteMany(),
    prisma.productImage.deleteMany(), prisma.product.deleteMany(),
    prisma.serviceImage.deleteMany(), prisma.service.deleteMany(),
    prisma.businessHours.deleteMany(), prisma.businessImage.deleteMany(),
    prisma.business.deleteMany(), prisma.specialistImage.deleteMany(),
    prisma.specialist.deleteMany(), prisma.profile.deleteMany(),
    prisma.user.deleteMany(), prisma.category.deleteMany(), prisma.city.deleteMany(),
  ]);

  console.log("Город…");
  const bishkek = await prisma.city.create({
    data: { name: "Бишкек", nameKy: "Бишкек", country: "Кыргызстан", region: "Чуй", lat: 42.8746, lng: 74.5698 },
  });

  console.log("Категории…");
  const parents = [
    { slug: "home-repair", name: "Дом и ремонт", nameKy: "Үй жана оңдоо", icon: "🏠" },
    { slug: "electronics", name: "Техника", nameKy: "Техника", icon: "📱" },
    { slug: "auto", name: "Авто", nameKy: "Авто", icon: "🚗" },
    { slug: "beauty", name: "Красота", nameKy: "Сулуулук", icon: "💅" },
    { slug: "education", name: "Обучение", nameKy: "Билим берүү", icon: "🎓" },
    { slug: "services", name: "Услуги", nameKy: "Кызматтар", icon: "🛠" },
  ];
  const parentMap = new Map<string, number>();
  for (let i = 0; i < parents.length; i++) {
    const c = await prisma.category.create({ data: { ...parents[i], sortOrder: i } });
    parentMap.set(c.slug, c.id);
  }
  const children: [string, string, string | null, string][] = [
    ["plumbing", "Сантехника", "home-repair", "🚰"],
    ["electrical", "Электрика", "home-repair", "⚡"],
    ["repair", "Ремонт", "home-repair", "🔨"],
    ["construction", "Строительство", "home-repair", "🧱"],
    ["furniture", "Мебель", "home-repair", "🛋️"],
    ["phones", "Телефоны", "electronics", "📱"],
    ["computers", "Компьютеры", "electronics", "💻"],
    ["appliances", "Бытовая техника", "electronics", "🧊"],
    ["electronics-g", "Электроника", "electronics", "🎧"],
    ["auto-repair", "Ремонт авто", "auto", "🔧"],
    ["auto-parts", "Запчасти", "auto", "⚙️"],
    ["car-wash", "Мойка", "auto", "🧼"],
    ["tire-service", "Шиномонтаж", "auto", "🛞"],
    ["transport", "Перевозка", "auto", "🚚"],
    ["haircut", "Парикмахеры", "beauty", "✂️"],
    ["cosmetology", "Косметологи", "beauty", "🧖‍♀️"],
    ["nails", "Маникюр", "beauty", "💅"],
    ["massage", "Массаж", "beauty", "💆"],
    ["tutors", "Репетиторы", "education", "📚"],
    ["languages", "Языки", "education", "🗣"],
    ["courses", "Курсы", "education", "🎓"],
    ["cleaning", "Уборка", "services", "🧹"],
    ["delivery", "Доставка", "services", "📦"],
    ["photo", "Фотографы", "services", "📷"],
    ["design", "Дизайнеры", "services", "🎨"],
  ];
  const cat = new Map<string, number>(parentMap);
  for (const [slug, name, parent, icon] of children) {
    const c = await prisma.category.create({
      data: { slug, name, icon, parentId: parent ? parentMap.get(parent)! : null },
    });
    cat.set(slug, c.id);
  }

  console.log("Пользователи…");
  const pwAdmin = await bcrypt.hash("Admin123!", 10);
  const pwDemo = await bcrypt.hash("Demo1234", 10);

  await prisma.user.create({
    data: { email: "admin@naydi.kg", passwordHash: pwAdmin, name: "Администратор", role: "ADMIN", cityId: bishkek.id, locale: "ru" },
  });
  const customer = await prisma.user.create({
    data: { phone: "+996700111111", passwordHash: pwDemo, name: "Айбек", role: "CUSTOMER", cityId: bishkek.id, lat: 42.8746, lng: 74.5698, locale: "ru", profile: { create: { bio: "Демо-покупатель" } } },
  });
  const customer2 = await prisma.user.create({
    data: { phone: "+996700222222", passwordHash: pwDemo, name: "Перизат", role: "CUSTOMER", cityId: bishkek.id, lat: 42.8522, lng: 74.6015, locale: "ru" },
  });
  const techOwner = await prisma.user.create({
    data: { email: "tech@naydi.kg", passwordHash: pwDemo, name: "Улан", role: "BUSINESS", cityId: bishkek.id, locale: "ru" },
  });
  const plumbOwner = await prisma.user.create({
    data: { phone: "+996555333444", passwordHash: pwDemo, name: "Марат", role: "BUSINESS", cityId: bishkek.id, locale: "ru" },
  });
  const autoOwner = await prisma.user.create({
    data: { phone: "+996555100200", passwordHash: pwDemo, name: "Дмитрий", role: "BUSINESS", cityId: bishkek.id, locale: "ru" },
  });
  const beautyOwner = await prisma.user.create({
    data: { phone: "+996709556677", passwordHash: pwDemo, name: "Гульнара", role: "BUSINESS", cityId: bishkek.id, locale: "ru" },
  });
  const furnitureOwner = await prisma.user.create({
    data: { phone: "+996312607080", passwordHash: pwDemo, name: "Виктор", role: "BUSINESS", cityId: bishkek.id, locale: "ru" },
  });
  const stroiOwner = await prisma.user.create({
    data: { phone: "+996312906060", passwordHash: pwDemo, name: "Эркин", role: "BUSINESS", cityId: bishkek.id, locale: "ru" },
  });
  const asylanUser = await prisma.user.create({
    data: { phone: "+996777123456", passwordHash: pwDemo, name: "Асылан", role: "SPECIALIST", cityId: bishkek.id, lat: 42.8581, lng: 74.5765, locale: "ru" },
  });
  const meerimUser = await prisma.user.create({
    data: { phone: "+996777654321", passwordHash: pwDemo, name: "Мээрим", role: "SPECIALIST", cityId: bishkek.id, lat: 42.8662, lng: 74.5478, locale: "ru" },
  });
  const bakytUser = await prisma.user.create({
    data: { phone: "+996770987654", passwordHash: pwDemo, name: "Бакыт", role: "SPECIALIST", cityId: bishkek.id, lat: 42.8460, lng: 74.5870, locale: "ru" },
  });
  const nurlanUser = await prisma.user.create({
    data: { phone: "+996770112233", passwordHash: pwDemo, name: "Нурлан", role: "SPECIALIST", cityId: bishkek.id, lat: 42.8801, lng: 74.6120, locale: "ru" },
  });
  const aidaUser = await prisma.user.create({
    data: { email: "aida@naydi.kg", passwordHash: pwDemo, name: "Аида", role: "SPECIALIST", cityId: bishkek.id, lat: 42.8629, lng: 74.5280, locale: "ru" },
  });
  const timurUser = await prisma.user.create({
    data: { email: "timur@naydi.kg", passwordHash: pwDemo, name: "Тимур", role: "SPECIALIST", cityId: bishkek.id, lat: 42.8710, lng: 74.5402, locale: "ru" },
  });

  console.log("Бизнесы…");
  const mkHours = (days: [number, string, string, boolean][] = []) =>
    Array.from({ length: 7 }, (_, d) => {
      const custom = days.find((x) => x[0] === d);
      return { day: d, open: custom?.[1] ?? "09:00", close: custom?.[2] ?? "18:00", isClosed: custom?.[3] ?? false };
    });

  const techMarket = await prisma.business.create({
    data: {
      slug: "tehnomarket-bishkek", ownerId: techOwner.id, name: "ТехноМаркет Бишкек",
      description: "Магазин электроники и бытовой техники в центре Бишкека. Гарантия, рассрочка, доставка по городу.",
      logoUrl: "/img/biz-tech.svg", categoryId: cat.get("electronics")!, cityId: bishkek.id,
      address: "пр. Чуй 114", lat: 42.8741, lng: 74.6035, phone: "+996312901010", whatsapp: "+996312901010",
      isVerified: true, verificationStatus: "VERIFIED", isDemo: true, viewCount: 1240,
      hours: { create: mkHours([[5, "10:00", "16:00", false], [6, "10:00", "15:00", false]]) },
    },
  });
  const plumbMaster = await prisma.business.create({
    data: {
      slug: "santehmaster-kg", ownerId: plumbOwner.id, name: "СантехМастер",
      description: "Сантехнические работы любой сложности: замена смесителей, труб, установка сантехники. Выезд в день звонка.",
      logoUrl: "/img/biz-plumb.svg", categoryId: cat.get("plumbing")!, cityId: bishkek.id,
      address: "ул. Ахунбаева 62", lat: 42.8531, lng: 74.5810, phone: "+996555333444",
      isVerified: true, verificationStatus: "VERIFIED", isDemo: true, viewCount: 860,
      hours: { create: mkHours([[0, "08:00", "20:00", false], [1, "08:00", "20:00", false], [2, "08:00", "20:00", false], [3, "08:00", "20:00", false], [4, "08:00", "20:00", false], [5, "09:00", "17:00", false], [6, "10:00", "15:00", false]]) },
    },
  });
  const autoService = await prisma.business.create({
    data: {
      slug: "autoservice-24", ownerId: autoOwner.id, name: "АвтоСервис 24/7",
      description: "Ремонт легковых авто, шиномонтаж, диагностика. Работаем круглосуточно.",
      logoUrl: "/img/biz-auto.svg", categoryId: cat.get("auto-repair")!, cityId: bishkek.id,
      address: "ул. Молодой Гвардии 7", lat: 42.8674, lng: 74.6270, phone: "+996312443322",
      verificationStatus: "PENDING", isDemo: true, viewCount: 410,
      hours: { create: mkHours([[0, "00:00", "23:59", false], [1, "00:00", "23:59", false], [2, "00:00", "23:59", false], [3, "00:00", "23:59", false], [4, "00:00", "23:59", false], [5, "00:00", "23:59", false], [6, "00:00", "23:59", false]]) },
    },
  });
  const beautyLoft = await prisma.business.create({
    data: {
      slug: "beauty-loft", ownerId: beautyOwner.id, name: "Beauty Loft",
      description: "Салон красоты: стрижки, окрашивание, маникюр, косметология.",
      logoUrl: "/img/biz-beauty.svg", categoryId: cat.get("haircut")!, cityId: bishkek.id,
      address: "ул. Киевская 95", lat: 42.8602, lng: 74.5912, phone: "+996709556677",
      isVerified: true, verificationStatus: "VERIFIED", isDemo: true, viewCount: 990,
    },
  });
  const furnitureDom = await prisma.business.create({
    data: {
      slug: "mebeldom", ownerId: furnitureOwner.id, name: "МебельДом",
      description: "Мебель на заказ и готовая: диваны, шкафы, кухни. Своё производство.",
      logoUrl: "/img/biz-furn.svg", categoryId: cat.get("furniture")!, cityId: bishkek.id,
      address: "ул. Логвиненко 22", lat: 42.8498, lng: 74.5420, phone: "+996312607080",
      isDemo: true, viewCount: 320,
    },
  });
  const stroiDeka = await prisma.business.create({
    data: {
      slug: "stroi-deka", ownerId: stroiOwner.id, name: "СтройМатериалы Дека",
      description: "Строительные материалы оптом и в розницу: цемент, кирпич, песок, инструмент.",
      logoUrl: "/img/biz-build.svg", categoryId: cat.get("construction")!, cityId: bishkek.id,
      address: "Западный рынок, ряд 14", lat: 42.8392, lng: 74.5170, phone: "+996312906060",
      isDemo: true, viewCount: 540,
    },
  });
  void techMarket; void plumbMaster; void autoService; void beautyLoft; void furnitureDom; void stroiDeka;

  console.log("Специалисты…");
  const mkSpec = (data: Parameters<typeof prisma.specialist.create>[0]["data"]) =>
    prisma.specialist.create({ data: { ...data, cityId: bishkek.id, isDemo: true } });

  const asylan = await mkSpec({
    userId: asylanUser.id, slug: "asylan-elektrik", profession: "Электрик", photoUrl: "/img/a-m1.svg",
    description: "Электрик с 8-летним стажем. Монтаж проводки, замена розеток, подключение техники. Чистая работа, гарантия.",
    experienceYears: 8, priceFrom: 500, priceTo: 5000, district: "Центр, Октябрьский район", isOnSite: true,
    availability: "Пн–Сб 08:00–20:00, сегодня свободен после 15:00", categoryId: cat.get("electrical")!,
    lat: 42.8581, lng: 74.5765, phone: "+996777123456", isVerified: true, verificationStatus: "VERIFIED", viewCount: 720,
  });
  const meerim = await mkSpec({
    userId: meerimUser.id, slug: "meerim-kosmetolog", profession: "Косметолог", photoUrl: "/img/a-f1.svg",
    description: "Косметолог-эстетист. Чистки лица, уходы, брови и ресницы. Работаю в салоне и на дому.",
    experienceYears: 5, priceFrom: 900, priceTo: 3500, district: "Бишкек, все районы", isOnSite: true,
    availability: "Ежедневно 10:00–19:00 по записи", categoryId: cat.get("cosmetology")!,
    lat: 42.8662, lng: 74.5478, phone: "+996777654321", isVerified: true, verificationStatus: "VERIFIED", viewCount: 640,
  });
  const bakyt = await mkSpec({
    userId: bakytUser.id, slug: "bakyt-perevozki", profession: "Водитель, грузоперевозки", photoUrl: "/img/a-m2.svg",
    description: "Перевозка мебели, бытовой техники, переезды. Газель 3 м, грузчики при необходимости.",
    experienceYears: 6, priceFrom: 1500, priceTo: 6000, district: "Бишкек и пригород", isOnSite: true,
    availability: "Ежедневно 07:00–23:00, сегодня свободен вечером", categoryId: cat.get("transport")!,
    lat: 42.8460, lng: 74.5870, phone: "+996770987654", viewCount: 380,
  });
  const nurlan = await mkSpec({
    userId: nurlanUser.id, slug: "nurlan-stiralka", profession: "Мастер по ремонту стиральных машин", photoUrl: "/img/a-m3.svg",
    description: "Ремонт стиральных и посудомоечных машин на дому. Диагностика бесплатно при ремонте.",
    experienceYears: 10, priceFrom: 1200, priceTo: 8000, district: "Все районы Бишкека", isOnSite: true,
    availability: "Пн–Вс 09:00–21:00", categoryId: cat.get("appliances")!,
    lat: 42.8801, lng: 74.6120, phone: "+996770112233", isVerified: true, verificationStatus: "VERIFIED", viewCount: 810,
  });
  const aida = await mkSpec({
    userId: aidaUser.id, slug: "aida-english", profession: "Репетитор английского языка", photoUrl: "/img/a-f2.svg",
    description: "Преподаватель английского: IELTS подготовка, разговорный английский для взрослых и школьников.",
    experienceYears: 7, priceFrom: 700, priceTo: 1200, district: "Онлайн + центр города", isOnSite: false,
    availability: "Пн–Пт 14:00–20:00, Сб 10:00–14:00", categoryId: cat.get("languages")!,
    lat: 42.8629, lng: 74.5280, viewCount: 450,
  });
  const timur = await mkSpec({
    userId: timurUser.id, slug: "timur-it", profession: "IT-специалист, компьютерный мастер", photoUrl: "/img/a-m4.svg",
    description: "Сборка и ремонт компьютеров, установка Windows/Ubuntu, восстановление данных, настройка сетей.",
    experienceYears: 9, priceFrom: 500, priceTo: 4000, district: "Выезд по всему городу", isOnSite: true,
    availability: "Ежедневно 09:00–22:00", categoryId: cat.get("computers")!,
    lat: 42.8710, lng: 74.5402, phone: "+996708334455", isVerified: true, verificationStatus: "VERIFIED", viewCount: 560,
  });

  console.log("Товары…");
  const mkProduct = (data: Parameters<typeof prisma.product.create>[0]["data"]) =>
    prisma.product.create({ data: { ...data, cityId: bishkek.id, isDemo: true } });

  const iphone = await mkProduct({
    businessId: techMarket.id, categoryId: cat.get("phones")!, title: "iPhone 13 128GB",
    description: "Оригинал, сертификат, состояние нового. Гарантия магазина 6 месяцев. Цвета: чёрный, синий, розовый.",
    price: 87000, condition: "NEW", status: "AVAILABLE", quantity: 4,
    address: "пр. Чуй 114", lat: 42.8741, lng: 74.6035, viewCount: 530, isPromoted: true,
    images: { create: [{ url: "/img/p-phone.svg" }] },
  });
  await mkProduct({
    businessId: techMarket.id, categoryId: cat.get("phones")!, title: "Samsung Galaxy A55 256GB",
    description: "Новый, запечатанный. Официальная гарантия 12 месяцев.",
    price: 34900, condition: "NEW", status: "AVAILABLE", quantity: 7,
    address: "пр. Чуй 114", lat: 42.8741, lng: 74.6035, viewCount: 210,
    images: { create: [{ url: "/img/p-phone.svg" }] },
  });
  await mkProduct({
    businessId: techMarket.id, categoryId: cat.get("computers")!, title: "Ноутбук Lenovo IdeaPad 3 (Ryzen 5, 16GB, 512GB SSD)",
    description: "Отличный вариант для работы и учёбы до 70 000 сом. Новый, гарантия 1 год.",
    price: 62900, condition: "NEW", status: "AVAILABLE", quantity: 3,
    address: "пр. Чуй 114", lat: 42.8741, lng: 74.6035, viewCount: 180,
    images: { create: [{ url: "/img/p-laptop.svg" }] },
  });
  await mkProduct({
    businessId: techMarket.id, categoryId: cat.get("appliances")!, title: "Холодильник Bosch KGV36 (200л)",
    description: "Новый холодильник, класс A+, тихий. Доставка по Бишкеку бесплатно.",
    price: 45500, condition: "NEW", status: "AVAILABLE", quantity: 2,
    address: "пр. Чуй 114", lat: 42.8741, lng: 74.6035, viewCount: 150,
    images: { create: [{ url: "/img/p-fridge.svg" }] },
  });
  await mkProduct({
    businessId: techMarket.id, categoryId: cat.get("appliances")!, title: "Стиральная машина LG 7кг — б/у, отличное состояние",
    description: "Состояние отличное, обслужена. Причина продажи — переезд.",
    price: 18000, condition: "USED", status: "AVAILABLE", quantity: 1,
    address: "пр. Чуй 114", lat: 42.8741, lng: 74.6035, viewCount: 95,
    images: { create: [{ url: "/img/p-washer.svg" }] },
  });
  await mkProduct({
    businessId: techMarket.id, categoryId: cat.get("electronics-g")!, title: "Телевизор Xiaomi 43\" Android TV",
    description: "Smart TV, 4K, новый в коробке.",
    price: 27900, condition: "NEW", status: "AVAILABLE", quantity: 5,
    address: "пр. Чуй 114", lat: 42.8741, lng: 74.6035, viewCount: 120,
    images: { create: [{ url: "/img/p-tv.svg" }] },
  });
  await mkProduct({
    businessId: stroiDeka.id, categoryId: cat.get("construction")!, title: "Цемент М400, 50 кг",
    description: "Цемент производства Кыргызстана. Опт от 10 мешков — скидка.",
    price: 420, condition: "NEW", status: "AVAILABLE", quantity: 500,
    address: "Западный рынок, ряд 14", lat: 42.8392, lng: 74.5170, viewCount: 88,
    images: { create: [{ url: "/img/p-build.svg" }] },
  });
  await mkProduct({
    businessId: stroiDeka.id, categoryId: cat.get("construction")!, title: "Кирпич облицовочный красный",
    description: "Облицовочный кирпич, цена за штуку. Доставка манипулятором.",
    price: 28, condition: "NEW", status: "AVAILABLE", quantity: 20000,
    address: "Западный рынок, ряд 14", lat: 42.8392, lng: 74.5170, viewCount: 64,
    images: { create: [{ url: "/img/p-build.svg" }] },
  });
  await mkProduct({
    businessId: furnitureDom.id, categoryId: cat.get("furniture")!, title: "Диван угловой «Бишкек» с механизмом дельфин",
    description: "Производство МебельДом. Ткань на выбор, срок изготовления 5 дней.",
    price: 38500, condition: "NEW", status: "AVAILABLE", quantity: 6,
    address: "ул. Логвиненко 22", lat: 42.8498, lng: 74.5420, viewCount: 140,
    images: { create: [{ url: "/img/p-sofa.svg" }] },
  });
  await mkProduct({
    businessId: furnitureDom.id, categoryId: cat.get("furniture")!, title: "Шкаф-купе на заказ, 2.4м",
    description: "Расчёт по размерам заказчика. Зеркала, ЛДСП, фурнитура Boyer.",
    price: 26000, condition: "NEW", status: "AVAILABLE", quantity: 10,
    address: "ул. Логвиненко 22", lat: 42.8498, lng: 74.5420, viewCount: 75,
    images: { create: [{ url: "/img/p-sofa.svg" }] },
  });
  await mkProduct({
    businessId: autoService.id, categoryId: cat.get("auto-parts")!, title: "Шины зимние Nokian 195/65 R15 — комплект",
    description: "Комплект 4 шт, б/у один сезон. Хранение включено.",
    price: 14500, condition: "USED", status: "AVAILABLE", quantity: 1,
    address: "ул. Молодой Гвардии 7", lat: 42.8674, lng: 74.6270, viewCount: 58,
    images: { create: [{ url: "/img/p-tire.svg" }] },
  });
  await mkProduct({
    businessId: plumbMaster.id, categoryId: cat.get("plumbing")!, title: "Смеситель Grohe (оригинал)",
    description: "Новый смеситель для кухни. Установка нашим мастером — 500 сом.",
    price: 4200, condition: "NEW", status: "AVAILABLE", quantity: 9,
    address: "ул. Ахунбаева 62", lat: 42.8531, lng: 74.5810, viewCount: 47,
    images: { create: [{ url: "/img/p-tool.svg" }] },
  });

  console.log("Услуги…");
  const mkService = (data: Parameters<typeof prisma.service.create>[0]["data"]) =>
    prisma.service.create({ data: { ...data, cityId: bishkek.id, isDemo: true } });

  await mkService({
    businessId: plumbMaster.id, categoryId: cat.get("plumbing")!, title: "Замена смесителя / крана",
    description: "Быстрая замена смесителя, крана, сифона. Инструменты свои.", priceFrom: 800, priceTo: 1500,
    durationMin: 60, isOnSite: true, availability: "Сегодня, выезд в течение 2 часов",
    lat: 42.8531, lng: 74.5810, images: { create: [{ url: "/img/biz-plumb.svg" }] },
  });
  await mkService({
    businessId: plumbMaster.id, categoryId: cat.get("plumbing")!, title: "Устранение протечек труб",
    description: "Диагностика и устранение протечек, замена участков труб.", priceFrom: 1200, priceTo: 4500,
    durationMin: 90, isOnSite: true, lat: 42.8531, lng: 74.5810,
  });
  const electricService = await mkService({
    specialistId: asylan.id, categoryId: cat.get("electrical")!, title: "Электрик: розетки, проводка, люстры",
    description: "Замена розеток и выключателей, монтаж проводки, подключение люстр и техники.",
    priceFrom: 500, priceTo: 4000, durationMin: 60, isOnSite: true,
    availability: "Сегодня свободен после 15:00", lat: 42.8581, lng: 74.5765,
  });
  const moverService = await mkService({
    specialistId: bakyt.id, categoryId: cat.get("transport")!, title: "Перевозка мебели, Газель 3м + грузчик",
    description: "Аккуратная перевозка мебели и техники по Бишкеку и пригороду. Упаковочные материалы включены.",
    priceFrom: 1500, priceTo: 6000, durationMin: 120, isOnSite: true,
    availability: "Сегодня вечером свободен", lat: 42.8460, lng: 74.5870,
    images: { create: [{ url: "/img/p-mover.svg" }] },
  });
  await mkService({
    specialistId: nurlan.id, categoryId: cat.get("appliances")!, title: "Ремонт стиральных машин на дому",
    description: "Диагностика бесплатно при ремонте. Ремонт в день обращения.", priceFrom: 1200, priceTo: 8000,
    durationMin: 90, isOnSite: true, availability: "Пн–Вс 09:00–21:00", lat: 42.8801, lng: 74.6120,
  });
  await mkService({
    specialistId: meerim.id, categoryId: cat.get("cosmetology")!, title: "Чистка лица + уход",
    description: "Комбинированная чистка лица с уходом по типу кожи.", priceFrom: 1800, priceTo: 2500,
    durationMin: 90, isOnSite: false, availability: "По записи", lat: 42.8662, lng: 74.5478,
  });
  await mkService({
    specialistId: aida.id, categoryId: cat.get("languages")!, title: "Английский язык: разговорный + IELTS",
    description: "Индивидуальные занятия, подготовка к IELTS, разговорные клубы.", priceFrom: 700, priceTo: 1200,
    durationMin: 60, isOnSite: false, availability: "Пн–Пт 14:00–20:00", lat: 42.8629, lng: 74.5280,
  });
  await mkService({
    specialistId: timur.id, categoryId: cat.get("computers")!, title: "Установка Windows + программы",
    description: "Установка Windows/Linux, драйверы, офисные программы, антивирус.", priceFrom: 500, priceTo: 1500,
    durationMin: 60, isOnSite: true, availability: "Ежедневно 09:00–22:00", lat: 42.8710, lng: 74.5402,
  });
  await mkService({
    businessId: autoService.id, categoryId: cat.get("tire-service")!, title: "Шиномонтаж комплект 4 колеса",
    description: "Комплексный шиномонтаж, балансировка, подкачка.", priceFrom: 700, priceTo: 1400,
    durationMin: 45, isOnSite: false, availability: "Круглосуточно", lat: 42.8674, lng: 74.6270,
  });
  await mkService({
    businessId: autoService.id, categoryId: cat.get("auto-repair")!, title: "Диагностика двигателя",
    description: "Компьютерная диагностика двигателя, расчёт ремонта.", priceFrom: 1000, priceTo: 1500,
    durationMin: 60, isOnSite: false, availability: "24/7", lat: 42.8674, lng: 74.6270,
  });
  await mkService({
    businessId: beautyLoft.id, categoryId: cat.get("haircut")!, title: "Женская стрижка + укладка",
    description: "Стрижка по форме лица, укладка в подарок.", priceFrom: 900, priceTo: 1600,
    durationMin: 75, isOnSite: false, lat: 42.8602, lng: 74.5912,
  });
  await mkService({
    businessId: stroiDeka.id, categoryId: cat.get("construction")!, title: "Доставка стройматериалов по Бишкеку",
    description: "Доставка цемента, кирпича, песка самосвалом и манипулятором.", priceFrom: 900, priceTo: 3000,
    durationMin: 120, isOnSite: false, lat: 42.8392, lng: 74.5170,
  });

  console.log("Отзывы…");
  const reviewsData: Array<{ authorId: string; targetType: string; targetId: string; rating: number; comment: string; q?: number; a?: number; s?: number; c?: number; p?: number }> = [
    { authorId: customer.id, targetType: "PRODUCT", targetId: iphone.id, rating: 5, comment: "Телефон оригинальный, всё проверил при покупке. Продавец адекватный.", q: 5, a: 5, s: 5, c: 5, p: 4 },
    { authorId: customer2.id, targetType: "PRODUCT", targetId: iphone.id, rating: 4, comment: "Хорошая цена, но хотелось бы рассрочку.", q: 5, a: 5, s: 4, c: 4, p: 4 },
    { authorId: customer.id, targetType: "SERVICE", targetId: electricService.id, rating: 5, comment: "Асылан пришёл в тот же день, розетки заменил аккуратно. Рекомендую.", q: 5, a: 5, s: 5, c: 5, p: 5 },
    { authorId: customer2.id, targetType: "SERVICE", targetId: moverService.id, rating: 5, comment: "Перевезли диван вечером, как и договаривались. Аккуратно.", q: 5, a: 5, s: 5, c: 5, p: 5 },
    { authorId: customer.id, targetType: "BUSINESS", targetId: techMarket.id, rating: 5, comment: "Большой выбор техники, честные цены.", q: 5, a: 5, s: 4, c: 5, p: 4 },
    { authorId: customer2.id, targetType: "BUSINESS", targetId: techMarket.id, rating: 4, comment: "Очередь в субботу, но сервис хороший.", q: 4, a: 5, s: 3, c: 5, p: 4 },
    { authorId: customer.id, targetType: "BUSINESS", targetId: plumbMaster.id, rating: 5, comment: "Приехали через час, протечку устранили.", q: 5, a: 5, s: 5, c: 5, p: 5 },
    { authorId: customer2.id, targetType: "BUSINESS", targetId: beautyLoft.id, rating: 5, comment: "Очень аккуратный маникюр, приятная атмосфера.", q: 5, a: 5, s: 4, c: 5, p: 4 },
    { authorId: customer.id, targetType: "SPECIALIST", targetId: nurlan.id, rating: 5, comment: "Отремонтировал стиральную машину за один визит.", q: 5, a: 5, s: 5, c: 5, p: 5 },
    { authorId: customer2.id, targetType: "SPECIALIST", targetId: asylan.id, rating: 5, comment: "Понятные цены, работа чистая.", q: 5, a: 5, s: 5, c: 5, p: 5 },
    { authorId: customer.id, targetType: "SPECIALIST", targetId: timur.id, rating: 4, comment: "Поставил Windows быстро, но опоздал на 20 минут.", q: 5, a: 5, s: 3, c: 4, p: 5 },
  ];
  for (const r of reviewsData) {
    await prisma.review.create({
      data: {
        authorId: r.authorId, targetType: r.targetType, targetId: r.targetId, rating: r.rating,
        quality: r.q, accuracy: r.a, speed: r.s, communication: r.c, priceScore: r.p,
        comment: r.comment, isDemo: true,
      },
    });
  }
  const recompute = [
    { type: "BUSINESS", model: prisma.business, ids: [techMarket.id, plumbMaster.id, autoService.id, beautyLoft.id, furnitureDom.id, stroiDeka.id] },
    { type: "SPECIALIST", model: prisma.specialist, ids: [asylan.id, meerim.id, bakyt.id, nurlan.id, aida.id, timur.id] },
  ];
  for (const { type, model, ids } of recompute) {
    for (const id of ids) {
      const agg = await prisma.review.aggregate({
        where: { targetType: type, targetId: id, status: "PUBLISHED" },
        _avg: { rating: true }, _count: { _all: true },
      });
      await (model as typeof prisma.business).update({
        where: { id },
        data: { ratingAvg: Math.round((agg._avg.rating ?? 0) * 10) / 10, reviewCount: agg._count._all },
      });
    }
  }

  console.log("Избранное, чат, заказы, жалоба, видео…");
  await prisma.favorite.create({ data: { userId: customer.id, targetType: "PRODUCT", targetId: iphone.id } });
  await prisma.favorite.create({ data: { userId: customer.id, targetType: "SPECIALIST", targetId: nurlan.id } });
  await prisma.favorite.create({ data: { userId: customer2.id, targetType: "SERVICE", targetId: moverService.id } });

  const conv = await prisma.conversation.create({
    data: { customerId: customer.id, providerUserId: techOwner.id, businessId: techMarket.id, lastMessageAt: new Date() },
  });
  await prisma.message.createMany({
    data: [
      { conversationId: conv.id, senderId: customer.id, text: "Здравствуйте! iPhone 13 в наличии? Можно рассрочку?", readAt: new Date() },
      { conversationId: conv.id, senderId: techOwner.id, text: "Добрый день! Да, есть 4 штуки. Рассрочка на 3 месяца без переплаты.", readAt: new Date() },
      { conversationId: conv.id, senderId: customer.id, text: "Отлично, приду завтра после 15:00." },
    ],
  });

  const order1 = await prisma.order.create({
    data: {
      code: "N-1001", customerId: customer.id, targetType: "PRODUCT", productId: iphone.id,
      businessId: techMarket.id, status: "COMPLETED", totalAmount: 87000, note: "Доставка до дома",
      items: { create: [{ productId: iphone.id, quantity: 1, priceAtOrder: 87000 }] },
    },
  });
  await prisma.order.create({
    data: {
      code: "N-1002", customerId: customer.id, targetType: "SERVICE", serviceId: moverService.id,
      specialistId: bakyt.id, status: "NEW", totalAmount: 2500, note: "Перевезти диван сегодня вечером",
    },
  });
  void order1;

  await prisma.complaint.create({
    data: {
      userId: customer2.id, targetType: "BUSINESS", targetId: autoService.id, reason: "WRONG_PRICE",
      description: "На сайте цена диагностики 1000 сом, по телефону назвали 1500.",
    },
  });

  await prisma.video.createMany({
    data: [
      { url: "https://example.com/videos/iphone-review.mp4", title: "Обзор iPhone 13 в ТехноМаркет", ownerType: "BUSINESS", businessId: techMarket.id, productId: iphone.id, status: "APPROVED", views: 320 },
      { url: "https://example.com/videos/engine-repair.mp4", title: "Ремонт двигателя BMW в АвтоСервис 24/7", ownerType: "BUSINESS", businessId: autoService.id, status: "PENDING" },
    ],
  });

  console.log("Готово. Аккаунты demo:");
  console.log("  Админ:    admin@naydi.kg / Admin123!");
  console.log("  Клиент:   +996700111111 / Demo1234");
  console.log("  Бизнес:   tech@naydi.kg / Demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
