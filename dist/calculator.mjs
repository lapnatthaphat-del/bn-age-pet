const CAT_ANCHORS = [
  [0, 0], [1 / 12, 1], [0.25, 4], [0.5, 10], [1, 15], [2, 24]
];

const DOG_RATES = { small: 4, medium: 4.6, large: 5.4, giant: 7.4 };

export const PET_PROFILES = {
  rabbit: { label: "กระต่าย", emoji: "🐰", lifespan: 10, range: "8–12 ปี", group: "small" },
  hamster: { label: "แฮมสเตอร์", emoji: "🐹", lifespan: 1.5, range: "1–2 ปี", group: "small" },
  guineaPig: { label: "แกสบี้", emoji: "🐹", lifespan: 6, range: "4–8 ปี", group: "small" },
  chinchilla: { label: "ชินชิลลา", emoji: "🐭", lifespan: 10, range: "4–15 ปี", group: "small" },
  rat: { label: "หนูแรท", emoji: "🐀", lifespan: 2.5, range: "2–3 ปี", group: "small" },
  budgie: { label: "นกหงส์หยก", emoji: "🦜", lifespan: 7.5, range: "5–10 ปี", group: "bird" },
  cockatiel: { label: "นกค็อกคาเทล", emoji: "🦜", lifespan: 20, range: "สูงสุดราว 20 ปี", group: "bird" },
  canary: { label: "นกคีรีบูน", emoji: "🐤", lifespan: 15, range: "สูงสุดราว 15 ปี", group: "bird" },
  africanGrey: { label: "นกแก้วแอฟริกันเกรย์", emoji: "🦜", lifespan: 40, range: "30–50 ปี", group: "bird" },
  ferret: { label: "เฟอเร็ต", emoji: "🦦", lifespan: 6.5, range: "5–8 ปี", group: "exotic" },
  hedgehog: { label: "เม่นแคระ", emoji: "🦔", lifespan: 5, range: "4–6 ปี", group: "exotic" },
  sugarGlider: { label: "ชูการ์ไกลเดอร์", emoji: "🐿️", lifespan: 11, range: "10–12 ปี", group: "exotic" },
  beardedDragon: { label: "กิ้งก่าเครา", emoji: "🦎", lifespan: 7.5, range: "5–10 ปี", group: "exotic" },
  leopardGecko: { label: "ตุ๊กแกเสือดาว", emoji: "🦎", lifespan: 20, range: "20 ปีขึ้นไป", group: "exotic" },
  ballPython: { label: "บอลไพธอน", emoji: "🐍", lifespan: 17.5, range: "15–20 ปี", group: "exotic" }
};

export function yearsBetween(birthDate, now = new Date()) {
  const birth = birthDate instanceof Date ? birthDate : new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(birth.getTime()) || birth > now) return null;
  return (now.getTime() - birth.getTime()) / 31_556_952_000;
}

export function catToHuman(years) {
  if (years <= 0) return 0;
  if (years >= 2) return 24 + 4 * (years - 2);
  for (let index = 1; index < CAT_ANCHORS.length; index += 1) {
    const [x1, y1] = CAT_ANCHORS[index];
    const [x0, y0] = CAT_ANCHORS[index - 1];
    if (years <= x1) return y0 + ((years - x0) / (x1 - x0)) * (y1 - y0);
  }
  return 24;
}

export function dogToHuman(years, size = "medium") {
  if (years <= 0) return 0;
  if (years <= 1) return 15 * years;
  if (years <= 2) return 15 + 9 * (years - 1);
  return 24 + DOG_RATES[size] * (years - 2);
}

export function humanEquivalent(species, years, dogSize) {
  if (species === "cat") return catToHuman(years);
  if (species === "dog") return dogToHuman(years, dogSize);
  return lifespanIndexToHuman(years, PET_PROFILES[dogSize]?.lifespan ?? 10);
}

export function lifespanIndexToHuman(years, lifespan) {
  if (years <= 0) return 0;
  const progress = years / lifespan;
  if (progress <= 0.1) return (progress / 0.1) * 18;
  return 18 + ((progress - 0.1) / 0.9) * 62;
}

export function humanLifeProgress(humanYears) {
  if (!Number.isFinite(humanYears) || humanYears <= 0) return 0;
  return Math.min(100, (humanYears / 80) * 100);
}

export function calendarAge(birthDate, now = new Date()) {
  const birth = birthDate instanceof Date ? birthDate : new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(birth.getTime()) || birth > now) return null;
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();
  if (days < 0) {
    months -= 1;
    days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months, days };
}

export function lifeStage(species, years, size = "medium") {
  if (years < 1) return { key: "baby", label: "วัยเด็ก", index: 0 };
  if (species === "cat") {
    if (years < 3) return { key: "young", label: "วัยหนุ่มสาว", index: 1 };
    if (years < 11) return { key: "adult", label: "วัยผู้ใหญ่", index: 2 };
    return { key: "senior", label: "วัยสูงอายุ", index: 3 };
  }
  if (species !== "dog") {
    const lifespan = PET_PROFILES[size]?.lifespan ?? 10;
    const progress = years / lifespan;
    if (progress < 0.1) return { key: "baby", label: "วัยเด็ก", index: 0 };
    if (progress < 0.25) return { key: "young", label: "วัยหนุ่มสาว", index: 1 };
    if (progress < 0.7) return { key: "adult", label: "วัยผู้ใหญ่", index: 2 };
    return { key: "senior", label: "วัยสูงอายุ", index: 3 };
  }
  const seniorAge = { small: 8, medium: 7, large: 6, giant: 5 }[size];
  if (years < 3) return { key: "young", label: "วัยหนุ่มสาว", index: 1 };
  if (years < seniorAge) return { key: "adult", label: "วัยผู้ใหญ่", index: 2 };
  return { key: "senior", label: "วัยสูงอายุ", index: 3 };
}
