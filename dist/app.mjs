import { yearsBetween, humanEquivalent, calendarAge, lifeStage, PET_PROFILES } from "./calculator.mjs";

const form = document.querySelector("#pet-form");
const birthInput = document.querySelector("#birth-date");
const nameInput = document.querySelector("#pet-name");
const sizeField = document.querySelector("#dog-size-field");
const sizeSelect = document.querySelector("#dog-size");
const profileField = document.querySelector("#profile-field");
const profileSelect = document.querySelector("#pet-profile");
const lifespanHint = document.querySelector("#lifespan-hint");
const error = document.querySelector("#birth-error");
const emptyResult = document.querySelector("#empty-result");
const resultContent = document.querySelector("#result-content");
const resultCard = document.querySelector("#result-card");
const storageKey = "petAgeProfileV2";
const profileGroups = ["small", "bird", "exotic"];

birthInput.max = localISODate(new Date());
restore();
syncConditionalFields();
update();

form.addEventListener("input", update);
form.addEventListener("change", update);
document.querySelector("#reset-button").addEventListener("click", () => {
  form.reset();
  localStorage.removeItem(storageKey);
  error.textContent = "";
  birthInput.classList.remove("invalid");
  syncConditionalFields();
  update();
  form.querySelector('input[name="species"]').focus();
});
document.addEventListener("visibilitychange", () => { if (!document.hidden) update(); });
setInterval(update, 60_000);

function update() {
  syncConditionalFields();
  const data = new FormData(form);
  const species = data.get("species");
  const birthDate = data.get("birthDate");
  const dogSize = data.get("dogSize") || "medium";
  const petProfile = data.get("petProfile") || "rabbit";
  const petName = String(data.get("petName") || "").trim();
  const calculationKey = profileGroups.includes(species) ? petProfile : dogSize;

  if (birthDate && yearsBetween(birthDate) === null) {
    error.textContent = "วันเกิดต้องไม่เกินวันนี้ กรุณาตรวจสอบวันที่อีกครั้ง";
    birthInput.classList.add("invalid");
    showEmpty();
    return;
  }
  error.textContent = "";
  birthInput.classList.remove("invalid");

  if (!species || !birthDate || (profileGroups.includes(species) && !PET_PROFILES[petProfile])) {
    showEmpty();
    persist({ species, birthDate, dogSize, petProfile, petName });
    return;
  }

  const years = yearsBetween(birthDate);
  const humanYears = Math.round(humanEquivalent(species, years, calculationKey));
  const actual = calendarAge(birthDate);
  const stage = lifeStage(species, years, calculationKey);
  const ageText = formatAge(actual);
  const isLifespanIndex = profileGroups.includes(species);

  emptyResult.hidden = true;
  resultContent.hidden = false;
  resultCard.classList.remove("is-empty");
  document.querySelector("#result-kicker").textContent = petName
    ? `วันนี้${petName}${isLifespanIndex ? "อยู่ในช่วงชีวิตเทียบคนประมาณ" : "อายุเทียบเท่าคนประมาณ"}`
    : `วันนี้น้อง${isLifespanIndex ? "อยู่ในช่วงชีวิตเทียบคนประมาณ" : "อายุเทียบเท่าคนประมาณ"}`;
  document.querySelector("#human-years").textContent = humanYears.toLocaleString("th-TH");
  document.querySelector("#actual-age").textContent = ageText;
  document.querySelector("#stage-badge").textContent = stage.label;
  document.querySelector("#timeline-progress").style.width = `${[12, 38, 67, 100][stage.index]}%`;
  document.querySelector("#result-note").textContent = isLifespanIndex
    ? `เป็นดัชนีจากสัดส่วนอายุขัยทั่วไปของ${PET_PROFILES[petProfile].label} ไม่ใช่สูตรอายุชีวภาพหรือการทำนายอายุขัยเฉพาะตัว`
    : "ค่าที่แสดงเป็นการเทียบโดยประมาณ ไม่ใช่การประเมินสุขภาพหรืออายุขัยเฉพาะตัว";
  const now = new Date();
  const time = document.querySelector("#updated-at");
  time.dateTime = now.toISOString();
  time.textContent = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(now);
  resultCard.setAttribute("aria-label", `ผลการคำนวณ: ${petName || "สัตว์เลี้ยง"}อายุจริง ${ageText} เทียบช่วงชีวิตคนประมาณ ${humanYears} ปี อยู่ในช่วง${stage.label}`);
  resultCard.classList.remove("is-updating");
  requestAnimationFrame(() => resultCard.classList.add("is-updating"));
  persist({ species, birthDate, dogSize, petProfile, petName });
}

function syncConditionalFields() {
  const species = new FormData(form).get("species");
  sizeField.hidden = species !== "dog";
  profileField.hidden = !profileGroups.includes(species);
  if (!profileGroups.includes(species)) return;

  const previous = profileSelect.value;
  const choices = Object.entries(PET_PROFILES).filter(([, profile]) => profile.group === species);
  profileSelect.replaceChildren(...choices.map(([value, profile]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = `${profile.emoji} ${profile.label}`;
    return option;
  }));
  if (choices.some(([value]) => value === previous)) profileSelect.value = previous;
  const profile = PET_PROFILES[profileSelect.value];
  lifespanHint.textContent = profile ? `อายุขัยทั่วไปประมาณ ${profile.range} ใช้เป็นฐานของดัชนีช่วงชีวิต` : "";
}

function showEmpty() {
  emptyResult.hidden = false;
  resultContent.hidden = true;
  resultCard.classList.add("is-empty");
  resultCard.removeAttribute("aria-label");
}

function formatAge(age) {
  if (!age || (age.years === 0 && age.months === 0 && age.days === 0)) return "น้อยกว่า 1 วัน";
  return [[age.years, "ปี"], [age.months, "เดือน"], [age.days, "วัน"]]
    .filter(([value]) => value > 0)
    .map(([value, unit]) => `${value.toLocaleString("th-TH")} ${unit}`)
    .join(" ");
}

function persist(profile) { localStorage.setItem(storageKey, JSON.stringify(profile)); }

function restore() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (!saved) return;
    if (saved.species) form.elements.species.value = saved.species;
    nameInput.value = saved.petName || "";
    birthInput.value = saved.birthDate || "";
    sizeSelect.value = saved.dogSize || "medium";
    profileSelect.dataset.savedValue = saved.petProfile || "";
    if (profileGroups.includes(saved.species)) {
      const choices = Object.entries(PET_PROFILES).filter(([, profile]) => profile.group === saved.species);
      profileSelect.replaceChildren(...choices.map(([value, profile]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = `${profile.emoji} ${profile.label}`;
        return option;
      }));
      if (saved.petProfile) profileSelect.value = saved.petProfile;
    }
  } catch { localStorage.removeItem(storageKey); }
}

function localISODate(date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}
