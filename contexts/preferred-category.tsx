import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import type { DevotionalCategory } from '@/lib/types/devotional';
import { PREFERRED_CATEGORY_KEY } from '@/lib/constants/storage-keys';

const VALID_CATEGORIES: DevotionalCategory[] = ['sincere-milk', 'higher-everyday', 'daily-manna'];
const DEFAULT_CATEGORY: DevotionalCategory = 'daily-manna';

type PreferredCategoryContextValue = {
  preferredCategory: DevotionalCategory;
  preferredCategoryOrNull: DevotionalCategory | null;
  setPreferredCategory: (category: DevotionalCategory) => Promise<void>;
  isLoaded: boolean;
  hasChosenCategory: boolean;
};

const PreferredCategoryContext = React.createContext<PreferredCategoryContextValue | null>(null);

export function PreferredCategoryProvider({ children }: { children: React.ReactNode }) {
  const [category, setCategoryState] = useState<DevotionalCategory | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(PREFERRED_CATEGORY_KEY).then((value) => {
      if (value && VALID_CATEGORIES.includes(value as DevotionalCategory)) {
        setCategoryState(value as DevotionalCategory);
      } else {
        setCategoryState(null);
      }
      setIsLoaded(true);
    });
  }, []);

  const setPreferredCategory = useCallback(async (next: DevotionalCategory) => {
    await AsyncStorage.setItem(PREFERRED_CATEGORY_KEY, next);
    setCategoryState(next);
  }, []);

  const value: PreferredCategoryContextValue = {
    preferredCategory: category ?? DEFAULT_CATEGORY,
    preferredCategoryOrNull: category,
    setPreferredCategory,
    isLoaded,
    hasChosenCategory: category !== null,
  };

  return (
    <PreferredCategoryContext.Provider value={value}>
      {children}
    </PreferredCategoryContext.Provider>
  );
}

export function usePreferredCategoryContext(): PreferredCategoryContextValue {
  const ctx = useContext(PreferredCategoryContext);
  if (!ctx) {
    throw new Error('usePreferredCategoryContext must be used within PreferredCategoryProvider');
  }
  return ctx;
}
