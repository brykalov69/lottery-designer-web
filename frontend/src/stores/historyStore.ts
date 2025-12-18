// historyStore.ts

import { useSyncExternalStore } from "react";

/* =========================
   TYPES (History v1)
========================= */

export type HistoryDraw = {
  date: string | null;      // "YYYY-MM-DD"
  main: number[];           // main balls
  extra?: number[];
};

export type HistoryMeta = {
  totalDraws: number;
  source: "file" | "api";
  validated: boolean;

  // History v1 additions
  from?: string;
  to?: string;
  years?: number;
  warningExtraBall?: boolean;	
  warningDuplicate?: boolean;
};

export type HistoryPayload = {
  draws: HistoryDraw[];     // ✅ was number[][]
  ballCount: number;
  ranges: {
    min: number;
    max: number;
  };
  filters: {};
  meta: HistoryMeta;
};

type HistoryState = {
  payload: HistoryPayload | null;
  status: "idle" | "loading" | "ready" | "error";
  error: string;
};

/* =========================
   STORE CORE
========================= */

const _history: HistoryState = {
  payload: null,
  status: "idle",
  error: "",
};

let version = 0;
const listeners = new Set<() => void>();

function notify() {
  version++;
  listeners.forEach((l) => l());
}

/* =========================
   STORE HOOK
========================= */

export function useHistoryStore() {
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => version,
    () => version
  );

  return {
    history: _history,

    setHistoryLoading() {
      _history.status = "loading";
      _history.error = "";
      notify();
    },

    setHistoryPayload(payload: HistoryPayload) {
      _history.payload = payload;
      _history.status = "ready";
      _history.error = "";
      notify();
    },

    setHistoryError(msg: string) {
      _history.status = "error";
      _history.error = msg;
      notify();
    },

    clearHistory() {
      _history.payload = null;
      _history.status = "idle";
      _history.error = "";
      notify();
    },
  };
}
