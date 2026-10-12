import { loadPets, savePets, petMetrics, petType, isStoredPhoto, escapeHTML, formatAge } from "./pet-data.mjs";

const petCardGrid = document.querySelector("#pet-card-grid");
const emptyPets = document.querySelector("#empty-pets");
const petCount = document.querySelector("#pet-count");
let pets = loadPets();

renderPets();
petCardGrid.addEventListener("click", handlePetCardAction);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    pets = loadPets();
    renderPets();
  }
});
setInterval(renderPets, 60_000);

function renderPets() {
  petCount.textContent = pets.length.toLocaleString("th-TH");
  emptyPets.hidden = pets.length !== 0;
  petCardGrid.hidden = pets.length === 0;
  petCardGrid.replaceChildren(...pets.map(createPetCard));
}

function createPetCard(pet) {
  const { humanYears, stage, actualAge, isLifespanIndex } = petMetrics(pet);
  const type = petType(pet);
  const card = document.createElement("article");
  card.className = "saved-pet-card";
  card.dataset.petId = pet.id;
  card.innerHTML = `
    <div class="saved-pet-top">
      <span class="saved-pet-media"></span>
      <span class="saved-pet-stage">${stage.label}</span>
    </div>
    <h3>${escapeHTML(pet.petName)}</h3>
    <p class="saved-pet-age"><span class="saved-pet-type">${type.label}</span> · อายุจริง ${formatAge(actualAge)}</p>
    <div class="saved-pet-human"><strong>${humanYears.toLocaleString("th-TH")} ปี</strong><span>${isLifespanIndex ? "ช่วงชีวิตเทียบคน" : "อายุเทียบคนโดยประมาณ"}</span></div>
    <div class="saved-pet-actions"><a class="edit-pet" href="add.html?edit=${encodeURIComponent(pet.id)}">ดูและแก้ไข</a><button class="delete-pet" type="button" aria-label="ลบการ์ดของ${escapeHTML(pet.petName)}">ลบ</button></div>`;
  const media = card.querySelector(".saved-pet-media");
  if (isStoredPhoto(pet.photo)) {
    const image = new Image();
    image.src = pet.photo;
    image.alt = `รูปของ${pet.petName}`;
    media.append(image);
  } else {
    media.classList.add("is-placeholder");
    media.textContent = type.emoji;
    media.setAttribute("aria-hidden", "true");
  }
  return card;
}

function handlePetCardAction(event) {
  const button = event.target.closest(".delete-pet");
  const card = event.target.closest(".saved-pet-card");
  if (!button || !card) return;
  const pet = pets.find((entry) => entry.id === card.dataset.petId);
  if (!pet) return;
  const nextPets = pets.filter((entry) => entry.id !== pet.id);
  try {
    savePets(nextPets);
    pets = nextPets;
    renderPets();
  } catch {
    button.textContent = "ลบไม่สำเร็จ";
  }
}
