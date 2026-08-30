// Разбор естественного запроса в параметры поиска (раздел 8 ТЗ).
// Используется как fallback, когда LLM-ключ не настроен,
// и как эталон структуры фильтров для AI tool-calling.

export interface ParsedQuery {
  type?: "PRODUCT" | "SERVICE" | "SPECIALIST" | "BUSINESS";
  keywords: string[];
  categorySlug?: string;
  subcategorySlug?: string;
  maxPrice?: number;
  minPrice?: number;
  nearby: boolean;
  today: boolean;
  tonight: boolean;
  explanation: string;
}

interface KeywordRule {
  slug: string;
  words: string[];
}

const CATEGORY_RULES: KeywordRule[] = [
  { slug: "plumbing", words: ["сантехник", "сантехника", "смесител", "труб", "унитаз", "кран", "протечк", "водопровод"] },
  { slug: "electrical", words: ["электрик", "электр", "розетк", "проводк", "свет", "люстр", "автомат"] },
  { slug: "repair", words: ["ремонт квартир", "отделоч", "штукатур", "поклейк", "потолок"] },
  { slug: "construction", words: ["строител", "стройматериал", "цемент", "кирпич", "песок"] },
  { slug: "furniture", words: ["мебель", "диван", "шкаф", "стол", "кресло", "кровать"] },
  { slug: "phones", words: ["iphone", "телефон", "смартфон", "самсунг", "samsung", "xiaomi", "honor"] },
  { slug: "computers", words: ["компьютер", "ноутбук", "пк", "macbook", "виндост", "windows", "видеокарт"] },
  { slug: "appliances", words: ["холодильник", "стиральн", "машинк", "печ", "посудомо", "морозил", "бойлер"] },
  { slug: "electronics", words: ["электроник", "телевизор", "наушник", "колонк"] },
  { slug: "auto-repair", words: ["автосервис", "двигател", "ремонт авто", "машин", "сцеплен", "ходов"] },
  { slug: "auto-parts", words: ["запчаст", "автозапчаст", "шин", "диск", "аккумулятор"] },
  { slug: "car-wash", words: ["мойк", "автомойк", "химчистк"] },
  { slug: "tire-service", words: ["шиномонтаж", "балансировк", "переобув"] },
  { slug: "transport", words: ["перевезти", "перевозк", "грузоперевоз", "грузчик", "переезд", "газел", "такси груз"] },
  { slug: "haircut", words: ["парикмахер", "стрижк", "барбер", "окрашиван"] },
  { slug: "cosmetology", words: ["косметолог", "чистк лица", "массаж лица", "брови", "ресниц"] },
  { slug: "nails", words: ["маникюр", "педикюр", "ногт"] },
  { slug: "massage", words: ["массаж"] },
  { slug: "tutors", words: ["репетитор", "урок", "заняти", "подготовк"] },
  { slug: "languages", words: ["английск", "язык", "кыргызск", "русск", "немецк", "китайск"] },
  { slug: "courses", words: ["курс", "обучен", "тренинг"] },
  { slug: "cleaning", words: ["уборк", "клининг", "помывк", "чистк"] },
  { slug: "delivery", words: ["доставк", "курьер"] },
  { slug: "photo", words: ["фотограф", "фотосесс", "съемк"] },
  { slug: "design", words: ["дизайнер", "дизайн", "логотип", "верстк"] },
];

// К какой категории относится субкатегория (для определения типа предложения).
const SERVICE_CATS = new Set([
  "plumbing", "electrical", "repair", "car-wash", "tire-service", "transport",
  "haircut", "cosmetology", "nails", "massage", "tutors", "languages", "courses",
  "cleaning", "delivery", "photo", "design", "auto-repair",
]);
const PRODUCT_CATS = new Set([
  "phones", "computers", "appliances", "electronics", "furniture",
  "construction", "auto-parts",
]);

