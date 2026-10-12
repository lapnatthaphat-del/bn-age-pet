import { yearsBetween, humanEquivalent, humanLifeProgress, calendarAge, lifeStage, PET_PROFILES } from "./calculator.mjs?v=2";

export const PETS_STORAGE_KEY = "petAgePetsV1";
export const PROFILE_GROUPS = ["small", "bird", "exotic"];

export function loadPets() {
  try {
    const saved = JSON.parse(localStorage.getItem(PETS_STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

export function savePets(pets) {
  localStorage.setItem(PETS_STORAGE_KEY, JSON.stringify(pets));
}

export function petMetrics(pet) {
  const years = yearsBetween(pet.birthDate);
  const calculationKey = PROFILE_GROUPS.includes(pet.species) ? pet.petProfile : pet.dogSize;
  const equivalentYears = humanEquivalent(pet.species, years, calculationKey);
  return {
    humanYears: Math.round(equivalentYears),
    lifeProgress: humanLifeProgress(equivalentYears),
    stage: lifeStage(pet.species, years, calculationKey),
    actualAge: calendarAge(pet.birthDate),
    isLifespanIndex: PROFILE_GROUPS.includes(pet.species)
  };
}

export function petType(pet) {
  if (pet.species === "dog") return { label: "สุนัข", emoji: "🐶" };
  if (pet.species === "cat") return { label: "แมว", emoji: "🐱" };
  return PET_PROFILES[pet.petProfile] || { label: "สัตว์เลี้ยง", emoji: "🐾" };
}

export function isStoredPhoto(value) {
  return typeof value === "string" && /^data:image\/(?:jpeg|png|webp);base64,/.test(value);
}

export function escapeHTML(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

export function formatAge(age) {
  if (!age || (age.years === 0 && age.months === 0 && age.days === 0)) return "น้อยกว่า 1 วัน";
  return [[age.years, "ปี"], [age.months, "เดือน"], [age.days, "วัน"]]
    .filter(([value]) => value > 0)
    .map(([value, unit]) => `${value.toLocaleString("th-TH")} ${unit}`)
    .join(" ");
}
