import path from "path";
import { promises as fs } from "fs";
import { kv } from "@vercel/kv";

export type FinancialTransaction = {
  id: string;
  createdAt: string;
  gross: number;
  basePrice: number;
  driveFee: number;
  urgencyFee: number;
  discountAmount: number;
};

export type FinancialEventStatus = {
  emailSent: boolean;
  updatedAt: string;
};

export type FinancialState = {
  ytdGross: number;
  updatedAt: string;
  processedEventIds: string[];
  transactions: FinancialTransaction[];
  eventStatus: Record<string, FinancialEventStatus>;
};

const defaultState: FinancialState = {
  ytdGross: 0,
  updatedAt: new Date(0).toISOString(),
  processedEventIds: [],
  transactions: [],
  eventStatus: {},
};

export const getFinancialLogPath = () =>
  path.join(process.cwd(), "log", "financial.json");

const FINANCIAL_STATE_KEY = "financial:state";

const isKvConfigured = () => Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

const readJson = async (filePath: string): Promise<FinancialState> => {
  try {
    const data = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(data) as FinancialState;
    return {
      ...defaultState,
      ...parsed,
      processedEventIds: parsed.processedEventIds ?? [],
      transactions: parsed.transactions ?? [],
      eventStatus: parsed.eventStatus ?? {},
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
  if (isKvConfigured()) {
    try {
      const data = await kv.get<FinancialState>(FINANCIAL_STATE_KEY);
      return data ? { ...defaultState, ...data } : { ...defaultState };
    } catch {
      return { ...defaultState };
    }
  }

  const filePath = getFinancialLogPath();
  return readJson(filePath);
};

export const persistFinancialState = async (state: FinancialState) => {
  if (isKvConfigured()) {
    await kv.set(FINANCIAL_STATE_KEY, state);
    return;
  }

  const filePath = getFinancialLogPath();
  await writeJson(filePath, state);
};
