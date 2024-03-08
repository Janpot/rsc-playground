import "client-only";
import * as React from "react";
import { useNavigate, useSearchParams } from "./navigation";
import invariant from "invariant";

export interface FilterOption {
  field: string;
  operator: string;
  value: string;
}

export interface FilterFieldDef {
  field: string;
  // default operator = 'eq'
  operator?: string;
  defaultvalue?: string;
}

export interface DashboardFilter {
  filter: FilterOption[];
  setFilter: React.Dispatch<React.SetStateAction<FilterOption[]>>;
  getKey: () => string;
}

function getParamName({
  field,
  operator = "eq",
}: Pick<FilterOption, "field" | "operator">) {
  if (operator === "eq") {
    return field;
  }
  return `${field}[${operator}]`;
}

const defaultFilter: DashboardFilter = {
  filter: [],
  setFilter: () => {
    throw new Error("No filter context available");
  },
  getKey: () => "[]",
};

export const FilterContext =
  React.createContext<DashboardFilter>(defaultFilter);

export interface FilterProviderProps {
  fields: FilterFieldDef[];
  children?: React.ReactNode;
}

export function FilterProvider({ fields, children }: FilterProviderProps) {
  const searchParamMap = React.useMemo(
    () =>
      new Map(
        fields.map((fieldDef) => {
          const withDefaults = { operator: "eq", ...fieldDef };
          return [getParamName(withDefaults), withDefaults];
        }),
      ),
    [fields],
  );

  const readFilterFromSearchParams = React.useCallback(
    (searchParams: URLSearchParams) => {
      const filter: FilterOption[] = [];

      for (const [name, param] of searchParamMap.entries()) {
        const queryParamValue = searchParams.get(name);
        if (queryParamValue !== null) {
          filter.push({
            field: param.field,
            operator: param.operator,
            value: queryParamValue,
          });
        } else if (param.defaultvalue) {
          filter.push({
            field: param.field,
            operator: param.operator,
            value: param.defaultvalue,
          });
        }
      }

      return filter;
    },
    [searchParamMap],
  );

  const searchParams = useSearchParams();

  const [filter, setFilter] = React.useState(() =>
    readFilterFromSearchParams(searchParams),
  );

  const writeFilterToSearchParams = React.useCallback(
    (searchParams: URLSearchParams, filter: FilterOption[]) => {
      const filterParams = new Set(filter.map((item) => getParamName(item)));
      Array.from(searchParams.keys()).forEach((name) => {
        const param = searchParamMap.get(name);
        if (!param) {
          // not our concern
          return;
        }
        if (!filterParams.has(name)) {
          searchParams.delete(name);
        }
      });

      filter.forEach((option) => {
        searchParams.set(getParamName(option), option.value);
      });

      return searchParams;
    },
    [searchParamMap],
  );

  const writeFilterToUrl = React.useCallback(
    (inputUrl: string, filter: FilterOption[]): string => {
      const outputUrl = new URL(inputUrl);
      writeFilterToSearchParams(outputUrl.searchParams, filter);
      return outputUrl.href;
    },
    [writeFilterToSearchParams],
  );

  const getKey = React.useCallback(() => {
    const searchParams = writeFilterToSearchParams(
      new URLSearchParams(),
      filter,
    );
    return searchParams.toString();
  }, [filter, writeFilterToSearchParams]);

  const navigate = useNavigate();

  React.useEffect(() => {
    const newUrl = writeFilterToUrl(window.location.href, filter);
    navigate(newUrl, { history: "replace" });
  }, [filter, navigate, writeFilterToUrl]);

  const ctx = React.useMemo(
    () => ({
      filter,
      setFilter,
      getKey,
    }),
    [filter, setFilter, getKey],
  );
  return (
    <FilterContext.Provider value={ctx}>{children}</FilterContext.Provider>
  );
}

export function useFilter(): DashboardFilter {
  return React.useContext(FilterContext);
}

export interface ExpandedFilter {
  [field: string]: {
    [operator: string]: string;
  };
}

export function expandFilter(filter: FilterOption[]): ExpandedFilter {
  const result: ExpandedFilter = {};
  for (const { field, operator, value } of filter) {
    if (!result[field]) {
      result[field] = {};
    }
    result[field][operator] = value;
  }
  return result;
}

export function flattenFilter(filter: ExpandedFilter): FilterOption[] {
  return Object.entries(filter).flatMap(([field, operators]) => {
    return Object.entries(operators).map(([operator, value]) => ({
      field,
      operator,
      value,
    }));
  });
}

export function useFilterValueState(field: string, operator: string = "eq") {
  const dashboardFilter = useFilter();
  const value = React.useMemo(() => {
    const expanded = expandFilter(dashboardFilter.filter);
    return expanded[field]?.[operator] ?? null;
  }, [field, dashboardFilter, operator]);

  const setValue = React.useCallback(
    (newValue: string | null) => {
      dashboardFilter.setFilter((existing) => {
        const expanded = expandFilter(existing);
        expanded[field] ??= {};
        if (newValue === null) {
          delete expanded[field][operator];
        } else {
          expanded[field][operator] = newValue;
        }
        const flattened = flattenFilter(expanded);
        return flattened;
      });
    },
    [field, dashboardFilter, operator],
  );

  return [value, setValue] satisfies [
    string | null,
    (newValue: string | null) => void,
  ];
}
