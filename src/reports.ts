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

export async function fetchPublishedReports(): Promise<MonthReport[]> {
  const snapshot = await getDocs(
    query(reportsCollection(), where("published", "==", true)),
  );
  return snapshot.docs
    .map((item) => item.data() as MonthReport)
    .sort((a, b) => b.month.localeCompare(a.month));
}

export async function fetchReport(month: string): Promise<MonthReport | null> {
  const snapshot = await getDoc(doc(reportsCollection(), month));
  return snapshot.exists() ? (snapshot.data() as MonthReport) : null;
}

export async function saveReport(report: MonthReport) {
  await setDoc(doc(reportsCollection(), report.month), {
    ...report,
    expenses: [...report.expenses].sort((a, b) => a.date.localeCompare(b.date)),
    updatedAt: serverTimestamp(),
  });
}
