import path from "path";
import { promises as fs } from "fs";

export type FinancialTransaction = {
  id: string;
  createdAt: string;
  gross: number;
  basePrice: number;
  driveFee: number;
  urgencyFee: number;
  discountAmount: number;
  customerEmail?: string | null;
  address?: string | null;
};

export type FinancialState = {
  ytdGross: number;
  updatedAt: string;
  processedEventIds: string[];
  transactions: FinancialTransaction[];
};

const defaultState: FinancialState = {
  ytdGross: 0,
  updatedAt: new Date(0).toISOString(),
  processedEventIds: [],
  transactions: [],
};

export const getFinancialLogPath = () =>
  path.join(process.cwd(), "log", "financial.json");

const readJson = async (filePath: string): Promise<FinancialState> => {
  try {
    const data = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(data) as FinancialState;
    return {
      ...defaultState,
      ...parsed,
      processedEventIds: parsed.processedEventIds ?? [],
      transactions: parsed.transactions ?? [],
    };
  } catch {
    return { ...defaultState };
  }
};

const writeJson = async (filePath: string, state: FinancialState) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(state, null, 2), "utf8");
};

export const loadFinancialState = async () => {
  const filePath = getFinancialLogPath();
  return readJson(filePath);
};

export const persistFinancialState = async (state: FinancialState) => {
  const filePath = getFinancialLogPath();
  await writeJson(filePath, state);
};
