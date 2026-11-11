/**
 * Zero-Cost & Free-Tier Quota Telemetry Service
 *
 * Tracks daily usage against Firebase Spark Plan (Free Forever, $0.00) and
 * Google AI Studio Gemini Free Tier (1,500 RPD, $0.00), enforcing a hard
 * client-side circuit breaker so the application never exceeds free-tier limits.
 */

export interface DailyCostTelemetry {
  date: string; // YYYY-MM-DD
  firestoreReads: number;
  firestoreWrites: number;
  firestoreDeletes: number;
  offlineLexiconHits: number;
  cacheHits: number;
  fastDictHits: number;
  geminiFreeTierCalls: number;
  strictZeroCostGuardrail: boolean;
  zeroAiLocalOnlyMode: boolean;
}

export const FREE_TIER_LIMITS = {
  FIRESTORE_DAILY_READS: 50_000,
  FIRESTORE_DAILY_WRITES: 20_000,
  FIRESTORE_DAILY_DELETES: 20_000,
  GEMINI_FREE_DAILY_REQUESTS: 1_500,
  SAFETY_GUARDRAIL_RATIO: 0.8, // Trip circuit breaker at 80% of free tier to guarantee $0.00
} as const;

const TELEMETRY_STORAGE_KEY = 'foliolingo_zero_cost_telemetry_v1';
const USER_GEMINI_KEY_STORAGE = 'user_gemini_api_key';

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

class CostTelemetryService {
  private state: DailyCostTelemetry;
  private listeners = new Set<(state: DailyCostTelemetry) => void>();

  constructor() {
    this.state = this.loadState();
  }

  private createDefaultState(date = getTodayString()): DailyCostTelemetry {
    return {
      date,
      firestoreReads: 0,
      firestoreWrites: 0,
      firestoreDeletes: 0,
      offlineLexiconHits: 0,
      cacheHits: 0,
      fastDictHits: 0,
      geminiFreeTierCalls: 0,
      strictZeroCostGuardrail: true,
      zeroAiLocalOnlyMode: false,
    };
  }

  private loadState(): DailyCostTelemetry {
    try {
      const raw = localStorage.getItem(TELEMETRY_STORAGE_KEY);
      const today = getTodayString();
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<DailyCostTelemetry>;
        if (parsed.date === today) {
          return {
            ...this.createDefaultState(today),
            ...parsed,
          };
        }
        // Roll over to new day while preserving user guardrail preferences
        return {
          ...this.createDefaultState(today),
          strictZeroCostGuardrail: parsed.strictZeroCostGuardrail ?? true,
          zeroAiLocalOnlyMode: parsed.zeroAiLocalOnlyMode ?? false,
        };
      }
    } catch {
      // Ignore storage errors
    }
    return this.createDefaultState();
  }

  private saveState(): void {
    try {
      localStorage.setItem(TELEMETRY_STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // Ignore quota errors
    }
    this.listeners.forEach((listener) => listener({ ...this.state }));
  }

  private ensureToday(): void {
    const today = getTodayString();
    if (this.state.date !== today) {
      this.state = {
        ...this.createDefaultState(today),
        strictZeroCostGuardrail: this.state.strictZeroCostGuardrail,
        zeroAiLocalOnlyMode: this.state.zeroAiLocalOnlyMode,
      };
    }
  }

  public getSnapshot(): DailyCostTelemetry {
    this.ensureToday();
    return { ...this.state };
  }

  public subscribe(listener: (state: DailyCostTelemetry) => void): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public canPerformFirestoreRead(count = 1): boolean {
    this.ensureToday();
    if (!this.state.strictZeroCostGuardrail) return true;
    const cap = Math.floor(FREE_TIER_LIMITS.FIRESTORE_DAILY_READS * FREE_TIER_LIMITS.SAFETY_GUARDRAIL_RATIO);
    return this.state.firestoreReads + count <= cap;
  }

  public canPerformFirestoreWrite(count = 1): boolean {
    this.ensureToday();
    if (!this.state.strictZeroCostGuardrail) return true;
    const cap = Math.floor(FREE_TIER_LIMITS.FIRESTORE_DAILY_WRITES * FREE_TIER_LIMITS.SAFETY_GUARDRAIL_RATIO);
    return this.state.firestoreWrites + count <= cap;
  }

  public canPerformGeminiCall(): boolean {
    this.ensureToday();
    if (this.state.zeroAiLocalOnlyMode) return false;
    if (!this.state.strictZeroCostGuardrail) return true;
    const cap = Math.floor(FREE_TIER_LIMITS.GEMINI_FREE_DAILY_REQUESTS * FREE_TIER_LIMITS.SAFETY_GUARDRAIL_RATIO);
    return this.state.geminiFreeTierCalls + 1 <= cap;
  }

  public recordFirestoreRead(count = 1): void {
    this.ensureToday();
    this.state.firestoreReads += Math.max(0, count);
    this.saveState();
  }

  public recordFirestoreWrite(count = 1): void {
    this.ensureToday();
    this.state.firestoreWrites += Math.max(0, count);
    this.saveState();
  }

  public recordFirestoreDelete(count = 1): void {
    this.ensureToday();
    this.state.firestoreDeletes += Math.max(0, count);
    this.saveState();
  }

  public recordLookupSource(source: 'lexicon' | 'cache' | 'fast-dict' | 'gemini'): void {
    this.ensureToday();
    if (source === 'lexicon') {
      this.state.offlineLexiconHits += 1;
    } else if (source === 'cache') {
      this.state.cacheHits += 1;
    } else if (source === 'fast-dict') {
      this.state.fastDictHits += 1;
    } else if (source === 'gemini') {
      this.state.geminiFreeTierCalls += 1;
    }
    this.saveState();
  }

  public setStrictZeroCostGuardrail(enabled: boolean): void {
    this.ensureToday();
    this.state.strictZeroCostGuardrail = enabled;
    this.saveState();
  }

  public setZeroAiLocalOnlyMode(enabled: boolean): void {
    this.ensureToday();
    this.state.zeroAiLocalOnlyMode = enabled;
    this.saveState();
  }

  public getCustomGeminiApiKey(): string {
    try {
      return localStorage.getItem(USER_GEMINI_KEY_STORAGE) || '';
    } catch {
      return '';
    }
  }

  public setCustomGeminiApiKey(apiKey: string): void {
    try {
      const trimmed = apiKey.trim();
      if (trimmed) {
        localStorage.setItem(USER_GEMINI_KEY_STORAGE, trimmed);
      } else {
        localStorage.removeItem(USER_GEMINI_KEY_STORAGE);
      }
    } catch {
      // Ignore storage errors
    }
  }
}

export const costTelemetry = new CostTelemetryService();
