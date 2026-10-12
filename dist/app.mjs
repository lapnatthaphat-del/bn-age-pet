import { yearsBetween, PET_PROFILES } from "./calculator.mjs";
import { PROFILE_GROUPS, loadPets, savePets, isStoredPhoto } from "./pet-data.mjs";

const form = document.querySelector("#pet-form");
const birthInput = document.querySelector("#birth-date");
const nameInput = document.querySelector("#pet-name");
const sizeField = document.querySelector("#dog-size-field");
const sizeSelect = document.querySelector("#dog-size");
const profileField = document.querySelector("#profile-field");
const profileSelect = document.querySelector("#pet-profile");
const lifespanHint = document.querySelector("#lifespan-hint");
const error = document.querySelector("#birth-error");
const saveButton = document.querySelector("#save-pet-button");
const saveStatus = document.querySelector("#save-status");
const viewPetsLink = document.querySelector("#view-pets-link");
const photoInput = document.querySelector("#pet-photo");
const photoPreviewImage = document.querySelector("#photo-preview-image");
const photoPlaceholder = document.querySelector("#photo-placeholder");
const photoError = document.querySelector("#photo-error");
const removePhotoButton = document.querySelector("#remove-photo-button");
const storageKey = "petAgeProfileV2";
let pets = loadPets();
let editingId = null;
let currentPhoto = "";

birthInput.max = localISODate(new Date());
if (!restoreEditingPet()) restoreDraft();
syncConditionalFields();
updatePhotoPreview();
update();

form.addEventListener("input", update);
form.addEventListener("change", update);
saveButton.addEventListener("click", saveCurrentPet);
photoInput.addEventListener("change", handlePhotoSelection);
removePhotoButton.addEventListener("click", clearPhoto);
document.querySelector("#reset-button").addEventListener("click", resetForm);
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

  if (birthDate && yearsBetween(birthDate) === null) {
    error.textContent = "วันเกิดต้องไม่เกินวันนี้ กรุณาตรวจสอบวันที่อีกครั้ง";
    birthInput.classList.add("invalid");
    saveButton.disabled = true;
    return;
  }
  error.textContent = "";
  birthInput.classList.remove("invalid");

  if (!species || !birthDate || (PROFILE_GROUPS.includes(species) && !PET_PROFILES[petProfile])) {
    saveButton.disabled = true;
    persistDraft({ species, birthDate, dogSize, petProfile, petName });
    return;
  }

  saveButton.disabled = !petName;
  saveButton.title = petName ? "" : "ใส่ชื่อน้องก่อนบันทึกเป็นการ์ด";
  persistDraft({ species, birthDate, dogSize, petProfile, petName });
}

function syncConditionalFields() {
  const species = new FormData(form).get("species");
  sizeField.hidden = species !== "dog";
  profileField.hidden = !PROFILE_GROUPS.includes(species);
  if (!PROFILE_GROUPS.includes(species)) return;
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
    petProfile: data.get("petProfile") || "rabbit",
    photo: currentPhoto
  };
  const index = pets.findIndex((pet) => pet.id === entry.id);
  const nextPets = [...pets];
  if (index >= 0) nextPets[index] = entry;
  else nextPets.unshift(entry);
  try {
    savePets(nextPets);
    pets = nextPets;
  } catch {
    saveStatus.textContent = "พื้นที่จัดเก็บรูปในอุปกรณ์เต็ม ลองใช้รูปอื่นหรือลบการ์ดที่ไม่ใช้แล้ว";
    return;
  }
  editingId = entry.id;
  saveStatus.textContent = index >= 0 ? `อัปเดตการ์ดของ${petName}แล้ว` : `เพิ่ม${petName}เป็นการ์ดแล้ว`;
  saveButton.textContent = "บันทึกการเปลี่ยนแปลง";
  viewPetsLink.hidden = false;
}

