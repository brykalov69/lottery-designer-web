import { useSyncExternalStore } from "react";

/* =========================
   TYPES
========================= */

/* ---------- PRO MODAL ---------- */

export type ProModalReason =
  | "analytics_quads"
  | "analytics_quints"
  | "greedy_fast"
  | "greedy_hybrid"
  | "budget_money"
  | "ai_insights"
  | "ai_quality"
  | "ai_summary"
  | "generic";

export type ProModalState = {
  open: boolean;
  reason?: ProModalReason;
};

/* ---------- HISTORY ---------- */

export type HistorySlice = {
  rows: any[];
  loaded: boolean;
};

/* ---------- GENERATOR ---------- */

export type GeneratorInput = {
  numbersInput: string;
  limit: string;

  fixedFirstInput: string;
  forcedInput: string;

  groupAInput: string;
  groupBInput: string;
  groupCInput: string;

  quotaA: string;
  quotaB: string;
  quotaC: string;

  rangeMode: "global" | "perball";
  perBallRanges: any;
};

export type GeneratorResult = {
  combinations: number[][];
  count: number;
};

export type GeneratorSlice = {
  input: GeneratorInput;
  result: GeneratorResult | null;
  status: "idle" | "running" | "done" | "error";
  error: string | null;
};

/* ---------- GREEDY ---------- */

export type GreedyInput = {
  numbersInput: string;
  mode: "classic" | "fast" | "hybrid";
  attempts: string;
  sampleSize: string;
};

export type GreedyResult = {
  system: number[][];
  coverage: number;
};

export type GreedySlice = {
  input: GreedyInput;
  result: GreedyResult | null;
  status: "idle" | "running" | "done" | "error";
  error: string | null;
};

/* ---------- BUDGET ---------- */

export type BudgetInput = {
  numbersInput: string;
  mode: "count" | "money";
  ticketCount: string;
  budget: string;
  ticketCost: string;
};

export type BudgetResult = {
  system: number[][];
  coverage?: number;
};

export type BudgetSlice = {
  input: BudgetInput;
  result: BudgetResult | null;
  status: "idle" | "running" | "done" | "error";
  error: string | null;
};

/* ---------- AI PIPE ---------- */

export type AISlice = {
  source?: "greedy" | "budget" | null;
  system?: number[][] | null;
  status?: "idle" | "ready";
};

/* ---------- AI QUALITY ---------- */

export type AIQualitySlice = {
  useGreedy: boolean;
  useBudget: boolean;
  error: string | null;
};

/* ---------- UI (GLOBAL) ---------- */

export type UISlice = {
  collapse: Record<string, boolean>;
};

/* ---------- ROOT STATE ---------- */

export type SessionState = {
  isPro: boolean;

  proModal: ProModalState;

  history: HistorySlice;
  generator: GeneratorSlice;
  greedy: GreedySlice;
  budget: BudgetSlice;

  ai: AISlice;
  aiQuality: AIQualitySlice;

  ui: UISlice;
};

/* =========================
   INITIAL STATE
========================= */

const initialState: SessionState = {
  isPro: false,

  proModal: {
    open: false,
    reason: undefined,
  },

  history: {
    rows: [],
    loaded: false,
  },

 generator: {
  input: {
    numbersInput: "1 2 3 4 5 6",
    limit: "",

    fixedFirstInput: "",
    forcedInput: "",

    groupAInput: "",
    groupBInput: "",
    groupCInput: "",

    quotaA: "",
    quotaB: "",
    quotaC: "",

    rangeMode: "global",
    perBallRanges: {},
  },
  result: null,
  status: "idle",
  error: null,
},


  greedy: {
    input: {
      numbersInput: "",
      mode: "classic",
      attempts: "5",
      sampleSize: "2000",
    },
    result: null,
    status: "idle",
    error: null,
  },

  budget: {
    input: {
      numbersInput: "",
      mode: "count",
      ticketCount: "10",
      budget: "",
      ticketCost: "",
    },
    result: null,
    status: "idle",
    error: null,
  },

  ai: {
    source: null,
    system: null,
    status: "idle",
  },

  aiQuality: {
    useGreedy: false,
    useBudget: false,
    error: null,
  },

  ui: {
    collapse: {},
  },
};

/* =========================
   STORE CORE
========================= */

let state: SessionState = initialState;
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

/* =========================
   STORE HOOK
========================= */

