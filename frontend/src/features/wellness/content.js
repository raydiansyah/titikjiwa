export const DAILY_PROMPTS = [
  "Hal kecil apa yang membantumu merasa sedikit lebih aman?",
  "Apa yang ingin kamu maafkan dari dirimu hari ini?",
  "Kapan terakhir kali kamu merasa benar-benar tenang?",
  "Apa yang sedang kamu tahan dan ingin kamu lepaskan?",
  "Siapa yang membuatmu merasa diterima apa adanya?",
  "Apa yang akan kamu katakan pada dirimu di masa kecil?",
  "Batasan apa yang ingin kamu jaga minggu ini?",
  "Apa yang biasanya kamu rasakan tapi jarang kamu akui?",
  "Hal apa yang dulu berat, tapi kini terasa lebih ringan?",
  "Apa yang kamu butuhkan hari ini, sejujurnya?",
  "Momen kecil apa yang ingin kamu simpan dari minggu ini?",
  "Apa yang membuatmu bertahan sampai hari ini?",
  "Bagaimana rasanya menjadi dirimu akhir-akhir ini?",
  "Apa yang ingin kamu dengar dari orang lain saat ini?",
];

export const CRISIS_PATTERN = /bunuh diri|ingin mati|pengen mati|mengakhiri hidup|akhiri hidup|menyakiti diri|melukai diri|self.?harm|sayat|gantung diri|tidak (ingin|mau) hidup|lebih baik (aku|saya) (mati|tidak ada)/i;

export function getDayOfYear(date = new Date()) {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - startOfYear.getTime()) / 86_400_000);
}

export function getDailyPrompt(date = new Date()) {
  return DAILY_PROMPTS[getDayOfYear(date) % DAILY_PROMPTS.length];
}

export function containsCrisisLanguage(value) {
  return typeof value === "string" && CRISIS_PATTERN.test(value);
}
