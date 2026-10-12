import { loadPets, savePets, petMetrics, petType, isStoredPhoto, escapeHTML, formatAge } from "./pet-data.mjs?v=2";

const petCardGrid = document.querySelector("#pet-card-grid");
const emptyPets = document.querySelector("#empty-pets");
const petCount = document.querySelector("#pet-count");
let pets = loadPets();

const LIFE_STAGE_INFO = [
  { key: "baby", label: "วัยเด็ก", note: "กำลังเติบโต ควรใส่ใจอาหารที่เหมาะกับชนิดและการตรวจสุขภาพช่วงเริ่มต้น" },
  { key: "young", label: "วัยหนุ่มสาว", note: "พลังงานสูง เหมาะกับการฝึกและกิจกรรมที่ช่วยกระตุ้นทั้งร่างกายและจิตใจ" },
  { key: "adult", label: "วัยผู้ใหญ่", note: "ดูแลน้ำหนัก สุขภาพช่องปาก และตรวจสุขภาพอย่างสม่ำเสมอ" },
  { key: "senior", label: "วัยสูงอายุ", note: "ติดตามการกินและการเคลื่อนไหว พร้อมปรึกษาสัตวแพทย์เมื่อมีความเปลี่ยนแปลง" }
];

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
  const { humanYears, lifeProgress, stage, actualAge, isLifespanIndex } = petMetrics(pet);
  const type = petType(pet);
  const currentStage = LIFE_STAGE_INFO.find((item) => item.key === stage.key) || LIFE_STAGE_INFO[0];
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
    <div class="saved-pet-stage-info">
      <div class="life-progress" role="progressbar" aria-label="ความคืบหน้าของช่วงชีวิต ตอนนี้อยู่ใน${stage.label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(lifeProgress)}" style="--life-progress: ${lifeProgress.toFixed(2)}%">
        <span class="life-progress-fill"></span>
      </div>
      <div class="stage-labels" aria-hidden="true">${LIFE_STAGE_INFO.map((item) => `<span class="${item.key === stage.key ? "is-current" : ""}">${item.label}</span>`).join("")}</div>
      <p><strong>${currentStage.label}</strong>${currentStage.note}</p>
      <details>
        <summary>ข้อมูลช่วงวัยทั้งหมด</summary>
        <ul>${LIFE_STAGE_INFO.map((item) => `<li><strong>${item.label}</strong> — ${item.note}</li>`).join("")}</ul>
      </details>
    </div>
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