export function useSessionStore() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  /* ---------- HISTORY ---------- */

  const setHistory = (rows: any[]) => {
    state = { ...state, history: { rows, loaded: true } };
    emitChange();
  };

  /* ---------- GENERATOR ---------- */

  const setGeneratorInput = (partial: Partial<GeneratorInput>) => {
    state = {
      ...state,
      generator: {
        ...state.generator,
        input: { ...state.generator.input, ...partial },
      },
    };
    emitChange();
  };

  const setGeneratorResult = (result: GeneratorResult | null) => {
    state = {
      ...state,
      generator: { ...state.generator, result },
    };

    // 🔓 auto-open generator results
    if (result) {
      state = {
        ...state,
        ui: {
          ...state.ui,
          collapse: {
            ...state.ui.collapse,
            "generator.results": true,
          },
        },
      };
    }

    emitChange();
  };

  /* ---------- GREEDY ---------- */

  const setGreedyInput = (partial: Partial<GreedyInput>) => {
    state = {
      ...state,
      greedy: {
        ...state.greedy,
        input: { ...state.greedy.input, ...partial },
      },
    };
    emitChange();
  };

  const setGreedyResult = (result: GreedyResult | null) => {
    state = {
      ...state,
      greedy: { ...state.greedy, result, status: "done", error: null },
      ui: {
        ...state.ui,
        collapse: {
          ...state.ui.collapse,
          "greedy.results": true, // 🔓 auto-open
        },
      },
    };
    emitChange();
  };

  const setGreedyStatus = (status: GreedySlice["status"]) => {
    state = { ...state, greedy: { ...state.greedy, status } };
    emitChange();
  };

  const setGreedyError = (error: string | null) => {
    state = {
      ...state,
      greedy: { ...state.greedy, error, status: "error" },
    };
    emitChange();
  };

  /* ---------- BUDGET ---------- */

  const setBudgetInput = (partial: Partial<BudgetInput>) => {
    state = {
      ...state,
      budget: {
        ...state.budget,
        input: { ...state.budget.input, ...partial },
      },
    };
    emitChange();
  };

  const setBudgetResult = (result: BudgetResult | null) => {
    state = {
      ...state,
      budget: { ...state.budget, result, status: "done", error: null },
      ui: {
        ...state.ui,
        collapse: {
          ...state.ui.collapse,
          "budget.results": true, // 🔓 auto-open
        },
      },
    };
    emitChange();
  };

  const setBudgetError = (error: string | null) => {
    state = {
      ...state,
      budget: { ...state.budget, error, status: "error" },
    };
    emitChange();
  };

  /* ---------- AI PIPE ---------- */

  const setAIInput = (payload: {
    source: "greedy" | "budget";
    system: number[][];
  }) => {
    state = { ...state, ai: { ...payload, status: "ready" } };
    emitChange();
  };

  const clearAI = () => {
    state = {
      ...state,
      ai: { source: null, system: null, status: "idle" },
    };
    emitChange();
  };

  /* ---------- AI QUALITY ---------- */

  const setAIQuality = (partial: Partial<AIQualitySlice>) => {
    state = {
      ...state,
      aiQuality: { ...state.aiQuality, ...partial },
    };
    emitChange();
  };

  /* ---------- UI ---------- */

  const setUICollapse = (key: string, open: boolean) => {
    state = {
      ...state,
      ui: {
        ...state.ui,
        collapse: {
          ...state.ui.collapse,
          [key]: open,
        },
      },
    };
    emitChange();
  };

  /* ---------- PRO MODAL ---------- */

  const openProModal = (reason: ProModalReason = "generic") => {
    state = { ...state, proModal: { open: true, reason } };
    emitChange();
  };

  const closeProModal = () => {
    state = {
      ...state,
      proModal: { open: false, reason: undefined },
    };
    emitChange();
  };

  /* ---------- MISC ---------- */

  const setIsPro = (value: boolean) => {
    state = { ...state, isPro: value };
    emitChange();
  };

  return {
    ...snapshot,

    setHistory,

 
	// Generator
	setGeneratorInput,
	setGeneratorResult,
	setGeneratorStatus,
	setGeneratorError,


    // Greedy
    setGreedyInput,
    setGreedyResult,
    setGreedyStatus,
    setGreedyError,

    // Budget
    setBudgetInput,
    setBudgetResult,
    setBudgetError,

    // AI
    setAIInput,
    clearAI,

    // AI Quality
    setAIQuality,

    // UI
    setUICollapse,

    // PRO modal
    openProModal,
    closeProModal,

    setIsPro,
  };
}

/* ---------- GENERATOR STATUS ---------- */

const setGeneratorStatus = (
  status: GeneratorSlice["status"]
) => {
  state = {
    ...state,
    generator: {
      ...state.generator,
      status,
    },
  };
  emitChange();
};

const setGeneratorError = (error: string | null) => {
  state = {
    ...state,
    generator: {
      ...state.generator,
      error,
      status: "error",
    },
  };
  emitChange();
};

