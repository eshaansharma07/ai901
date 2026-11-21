export type Point = readonly [number, number];
const cities: Record<string, Point> = {
  bengaluru: [12.97, 77.59], bangalore: [12.97, 77.59], pune: [18.52, 73.86],
  hyderabad: [17.39, 78.49], mumbai: [19.08, 72.88], delhi: [28.61, 77.21],
  'new delhi': [28.61, 77.21], noida: [28.57, 77.32], gurugram: [28.46, 77.03],
  chennai: [13.08, 80.27], kolkata: [22.57, 88.36], jaipur: [26.91, 75.79],
  ahmedabad: [23.02, 72.57], lucknow: [26.85, 80.95], chandigarh: [30.73, 76.78],
  kochi: [9.93, 76.27], indore: [22.72, 75.86], surat: [21.17, 72.83],
  mohali: [30.70, 76.72], patiala: [30.34, 76.39], ludhiana: [30.90, 75.86],
  london: [51.51, -.13], 'new york': [40.71, -74.01], 'san francisco': [37.77, -122.42],
  sydney: [-33.87, 151.21], toronto: [43.65, -79.38], singapore: [1.35, 103.82],
};

export function approximatePoint(location: string) {
  const normalized = ' ' + eventCity(location).toLowerCase().replace(/[^a-z ]+/g, ' ').replace(/ +/g, ' ').trim() + ' ';
  const venue = ' ' + location.toLowerCase().replace(/[^a-z ]+/g, ' ').replace(/ +/g, ' ').trim() + ' ';
  return Object.entries(cities).find(([city]) => normalized === ' ' + city + ' ')?.[1]
    ?? Object.entries(cities).find(([city]) => venue.includes(' ' + city + ' '))?.[1];
}

export function kilometers(from: Point, to: Point) {
  const rad = (degrees: number) => degrees * Math.PI / 180;
  const a = Math.sin(rad(to[0] - from[0]) / 2) ** 2
    + Math.cos(rad(from[0])) * Math.cos(rad(to[0])) * Math.sin(rad(to[1] - from[1]) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(Math.min(1, a)));
}

export const discoveryCities = [
  'Agartala', 'Agra', 'Ahmedabad', 'Aizawl', 'Ajmer', 'Akola', 'Aligarh', 'Alwar',
  'Ambala', 'Amravati', 'Amritsar', 'Asansol', 'Ayodhya', 'Bareilly', 'Belagavi',
  'Bengaluru', 'Bhagalpur', 'Bhavnagar', 'Bhilai', 'Bhilwara', 'Bhopal',
  'Bhubaneswar', 'Bikaner', 'Bilaspur', 'Chandigarh', 'Chennai', 'Chhatrapati Sambhajinagar',
  'Coimbatore', 'Cuttack', 'Darbhanga', 'Dehradun', 'Delhi', 'Dhanbad', 'Dharamshala',
  'Dibrugarh', 'Dimapur', 'Durgapur', 'Erode', 'Faridabad', 'Firozabad', 'Gangtok',
  'Gaya', 'Ghaziabad', 'Gorakhpur', 'Guntur', 'Gurugram', 'Guwahati', 'Gwalior',
  'Haridwar', 'Hisar', 'Hubballi', 'Hyderabad', 'Imphal', 'Indore', 'Itanagar',
  'Jabalpur', 'Jaipur', 'Jalandhar', 'Jalgaon', 'Jammu', 'Jamnagar', 'Jamshedpur',
  'Jhansi', 'Jodhpur', 'Kakinada', 'Kanpur', 'Karnal', 'Kochi', 'Kohima', 'Kolhapur',
  'Kolkata', 'Kollam', 'Kota', 'Kozhikode', 'Kurnool', 'Lucknow', 'Ludhiana',
  'Madurai', 'Mangaluru', 'Mathura', 'Meerut', 'Mohali', 'Moradabad', 'Mumbai',
  'Muzaffarpur', 'Mysuru', 'Nagpur', 'Nashik', 'Navi Mumbai', 'Nellore', 'Noida',
  'Panaji', 'Panipat', 'Patiala', 'Patna', 'Puducherry', 'Pune', 'Raipur', 'Rajkot',
  'Ranchi', 'Rishikesh', 'Rohtak', 'Rourkela', 'Salem', 'Shillong', 'Shimla',
  'Siliguri', 'Solapur', 'Srinagar', 'Surat', 'Thane', 'Thiruvananthapuram',
  'Thrissur', 'Tiruchirappalli', 'Tirupati', 'Udaipur', 'Ujjain', 'Vadodara',
  'Varanasi', 'Vellore', 'Vijayawada', 'Visakhapatnam', 'Warangal',
].sort((a, b) => a.localeCompare(b, 'en'));

const cityAliases: Record<string, string> = {
  bangalore: 'Bengaluru',
  'new delhi': 'Delhi',
  'chandigarh university': 'Chandigarh',
  'chandugarh university': 'Chandigarh',
  gurgaon: 'Gurugram',
  mysore: 'Mysuru',
  pondicherry: 'Puducherry',
  trivandrum: 'Thiruvananthapuram',
};

const cityNames = new Map(discoveryCities.map(city => [city.toLowerCase(), city]));
function knownCity(value: string) {
  const key = value.trim().toLowerCase();
  return cityNames.get(key) ?? (Object.hasOwn(cityAliases, key) ? cityAliases[key] : undefined);
}

export function eventCity(location: string) {
  const parts = location.split('·')[0].split(',').map(part => part.trim());
  for (const part of [...parts].reverse()) {
    const city = knownCity(part);
    if (city) return city;
  }
  return parts.at(-1) ?? location;
}

export function cityOptions(locations: string[]) {
  return [...new Set([...discoveryCities, ...locations.map(eventCity)].filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'en'));
}

export function sameCity(first: string, second: string) {
  return eventCity(first).toLowerCase() === eventCity(second).toLowerCase();
}
