import { usePreferredCategoryContext } from '@/contexts/preferred-category';

/** Prefer using this hook; requires PreferredCategoryProvider in the tree. */
export function usePreferredCategory() {
  return usePreferredCategoryContext();
}
