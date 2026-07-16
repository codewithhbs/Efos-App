// src/utils/formOptions.js

export const INDIA_STATES = [
  { id: 1, name: "Andhra Pradesh" },
  { id: 2, name: "Arunachal Pradesh" },
  { id: 3, name: "Assam" },
  { id: 4, name: "Bihar" },
  { id: 5, name: "Chhattisgarh" },
  { id: 6, name: "Goa" },
  { id: 7, name: "Gujarat" },
  { id: 8, name: "Haryana" },
  { id: 9, name: "Himachal Pradesh" },
  { id: 10, name: "Jharkhand" },
  { id: 11, name: "Karnataka" },
  { id: 12, name: "Kerala" },
  { id: 13, name: "Madhya Pradesh" },
  { id: 14, name: "Maharashtra" },
  { id: 15, name: "Manipur" },
  { id: 16, name: "Meghalaya" },
  { id: 17, name: "Mizoram" },
  { id: 18, name: "Nagaland" },
  { id: 19, name: "Odisha" },
  { id: 20, name: "Punjab" },
  { id: 21, name: "Rajasthan" },
  { id: 22, name: "Sikkim" },
  { id: 23, name: "Tamil Nadu" },
  { id: 24, name: "Telangana" },
  { id: 25, name: "Tripura" },
  { id: 26, name: "Uttar Pradesh" },
  { id: 27, name: "Uttarakhand" },
  { id: 28, name: "West Bengal" },
  { id: 29, name: "Andaman and Nicobar Islands" },
  { id: 30, name: "Chandigarh" },
  { id: 31, name: "Dadra and Nagar Haveli and Daman and Diu" },
  { id: 32, name: "Delhi" },
  { id: 33, name: "Jammu and Kashmir" },
  { id: 34, name: "Ladakh" },
  { id: 35, name: "Lakshadweep" },
  { id: 36, name: "Puducherry" },
  { id: 37, name: "Pan India" },
  { id: 38, name: "Others" },
];

export const INDIA_DISTRICTS = {
  1: ["Anantapur", "Chittoor", "East Godavari", "Guntur", "Kadapa", "Krishna", "Kurnool", "Nellore", "Prakasam", "Srikakulam", "Visakhapatnam", "Vizianagaram", "West Godavari"],
  2: ["Itanagar", "Tawang", "Ziro", "Pasighat", "Bomdila"],
  3: ["Guwahati", "Dibrugarh", "Jorhat", "Silchar", "Tezpur", "Nagaon"],
  4: ["Patna", "Gaya", "Muzaffarpur", "Darbhanga", "Bhagalpur", "Purnia", "Ara", "Begusarai"],
  5: ["Raipur", "Bilaspur", "Durg", "Bhilai", "Korba", "Jagdalpur"],
  6: ["North Goa", "South Goa"],
  7: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Junagadh", "Jamnagar"],
  8: ["Gurugram", "Faridabad", "Panipat", "Sonipat", "Rohtak", "Hisar", "Karnal"],
  9: ["Shimla", "Kangra", "Mandi", "Solan", "Una", "Hamirpur"],
  10: ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Hazaribagh"],
  11: ["Bengaluru", "Mysuru", "Mangaluru", "Hubli", "Belagavi", "Ballari", "Tumakuru"],
  12: ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kannur", "Alappuzha"],
  13: ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain", "Sagar"],
  14: ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Solapur", "Kolhapur"],
  15: ["Imphal East", "Imphal West", "Churachandpur"],
  16: ["Shillong", "Tura", "Jowai"],
  17: ["Aizawl", "Lunglei", "Champhai"],
  18: ["Kohima", "Dimapur", "Mokokchung"],
  19: ["Bhubaneswar", "Cuttack", "Rourkela", "Sambalpur", "Balasore"],
  20: ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda"],
  21: ["Jaipur", "Jodhpur", "Udaipur", "Ajmer", "Bikaner", "Kota"],
  22: ["Gangtok", "Namchi", "Gyalshing"],
  23: ["Chennai", "Coimbatore", "Madurai", "Salem", "Trichy", "Tirunelveli"],
  24: ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam"],
  25: ["Agartala", "Udaipur", "Dharmanagar"],
  26: ["Lucknow", "Noida", "Ghaziabad", "Kanpur", "Varanasi", "Prayagraj", "Agra", "Meerut"],
  27: ["Dehradun", "Haridwar", "Roorkee", "Haldwani", "Nainital"],
  28: ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri"],
  29: ["Port Blair"],
  30: ["Chandigarh"],
  31: ["Daman", "Diu", "Silvassa"],
  32: ["New Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi"],
  33: ["Srinagar", "Jammu", "Anantnag", "Baramulla"],
  34: ["Leh", "Kargil"],
  35: ["Kavaratti"],
  36: ["Puducherry", "Karaikal", "Mahe", "Yanam"],
  37: ["Pan India"],
  38: ["Others"],
};

const opt = (arr) => arr.map((v) => ({ label: v, value: v }));

export const STATE_OPTIONS = INDIA_STATES.map((s) => ({
  label: s.name,
  value: s.name,
  id: s.id,
}));

