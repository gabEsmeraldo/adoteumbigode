import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

// Without a Firebase config, reports live in this browser's localStorage so the
// pages can be built and tested before the project exists.
const LOCAL_KEY = "adoteumbigode:reports";

function readLocal(): Record<string, MonthReport> {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function writeLocal(reports: Record<string, MonthReport>) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(reports));
}

export type Expense = {
  id: string;
  date: string;
  product: string;
  supplier: string;
  payment: string;
  details: string;
  value: number;
};

export type MonthReport = {
  month: string; // YYYY-MM, also the document id
  expenses: Expense[];
  published: boolean;
};

const reportsCollection = () => {
  if (!db) throw new Error("Firebase não configurado.");
  return collection(db, "reports");
};

export const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatDate(date: string) {
  if (!date) return "—";
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

export function monthLabel(month: string) {
  const label = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${month}-02T12:00:00`));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export const totalSpent = (expenses: Expense[]) =>
  expenses.reduce((total, expense) => total + expense.value, 0);

const byNewest = (a: MonthReport, b: MonthReport) =>
  b.month.localeCompare(a.month);

export async function fetchPublishedReports(): Promise<MonthReport[]> {
  if (!db) {
    return Object.values(readLocal())
      .filter((report) => report.published)
      .sort(byNewest);
  }

  const snapshot = await getDocs(
    query(reportsCollection(), where("published", "==", true)),
  );
  return snapshot.docs
    .map((item) => item.data() as MonthReport)
    .sort(byNewest);
}

export async function fetchReport(month: string): Promise<MonthReport | null> {
  if (!db) return readLocal()[month] ?? null;
  const snapshot = await getDoc(doc(reportsCollection(), month));
  return snapshot.exists() ? (snapshot.data() as MonthReport) : null;
}

export async function saveReport(report: MonthReport) {
  const sorted = {
    ...report,
    expenses: [...report.expenses].sort((a, b) => a.date.localeCompare(b.date)),
  };

  if (!db) {
    writeLocal({ ...readLocal(), [report.month]: sorted });
    return;
  }

  await setDoc(doc(reportsCollection(), report.month), {
    ...sorted,
    updatedAt: serverTimestamp(),
  });
}
