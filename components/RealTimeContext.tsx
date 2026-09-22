"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface ShopSettingsType {
  shopName: string;
  shopNameUrdu: string;
  shopAddress: string;
  shopPhone: string;
  shopLicense: string;
  receiptFooterNote: string;
}

const DEFAULT_SETTINGS: ShopSettingsType = {
  shopName: "Al-Rehman Grain Commission Shop",
  shopNameUrdu: "الرحمٰن غلہ کمیشن شاپ - غلہ منڈی",
  shopAddress: "Shop #42, Main Galla Mandi, Gate 1",
  shopPhone: "0300-1234567, 0321-7654321",
  shopLicense: "MANDI-FSD-2026-904",
  receiptFooterNote: "کمیشن شاپ پر مال تسلی بخش تولا اور بیچا جاتا ہے۔ کمپیوٹرائزڈ پرچہ منڈی",
};

// Global broadcast channel name for cross-tab realtime sync
const CHANNEL_NAME = "grainflow_realtime_sync";

export type SyncScope =
  | "settings"
  | "products"
  | "sales"
  | "purchases"
  | "customers"
  | "rates"
  | "cashbook"
  | "baqaya"
  | "all";

// Helper to broadcast changes to all components and all open tabs
export function broadcastSync(scope: SyncScope) {
  if (typeof window === "undefined") return;

  // 1. Same-tab event dispatch
  window.dispatchEvent(new CustomEvent("grainflow:sync", { detail: { scope, timestamp: Date.now() } }));

  // 2. Cross-tab BroadcastChannel
  try {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({ scope, timestamp: Date.now() });
    channel.close();
  } catch (e) {
    // BroadcastChannel might not be supported in older environments; fallback to localStorage event
    try {
      localStorage.setItem("grainflow_sync_trigger", `${scope}_${Date.now()}`);
    } catch {}
  }
}

// Hook to subscribe any page/component to live updates
export function useRealTimeSync(
  targetScopes: Array<SyncScope>,
  onSync: () => void
) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleSync = (scope: string) => {
      if (scope === "all" || targetScopes.includes("all") || targetScopes.includes(scope as any)) {
        onSync();
      }
    };

    // 1. Listen for same-window events
    const localListener = (e: Event) => {
      const custom = e as CustomEvent;
      if (custom.detail?.scope) {
        handleSync(custom.detail.scope);
      }
    };
    window.addEventListener("grainflow:sync", localListener);

    // 2. Listen for cross-tab BroadcastChannel events
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = (event) => {
        if (event.data?.scope) {
          handleSync(event.data.scope);
        }
      };
    } catch {}

    // 3. Fallback: storage event
    const storageListener = (e: StorageEvent) => {
      if (e.key === "grainflow_sync_trigger" && e.newValue) {
        const scope = e.newValue.split("_")[0];
        handleSync(scope);
      }
    };
    window.addEventListener("storage", storageListener);

    return () => {
      window.removeEventListener("grainflow:sync", localListener);
      window.removeEventListener("storage", storageListener);
      if (channel) {
        channel.close();
      }
    };
  }, [targetScopes, onSync]);
}

interface SettingsContextType {
  settings: ShopSettingsType;
  loading: boolean;
  updateSettings: (newSettings: Partial<ShopSettingsType>) => Promise<boolean>;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SETTINGS,
  loading: false,
  updateSettings: async () => false,
  refreshSettings: async () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<ShopSettingsType>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings({
          shopName: data.shopName || DEFAULT_SETTINGS.shopName,
          shopNameUrdu: data.shopNameUrdu || DEFAULT_SETTINGS.shopNameUrdu,
          shopAddress: data.shopAddress || DEFAULT_SETTINGS.shopAddress,
          shopPhone: data.shopPhone || DEFAULT_SETTINGS.shopPhone,
          shopLicense: data.shopLicense || DEFAULT_SETTINGS.shopLicense,
          receiptFooterNote: data.receiptFooterNote || DEFAULT_SETTINGS.receiptFooterNote,
        });
      }
    } catch (e) {
      console.error("Failed to load settings:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Listen for realtime settings sync from other tabs or components
  useRealTimeSync(["settings", "all"], () => {
    fetchSettings();
  });

  const updateSettings = async (newSettings: Partial<ShopSettingsType>): Promise<boolean> => {
    try {
      const merged = { ...settings, ...newSettings };
      setSettings(merged); // optimistic update

      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(merged),
      });

      if (res.ok) {
        const saved = await res.json();
        setSettings({
          shopName: saved.shopName,
          shopNameUrdu: saved.shopNameUrdu,
          shopAddress: saved.shopAddress,
          shopPhone: saved.shopPhone,
          shopLicense: saved.shopLicense,
          receiptFooterNote: saved.receiptFooterNote,
        });

        // Broadcast to all other tabs and components!
        broadcastSync("settings");
        return true;
      }
      return false;
    } catch (e) {
      console.error("Error saving settings:", e);
      return false;
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        updateSettings,
        refreshSettings: fetchSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useShopSettings() {
  return useContext(SettingsContext);
}
