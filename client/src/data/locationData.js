// client/src/data/locationData.js
// Lightweight location reference data for onboarding & profile editing.
// Karnataka is surfaced first and in most detail, since it's the platform's
// current focus — but every Indian state/UT is selectable, because Anvesha
// is for anyone in India, not just one region.

// Major Karnataka districts/cities, shown first in the city picker whenever
// the user selects Karnataka as their state.
export const KARNATAKA_CITIES = [
  'Bengaluru', 'Mysuru', 'Mangaluru', 'Udupi', 'Hubballi', 'Dharwad',
  'Belagavi', 'Kalaburagi', 'Ballari', 'Davanagere', 'Shivamogga',
  'Tumakuru', 'Madikeri (Kodagu)', 'Hassan', 'Chikkamagaluru', 'Bidar',
  'Gokarna', 'Hampi (Vijayanagara)', 'Chitradurga', 'Mandya',
];

// All Indian states and union territories, derived from the illustrated
// atlas dataset (client/src/data/indiaStatesData.json). Karnataka is pinned
// to the top; the rest follow alphabetically.
export const INDIAN_STATES = [
  'Karnataka',
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

/** Returns the featured city list for a given state, or an empty array if none are curated. */
export function citiesForState(state) {
  if (state === 'Karnataka') return KARNATAKA_CITIES;
  return [];
}
