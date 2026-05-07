// --- TypeScript Type Definition ---
export type DataRecord = {
  id: number;
  uuid: string;
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  salary: number;
  department: string;
  position: string;
  hireDate: string;
  isActive: boolean;
  phone: string;
  city: string;
  state: string;
  rating: number;
  tags: string[];
};

// --- Stress Test Configuration & Constants ---
export const CONFIG = {
  CREATE_COUNT: 100,
  ACTION_TEXTS: {
    CREATE: `Create 50,000 Rows`,
    UPDATE: `Update Every 10th Row (Salary +50)`,
    SWAP: `Swap 2nd and 9th-to-last Rows`,
    CLEAR: `Clear All Rows`,
  },
  BUTTON_LABELS: {
    CREATE: `Create 50,000 Rows`,
    UPDATE: `Update Every 10th Row`,
    SWAP: `Swap Rows`,
    CLEAR: `Clear`,
  },
  // Default headers to display in the table for consistency across frameworks
  TABLE_HEADERS: [
    "id",
    "firstName",
    "lastName",
    "position",
    "salary",
    "isActive",
    "tags",
    "rating",
  ] as const, // `as const` provides better type safety
};

// --- Performance Measurement Class ---
class PerformanceMonitor {
  private startTime = 0;
  private actionName = "";

  start(name: string) {
    this.actionName = name;
    this.startTime = performance.now();
  }

  stop(): { name: string; duration: number } | null {
    if (!this.startTime) return null;
    const duration = performance.now() - this.startTime;
    const result = { name: this.actionName, duration };
    this.startTime = 0;
    this.actionName = "";
    return result;
  }
}
// Export a single instance for the app to use
export const monitor = new PerformanceMonitor();

// --- Data Generation (Your provided logic) ---
// Note: I've removed the console.log from here, as side-effects are best left to the consumer.
const FIRST_NAMES = [
  "James",
  "Emma",
  "Liam",
  "Olivia",
  "Noah",
  "Ava",
  "William",
  "Sophia",
  "Lucas",
  "Isabella",
  "Mateo",
  "Mia",
  "Ethan",
  "Charlotte",
  "Aiden",
  "Amelia",
  "Elias",
  "Harper",
  "Omar",
  "Aria",
];
const LAST_NAMES = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Chen",
  "Kim",
  "Ali",
  "Patel",
  "Nguyen",
  "Lee",
  "Gomez",
  "Wright",
  "Lopez",
  "Hill",
];
const DEPARTMENTS = [
  "Engineering",
  "Sales",
  "Marketing",
  "HR",
  "Finance",
  "Product",
  "Customer Support",
  "Legal",
  "Operations",
  "R&D",
];
const POSITIONS = [
  "Intern",
  "Junior",
  "Mid-Level",
  "Senior",
  "Lead",
  "Principal",
  "Manager",
  "Director",
  "VP",
  "C-Level",
];
const CITIES = [
  "New York",
  "Los Angeles",
  "Chicago",
  "Houston",
  "Phoenix",
  "Philadelphia",
  "San Antonio",
  "San Diego",
  "Dallas",
  "Austin",
  "Seattle",
  "Denver",
];
const STATES = [
  "NY",
  "CA",
  "IL",
  "TX",
  "AZ",
  "PA",
  "WA",
  "CO",
  "FL",
  "GA",
  "OH",
  "NC",
];
const TAGS = [
  "remote",
  "onsite",
  "hybrid",
  "contractor",
  "full-time",
  "part-time",
  "award-winner",
  "needs-training",
  "top-performer",
  "veteran",
];

const getRandomItem = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

export function buildData(rowCount: number): DataRecord[] {
  const data: DataRecord[] = [];
  for (let i = 0; i < rowCount; i++) {
    const firstName = getRandomItem(FIRST_NAMES);
    const lastName = getRandomItem(LAST_NAMES);
    const numTags = Math.floor(Math.random() * 4) + 1;
    const userTags = [...TAGS]
      .sort(() => 0.5 - Math.random())
      .slice(0, numTags);
    data.push({
      id: i + 1,
      uuid: crypto.randomUUID(),
      firstName: firstName,
      lastName: lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
      age: Math.floor(Math.random() * 48) + 18,
      salary: Math.floor(Math.random() * 170000) + 30000,
      department: getRandomItem(DEPARTMENTS),
      position: getRandomItem(POSITIONS),
      hireDate: new Date(
        2010 + Math.floor(Math.random() * 14),
        Math.floor(Math.random() * 12),
        Math.floor(Math.random() * 28) + 1
      )
        .toISOString()
        .split("T")[0],
      isActive: Math.random() > 0.15,
      phone: `+1-${Math.floor(Math.random() * 800) + 200}-${
        Math.floor(Math.random() * 800) + 200
      }-${Math.floor(Math.random() * 9000) + 1000}`,
      city: getRandomItem(CITIES),
      state: getRandomItem(STATES),
      rating: +(Math.random() * 5).toFixed(2),
      tags: userTags,
    });
  }
  return data;
}

// --- PURE Data Manipulation Functions ---

export const createData = (): DataRecord[] => {
  return buildData(CONFIG.CREATE_COUNT);
};

export const updateData = (data: DataRecord[]): DataRecord[] => {
  return data.map((row, i) =>
    i % 10 === 0 ? { ...row, salary: row.salary + 50 } : row
  );
};

export const swapData = (data: DataRecord[]): DataRecord[] => {
  if (data.length < 10) return data;
  const swappedData = [...data];
  const item2 = swappedData[1];
  swappedData[1] = swappedData[swappedData.length - 9];
  swappedData[swappedData.length - 9] = item2;
  return swappedData;
};

export const clearData = (): DataRecord[] => {
  return [];
};