export function parseQuery(raw: string): ParsedQuery {
  const q = (raw || "").toLowerCase();
  const result: ParsedQuery = {
    keywords: [],
    nearby: /рядом|близко|около меня|рядом со мной|неподалеку|недалеко|около/.test(q),
    today: /сегодня|сейчас|срочно|быстро/.test(q),
    tonight: /вечером|сегодня вечером|ноч/.test(q),
    explanation: "",
  };

  // Цена: «до 90 000 сом», «от 1500», «дешевле 2000»
  const pricePatterns = [
    /(?:до|максимум|не дороже|дешевле|cheap|max)[\s]*([\d\s]{2,10})\s*(?:сом|kgs|руб)?/,
    /([\d\s]{2,10})\s*сом\s*(?:максимум|не больше)?$/,
  ];
  for (const p of pricePatterns) {
    const m = q.match(p);
    if (m) {
      const num = parseInt(m[1].replace(/\s/g, ""), 10);
      if (num > 0 && num < 100_000_000) {
        result.maxPrice = num;
        break;
      }
    }
  }
  const minMatch = q.match(/(?:от|минимум|дороже)\s*([\d\s]{2,10})/);
  if (minMatch) {
    const num = parseInt(minMatch[1].replace(/\s/g, ""), 10);
    if (num > 0 && num < 100_000_000) result.minPrice = num;
  }

  // Категория по ключевым словам
  let best: { rule: KeywordRule; hit?: string } | null = null;
  for (const rule of CATEGORY_RULES) {
    for (const w of rule.words) {
      if (q.includes(w)) {
        if (!best || w.length > (best.hit?.length ?? 0)) best = { rule, hit: w };
      }
    }
  }
  if (best) {
    result.subcategorySlug = best.rule.slug;
    result.categorySlug = PARENT_OF[best.rule.slug] ?? best.rule.slug;
    result.keywords.push(best.hit!);
  }

  // Тип предложения
  if (/специалист|мастер|электрик|сантехник|репетитор|фотограф|дизайнер|мастера по/.test(q)) {
    result.type = "SPECIALIST";
  } else if (/магазин|рынок|салон|бизнес|компани|фирм/.test(q)) {
    result.type = "BUSINESS";
  } else if (best && SERVICE_CATS.has(best.rule.slug) && !PRODUCT_CATS.has(best.rule.slug)) {
    result.type = "SERVICE";
  } else if (best && PRODUCT_CATS.has(best.rule.slug)) {
    result.type = "PRODUCT";
  } else if (/найди|нужен|нужна|нужно|заказать|сделать|ремонт|услуг/.test(q)) {
    result.type = "SERVICE";
  }

  // Значимые слова запроса (для текстового скоринга)
  const stop = new Set([
    "найди", "нужен", "нужна", "нужно", "рядом", "со", "мной", "мне", "где", "купить",
    "хочу", "подскажи", "пожалуйста", "сегодня", "вечером", "срочно", "до", "от", "сом",
    "дешевле", "дороже", "максимум", "минимум", "человек", "который", "может", "сделать",
    "и", "в", "на", "с", "для", "под", "хорошего", "лучш", "цена", "цена/качество",
  ]);
  result.keywords.push(
    ...q
      .split(/[^a-zа-яё0-9+]+/i)
      .filter((w) => w.length > 2 && !stop.has(w) && !/^\d+$/.test(w))
      .slice(0, 6)
  );

  result.explanation = buildExplanation(raw, result);
  return result;
}

const PARENT_OF: Record<string, string> = {
  plumbing: "home-repair", electrical: "home-repair", repair: "home-repair",
  construction: "home-repair", furniture: "home-repair",
  phones: "electronics", computers: "electronics", appliances: "electronics",
  electronics: "electronics",
  "auto-repair": "auto", "auto-parts": "auto", "car-wash": "auto",
  "tire-service": "auto", transport: "auto",
  haircut: "beauty", cosmetology: "beauty", nails: "beauty", massage: "beauty",
  tutors: "education", languages: "education", courses: "education",
  cleaning: "services", delivery: "services", photo: "services", design: "services",
};

function buildExplanation(raw: string, p: ParsedQuery): string {
  const parts: string[] = [];
  if (p.subcategorySlug) parts.push(`категория: ${p.subcategorySlug}`);
  if (p.maxPrice) parts.push(`цена до ${p.maxPrice} сом`);
  if (p.minPrice) parts.push(`цена от ${p.minPrice} сом`);
  if (p.type) parts.push(`тип: ${p.type.toLowerCase()}`);
  parts.push(p.nearby ? "рядом с вами" : "по всему городу");
  if (p.today) parts.push("желательно сегодня");
  return `Разобрал запрос «${raw.trim()}»: ${parts.join(", ")}.`;
}