export const getDistrictOptions = (stateName) => {
  const state = INDIA_STATES.find((s) => s.name === stateName);
  if (!state) return [];
  return opt(INDIA_DISTRICTS[state.id] || []);
};

// ─── Signup / Basic ───────────────────────────────────────────
export const AGE_GROUP_OPTIONS = [
  { label: "16 - 18", value: "16_18" },
  { label: "19 - 21", value: "19_21" },
  { label: "22 - 25", value: "22_25" },
  { label: "26 - 30", value: "26_30" },
  { label: "31 - 40", value: "31_40" },
  { label: "40+", value: "40_plus" },
];

export const GENDER_OPTIONS = opt(["Male", "Female", "Others"]);

export const QUALIFICATION_OPTIONS = [
  { label: "Below 10th", value: "Below 10th" },
  { label: "10th", value: "10th" },
  { label: "ITI / Diploma", value: "ITI/Diploma" },
  { label: "12th Pass", value: "12th Pass" },
  { label: "Undergraduate", value: "Undergraduate" },
  { label: "Graduate", value: "Graduate" },
  { label: "Post Graduate", value: "Post Graduate" },
  { label: "PhD", value: "PhD" },
  { label: "Others", value: "Others" },
];

export const PRESENT_STATUS_OPTIONS = opt([
  "Student",
  "Looking for Job",
  "Working",
  "Retired",
  "Ex-armyperson",
  "Woman after break",
]);

export const LOOKING_FOR_OPTIONS = [
  { label: "Education", value: "education" },
  { label: "Skill Course", value: "skill_course" },
  { label: "Opportunity", value: "Opportunity" },
  { label: "Learn & Earn Program", value: "learn_earn" },
  { label: "Career Counselling", value: "career_counselling" },
  { label: "International Options", value: "international_options" },
];

// ─── Resume: Personal ─────────────────────────────────────────
export const CATEGORY_OPTIONS = opt(["General", "OBC", "SC", "ST", "EWS", "Others"]);

export const BLOOD_GROUP_OPTIONS = opt([
  "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-",
]);

export const MARITAL_STATUS_OPTIONS = opt([
  "Single", "Married", "Divorced", "Widowed",
]);

// ─── Resume: Education ────────────────────────────────────────
export const BOARD_OPTIONS = opt([
  "CBSE",
  "ICSE / CISCE",
  "NIOS",
  "State Board",
  "IB",
  "Others",
]);

export const SCHOOL_STREAM_OPTIONS = opt([
  "Science (PCM)",
  "Science (PCB)",
  "Commerce",
  "Arts / Humanities",
  "Vocational",
  "Others",
]);

export const GRAD_STREAM_OPTIONS = opt([
  "B.Tech / B.E.",
  "B.Sc",
  "B.Com",
  "B.A",
  "BBA",
  "BCA",
  "B.Pharm",
  "LLB",
  "MBBS",
  "Diploma",
  "Others",
]);

export const PG_STREAM_OPTIONS = opt([
  "M.Tech / M.E.",
  "M.Sc",
  "M.Com",
  "M.A",
  "MBA",
  "MCA",
  "LLM",
  "MD / MS",
  "Others",
]);

// ─── Resume: Skills & Career ──────────────────────────────────
export const SKILL_TYPE_OPTIONS = opt([
  "Technical",
  "Non-Technical",
  "Vocational / Trade",
  "Creative",
  "Management",
  "Others",
]);

export const SKILL_TRADE_OPTIONS = opt([
  "Software / IT",
  "Data Analytics",
  "Digital Marketing",
  "Graphic Design",
  "Accounting / Tally",
  "Electrician",
  "Welder",
  "Fitter",
  "Plumber",
  "Driver",
  "Nursing / Healthcare",
  "Hospitality",
  "Retail / Sales",
  "Teaching",
  "Others",
]);

export const EXPERIENCE_YEAR_OPTIONS = [
  { label: "Fresher (0 yrs)", value: "0" },
  { label: "Less than 1 year", value: "0.5" },
  { label: "1 year", value: "1" },
  { label: "2 years", value: "2" },
  { label: "3 years", value: "3" },
  { label: "4 years", value: "4" },
  { label: "5 years", value: "5" },
  { label: "6 - 10 years", value: "6-10" },
  { label: "10+ years", value: "10+" },
];

export const EXPERIENCE_TYPE_OPTIONS = opt([
  "Fresher",
  "Experienced"
]);

export const YES_NO_OPTIONS = [
  { label: "Yes", value: "Yes" },
  { label: "No", value: "No" },
];

export const PASSPORT_OPTIONS = [
  { label: "Yes — Valid", value: "Yes" },
  { label: "Applied / In Process", value: "In Process" },
  { label: "No", value: "No" },
];

export const RELOCATION_OPTIONS = [
  { label: "Yes — Anywhere in India", value: "Yes" },
  { label: "Yes — Only Nearby", value: "Nearby Only" },
  { label: "Yes — Including Abroad", value: "Abroad" },
  { label: "No", value: "No" },
];

export const YEAR_OPTIONS = (() => {
  const now = new Date().getFullYear();
  const arr = [];
  for (let y = now + 2; y >= now - 40; y--) {
    arr.push({ label: String(y), value: String(y) });
  }
  return arr;
})();