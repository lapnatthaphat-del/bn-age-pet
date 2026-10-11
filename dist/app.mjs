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
const saveButton = document.querySelector("#save-pet-button");
const saveStatus = document.querySelector("#save-status");
const myPetsSection = document.querySelector("#my-pets");
const petCardGrid = document.querySelector("#pet-card-grid");
const storageKey = "petAgeProfileV2";
const petsStorageKey = "petAgePetsV1";
const profileGroups = ["small", "bird", "exotic"];
let pets = loadPets();
let editingId = null;

birthInput.max = localISODate(new Date());
restore();
syncConditionalFields();
update();
renderPets();

form.addEventListener("input", update);
form.addEventListener("change", update);
saveButton.addEventListener("click", saveCurrentPet);
petCardGrid.addEventListener("click", handlePetCardAction);
document.querySelector("#reset-button").addEventListener("click", () => {
  form.reset();
  localStorage.removeItem(storageKey);
  error.textContent = "";
  birthInput.classList.remove("invalid");
  editingId = null;
  saveButton.textContent = "+ เพิ่มน้องเป็นการ์ด";
  saveStatus.textContent = "";
  syncConditionalFields();
  update();
  form.querySelector('input[name="species"]').focus();
});
document.addEventListener("visibilitychange", () => { if (!document.hidden) { update(); renderPets(); } });
setInterval(() => { update(); renderPets(); }, 60_000);

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
    saveButton.disabled = true;
    return;
  }
  error.textContent = "";
  birthInput.classList.remove("invalid");

  if (!species || !birthDate || (profileGroups.includes(species) && !PET_PROFILES[petProfile])) {
    showEmpty();
    saveButton.disabled = true;
    persist({ species, birthDate, dogSize, petProfile, petName });
    return;
  }

  const years = yearsBetween(birthDate);
  const humanYears = Math.round(humanEquivalent(species, years, calculationKey));
  const actual = calendarAge(birthDate);
  const stage = lifeStage(species, years, calculationKey);
  const ageText = formatAge(actual);
  const isLifespanIndex = profileGroups.includes(species);
  saveButton.disabled = !petName;
  saveButton.title = petName ? "" : "ใส่ชื่อน้องก่อนบันทึกเป็นการ์ด";

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

function saveCurrentPet() {
  const data = new FormData(form);
  const species = data.get("species");
  const petName = String(data.get("petName") || "").trim();
  const birthDate = data.get("birthDate");
  if (!species || !petName || !birthDate || yearsBetween(birthDate) === null) return;
  const entry = {
    id: editingId || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    species,
    petName,
    birthDate,
    dogSize: data.get("dogSize") || "medium",
    petProfile: data.get("petProfile") || "rabbit"
  };
  const index = pets.findIndex((pet) => pet.id === entry.id);
  if (index >= 0) pets[index] = entry;
  else pets.unshift(entry);
  localStorage.setItem(petsStorageKey, JSON.stringify(pets));
  saveStatus.textContent = index >= 0 ? `อัปเดตการ์ดของ${petName}แล้ว` : `เพิ่ม${petName}เป็นการ์ดแล้ว`;
  editingId = null;
  saveButton.textContent = "+ เพิ่มน้องเป็นการ์ด";
  renderPets();
  myPetsSection.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
}

function renderPets() {
  myPetsSection.hidden = pets.length === 0;
  document.querySelector("#pet-count").textContent = pets.length.toLocaleString("th-TH");
  petCardGrid.replaceChildren(...pets.map(createPetCard));
}

function createPetCard(pet) {
  const years = yearsBetween(pet.birthDate);
  const calculationKey = profileGroups.includes(pet.species) ? pet.petProfile : pet.dogSize;
  const humanYears = Math.round(humanEquivalent(pet.species, years, calculationKey));
  const stage = lifeStage(pet.species, years, calculationKey);
  const type = petType(pet);
  const card = document.createElement("article");
  card.className = "saved-pet-card";
  card.dataset.petId = pet.id;
  card.innerHTML = `
    <div class="saved-pet-top">
      <span class="saved-pet-icon" aria-hidden="true">${type.emoji}</span>
      <span class="saved-pet-stage">${stage.label}</span>
    </div>
    <h3>${escapeHTML(pet.petName)}</h3>
    <p class="saved-pet-age"><span class="saved-pet-type">${type.label}</span> · อายุจริง ${formatAge(calendarAge(pet.birthDate))}</p>
    <div class="saved-pet-human"><strong>${humanYears.toLocaleString("th-TH")} ปี</strong><span>${profileGroups.includes(pet.species) ? "ช่วงชีวิตเทียบคน" : "อายุเทียบคนโดยประมาณ"}</span></div>
    <div class="saved-pet-actions"><button class="edit-pet" type="button">ดูและแก้ไข</button><button class="delete-pet" type="button" aria-label="ลบการ์ดของ${escapeHTML(pet.petName)}">ลบ</button></div>`;
  return card;
}

function handlePetCardAction(event) {
  const button = event.target.closest("button");
  const card = event.target.closest(".saved-pet-card");
  if (!button || !card) return;
  const pet = pets.find((entry) => entry.id === card.dataset.petId);
  if (!pet) return;
  if (button.classList.contains("delete-pet")) {
    pets = pets.filter((entry) => entry.id !== pet.id);
    localStorage.setItem(petsStorageKey, JSON.stringify(pets));
    renderPets();
    return;
  }
  editingId = pet.id;
  form.elements.species.value = pet.species;
  nameInput.value = pet.petName;
  birthInput.value = pet.birthDate;
  sizeSelect.value = pet.dogSize || "medium";
  syncConditionalFields();
  if (profileGroups.includes(pet.species)) profileSelect.value = pet.petProfile;
  syncConditionalFields();
  update();
  saveButton.textContent = "บันทึกการแก้ไขการ์ด";
  saveStatus.textContent = `กำลังแก้ไขการ์ดของ${pet.petName}`;
  form.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
}

function petType(pet) {
  if (pet.species === "dog") return { label: "สุนัข", emoji: "🐶" };
  if (pet.species === "cat") return { label: "แมว", emoji: "🐱" };
  return PET_PROFILES[pet.petProfile] || { label: "สัตว์เลี้ยง", emoji: "🐾" };
}

function loadPets() {
  try {
    const saved = JSON.parse(localStorage.getItem(petsStorageKey));
    return Array.isArray(saved) ? saved : [];
  } catch { return []; }
}

function escapeHTML(value) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
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
