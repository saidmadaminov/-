// AI-слой (разделы 25–26 ТЗ): LLM с tool calling поверх внутреннего поиска.
// AI НЕ придумывает предложения — только извлекает параметры и вызывает
// собственный backend-поиск, а объясняет выбор на основе реальных данных.
import { parseQuery, type ParsedQuery } from "./parse";
import type { TargetType } from "@/types";

export interface AiSearchFilters extends ParsedQuery {
  typeResolved?: TargetType | "ALL";
}

/** Вызов LLM (любой OpenAI-совместимый endpoint). Возвращает null без ключа. */
export async function llmParseQuery(query: string): Promise<ParsedQuery | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.AI_MODEL || "gpt-4o-mini";

  const tools = [
    {
      type: "function",
      function: {
        name: "searchOffers",
        description:
          "Поиск реальных товаров, услуг, специалистов и бизнесов платформы. Вызывай эту функцию с извлечёнными параметрами запроса пользователя.",
        parameters: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["PRODUCT", "SERVICE", "SPECIALIST", "BUSINESS", "ALL"] },
            keywords: { type: "array", items: { type: "string" }, description: "Ключевые слова запроса" },
            categorySlug: { type: "string", description: "slug категории, если определился" },
            maxPrice: { type: "number" },
            minPrice: { type: "number" },
            nearby: { type: "boolean" },
            today: { type: "boolean" },
          },
          required: ["type", "keywords"],
        },
      },
    },
  ];

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "Ты ассистент локальной платформы Бишкека. Извлеки из запроса пользователя параметры и вызови функцию searchOffers. Не выдумывай предложения, цены и отзывы — только реальные данные из базы.",
          },
          { role: "user", content: query },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "searchOffers" } },
        temperature: 0,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0]?.function;
    if (!call || call.name !== "searchOffers") return null;
    const args = JSON.parse(call.arguments) as Partial<ParsedQuery>;
    const fallback = parseQuery(query);
    return {
      ...fallback,
      ...args,
      keywords: Array.isArray(args.keywords) && args.keywords.length ? args.keywords : fallback.keywords,
      explanation: `AI разобрал запрос: ${JSON.stringify(args)}`,
    };
  } catch {
    return null;
  }
}

/** Главный вход: сначала LLM, при отсутствии ключа/ошибке — встроенный парсер. */
export async function aiParseQuery(query: string): Promise<{ parsed: ParsedQuery; usedLlm: boolean }> {
  const llm = await llmParseQuery(query);
  if (llm) return { parsed: llm, usedLlm: true };
  return { parsed: parseQuery(query), usedLlm: false };
}