function restoreEditingPet() {
  const requestedId = new URLSearchParams(location.search).get("edit");
  if (!requestedId) return false;
  const pet = pets.find((entry) => entry.id === requestedId);
  if (!pet) return false;
  editingId = pet.id;
  form.elements.species.value = pet.species;
  nameInput.value = pet.petName;
  birthInput.value = pet.birthDate;
  sizeSelect.value = pet.dogSize || "medium";
  currentPhoto = isStoredPhoto(pet.photo) ? pet.photo : "";
  syncConditionalFields();
  if (PROFILE_GROUPS.includes(pet.species)) profileSelect.value = pet.petProfile;
  document.querySelector("#page-title").textContent = `แก้ไขข้อมูลของ${pet.petName}`;
  document.title = `แก้ไข ${pet.petName} — PetAge`;
  saveButton.textContent = "บันทึกการเปลี่ยนแปลง";
  return true;
}

function resetForm() {
  form.reset();
  localStorage.removeItem(storageKey);
  history.replaceState({}, "", "add.html");
  error.textContent = "";
  birthInput.classList.remove("invalid");
  editingId = null;
  currentPhoto = "";
  updatePhotoPreview();
  saveButton.textContent = "+ เพิ่มน้องเป็นการ์ด";
  saveStatus.textContent = "";
  viewPetsLink.hidden = true;
  document.querySelector("#page-title").textContent = "เพิ่มสัตว์เลี้ยง";
  document.title = "เพิ่มสัตว์เลี้ยง — PetAge";
  syncConditionalFields();
  update();
  form.querySelector('input[name="species"]').focus();
}

async function handlePhotoSelection() {
  const file = photoInput.files?.[0];
  if (!file) return;
  photoError.textContent = "";
  photoInput.disabled = true;
  document.querySelector(".photo-upload-button").textContent = "กำลังเตรียมรูป…";
  try {
    currentPhoto = await compressPetPhoto(file);
    updatePhotoPreview();
  } catch (uploadError) {
    photoError.textContent = uploadError.message;
  } finally {
    photoInput.disabled = false;
    photoInput.value = "";
    document.querySelector(".photo-upload-button").textContent = currentPhoto ? "เปลี่ยนรูป" : "เลือกรูปจากเครื่อง";
  }
}

function clearPhoto() {
  currentPhoto = "";
  photoInput.value = "";
  photoError.textContent = "";
  updatePhotoPreview();
}

function updatePhotoPreview() {
  const hasPhoto = isStoredPhoto(currentPhoto);
  photoPreviewImage.hidden = !hasPhoto;
  photoPlaceholder.hidden = hasPhoto;
  removePhotoButton.hidden = !hasPhoto;
  photoPreviewImage.src = hasPhoto ? currentPhoto : "";
  document.querySelector(".photo-upload-button").textContent = hasPhoto ? "เปลี่ยนรูป" : "เลือกรูปจากเครื่อง";
}

async function compressPetPhoto(file) {
  const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
  if (!allowedTypes.has(file.type)) throw new Error("กรุณาเลือกไฟล์ JPG, PNG หรือ WebP");
  if (file.size > 10 * 1024 * 1024) throw new Error("รูปมีขนาดเกิน 10 MB กรุณาเลือกรูปที่เล็กลง");
  const objectURL = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectURL);
    const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
    const outputSize = Math.min(720, sourceSize);
    const canvas = document.createElement("canvas");
    canvas.width = outputSize;
    canvas.height = outputSize;
    const context = canvas.getContext("2d");
    context.fillStyle = "#f5f7ef";
    context.fillRect(0, 0, outputSize, outputSize);
    const sourceX = (image.naturalWidth - sourceSize) / 2;
    const sourceY = (image.naturalHeight - sourceSize) / 2;
    context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, outputSize, outputSize);
    return canvas.toDataURL("image/webp", 0.82);
  } finally {
    URL.revokeObjectURL(objectURL);
  }
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("เปิดรูปนี้ไม่ได้ กรุณาลองไฟล์อื่น"));
    image.src = source;
  });
}

function persistDraft(profile) {
  localStorage.setItem(storageKey, JSON.stringify(profile));
}

function restoreDraft() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (!saved) return;
    if (saved.species) form.elements.species.value = saved.species;
    nameInput.value = saved.petName || "";
    birthInput.value = saved.birthDate || "";
    sizeSelect.value = saved.dogSize || "medium";
    if (PROFILE_GROUPS.includes(saved.species)) {
      syncConditionalFields();
      if (saved.petProfile) profileSelect.value = saved.petProfile;
    }
  } catch {
    localStorage.removeItem(storageKey);
  }
}

function localISODate(date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}
