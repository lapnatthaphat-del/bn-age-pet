const CAT_ANCHORS = [
  [0, 0], [1 / 12, 1], [0.25, 4], [0.5, 10], [1, 15], [2, 24]
];

const DOG_RATES = { small: 4, medium: 4.6, large: 5.4, giant: 7.4 };

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
  return species === "cat" ? catToHuman(years) : dogToHuman(years, dogSize);
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
  const seniorAge = { small: 8, medium: 7, large: 6, giant: 5 }[size];
  if (years < 3) return { key: "young", label: "วัยหนุ่มสาว", index: 1 };
  if (years < seniorAge) return { key: "adult", label: "วัยผู้ใหญ่", index: 2 };
  return { key: "senior", label: "วัยสูงอายุ", index: 3 };
}
