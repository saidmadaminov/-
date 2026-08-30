// Генератор локальных SVG-заглушек для demo-данных (работают офлайн).
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outDir = new URL("../public/img", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
mkdirSync(outDir, { recursive: true });

const items = {
  "logo": ["N", "#1b52f5", "#143ee1", "#fff"],
  "p-phone": ["📱", "#e0e7ff", "#c7d2fe", "#3730a3"],
  "p-laptop": ["💻", "#dbeafe", "#bfdbfe", "#1e40af"],
  "p-fridge": ["🧊", "#cffafe", "#a5f3fc", "#155e75"],
  "p-washer": ["🌀", "#e0f2fe", "#bae6fd", "#0c4a6e"],
  "p-tv": ["📺", "#f1f5f9", "#e2e8f0", "#334155"],
  "p-tool": ["🔧", "#fef3c7", "#fde68a", "#92400e"],
  "p-car": ["🚗", "#fee2e2", "#fecaca", "#991b1b"],
  "p-tire": ["🛞", "#e5e7eb", "#d1d5db", "#374151"],
  "p-build": ["🧱", "#ffedd5", "#fed7aa", "#9a3412"],
  "p-sofa": ["🛋️", "#ede9fe", "#ddd6fe", "#5b21b6"],
  "p-beauty": ["💅", "#fce7f3", "#fbcfe8", "#9d174d"],
  "p-clean": ["🧹", "#ecfccb", "#d9f99d", "#3f6212"],
  "p-edu": ["🎓", "#e0e7ff", "#c7d2fe", "#312e81"],
  "p-photo": ["📷", "#f3e8ff", "#e9d5ff", "#6b21a8"],
  "p-mover": ["🚚", "#dbeafe", "#bfdbfe", "#1e3a8a"],
  "biz-tech": ["🏪", "#e0e7ff", "#c7d2fe", "#3730a3"],
  "biz-plumb": ["🚰", "#cffafe", "#a5f3fc", "#155e75"],
  "biz-auto": ["🔧", "#fee2e2", "#fecaca", "#991b1b"],
  "biz-beauty": ["✂️", "#fce7f3", "#fbcfe8", "#9d174d"],
  "biz-furn": ["🛋️", "#ede9fe", "#ddd6fe", "#5b21b6"],
  "biz-build": ["🏗️", "#ffedd5", "#fed7aa", "#9a3412"],
  "a-m1": ["👨‍🔧", "#e2e8f0", "#cbd5e1", "#334155"],
  "a-m2": ["🧑‍🚒", "#fecaca", "#fca5a5", "#7f1d1d"],
  "a-f1": ["👩‍🎨", "#fbcfe8", "#f9a8d4", "#831843"],
  "a-f2": ["👩‍🏫", "#c7d2fe", "#a5b4fc", "#312e81"],
  "a-m3": ["🧑‍💻", "#bae6fd", "#7dd3fc", "#0c4a6e"],
  "a-m4": ["👨‍🌾", "#d9f99d", "#bef264", "#365314"],
};

for (const [name, [emoji, c1, c2, fg]] of Object.entries(items)) {
  const isLogo = name === "logo";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/>
      <stop offset="1" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="640" height="480" fill="url(#g)"/>
  <circle cx="320" cy="215" r="150" fill="rgba(255,255,255,0.55)"/>
  ${isLogo
    ? `<text x="320" y="275" font-family="Arial, sans-serif" font-size="220" font-weight="800" fill="${fg}" text-anchor="middle">${emoji}</text>`
    : `<text x="320" y="300" font-size="180" text-anchor="middle">${emoji}</text>`}
  <text x="320" y="455" font-family="Arial, sans-serif" font-size="26" fill="${fg}" text-anchor="middle" opacity="0.75">Naydi · Demo</text>
</svg>
`;
  writeFileSync(join(outDir, `${name}.svg`), svg);
}
console.log(`OK: ${Object.keys(items).length} SVG записаны в public/img`);
