import "client-only";
import * as React from "react";
import { useNavigate, useSearchParams } from "./navigation";
import type { Datum, ResolvedDataProvider, ValidDatum } from "./data";

export interface FilterOption<
  R,
  K extends keyof R & string = keyof R & string,
> {
  field: K;
  operator: string;
  value: R[K];
}

export function getKeyFromFilter<R extends Datum>(filter: Filter<R>): string {
  return JSON.stringify(filter);
}

export type Filter<R extends Datum> = {
  [field in keyof R & string]?: {
    [operator: string]: string;
  };
};

function expandFilter<R extends Datum>(filter: FilterOption<R>[]): Filter<R> {
  const result: Filter<R> = {};
  for (const { field, operator, value } of filter) {
    result[field] ??= {};
    (result[field] as any)[operator] = value as any;
  }
  return result;
}

export interface Codec<V> {
  parse: (value: string) => V;
  stringify: (value: V) => string;
}

export type Parameter<V = string> = {
  kind: "urlQuery";
  name: string;
  codec?: Codec<V>;
  defaultValue?: V;
};

export type CreateUrlParameterOptions<V> = {
  codec?: Codec<V>;
  defaultValue?: V;
} & (V extends string ? {} : { codec: Codec<V> });

export function createUrlParameter<V = string>(
  name: string,
  options: V extends string
    ? CreateUrlParameterOptions<V> | undefined
    : CreateUrlParameterOptions<V>,
): Parameter<V> {
  return {
    kind: "urlQuery",
    name,
    ...options,
  };
}

function getParamValue<V>(
  searchParams: URLSearchParams,
  param: Parameter<V>,
): V | null {
  const value = searchParams.get(param.name);
  if (value === null) {
    return param.defaultValue ?? null;
  }
  const parsedValue = param.codec ? param.codec.parse(value) : value;
  return parsedValue as V;
}

export function useParameterValues(params: Parameter<any>[]): any {
  const searchParams = useSearchParams();

  return React.useMemo(() => {
    return Object.fromEntries(
      params.map((param) => [param.name, getParamValue(searchParams, param)]),
    );
  }, [params, searchParams]);
}

export function useParameterValue<V>(param: Parameter<V>): V | null {
  const stableParams = React.useMemo(() => [param], [param]);
  const values = useParameterValues(stableParams);
  return values[param.name] ?? null;
}

export function useSetParameterValues(
  params: Parameter<any>[],
): (newValues: any) => void {
  const navigate = useNavigate();
  const searchParams = useSearchParams();
  const paramMap = React.useMemo(
    () => new Map(params.map((p) => [p.name, p])),
    [params],
  );
  return React.useCallback(
    (newValues) => {
      const newParams = new URLSearchParams(searchParams);

      for (const [name, value] of Object.entries(newValues)) {
        const param = paramMap.get(name);
        if (!param) {
          continue;
        } else if (value === null || value === param.defaultValue) {
          newParams.delete(name);
        }

        let stringValue: string = param.codec
          ? param.codec.stringify(value)
          : (value as string);

        newParams.set(param.name, stringValue);
      }
      navigate(`?${newParams.toString()}`, { history: "replace" });
    },
    [navigate, paramMap, searchParams],
  );
}

export function useSetParameterValue<V>(
  param: Parameter<V>,
): (value: V | null) => void {
  const stableParams = React.useMemo(() => [param], [param]);
  const setValues = useSetParameterValues(stableParams);
  return React.useCallback(
    (value: V | null) => {
      setValues({ [param.name]: value });
    },
    [param.name, setValues],
  );
}

export type FilterOperatorBinding<R extends ValidDatum> = {
  [field in keyof R]: {
    [operator: string]: Parameter;
  };
};

export type FilterBinding<R extends ValidDatum> = [
  ResolvedDataProvider<R>,
  FilterOperatorBinding<R>,
];

type FilterBindingContextValue = [ResolvedDataProvider<any>, Filter<any>][];

const FilterBindingContext = React.createContext<FilterBindingContextValue>([]);

export interface FilterBindingProviderProps {
  children?: React.ReactNode;
  bindings: FilterBinding<any>[];
}

export function FilterBindingProvider({
  children,
  bindings,
}: FilterBindingProviderProps) {
  const searchParams = useSearchParams();

  const filters: FilterBindingContextValue = React.useMemo(() => {
    return bindings.map(([dataProvider, dataProviderbindings]) => {
      const filter: Filter<any> = {};

      for (const [name, operatorParam] of Object.entries(
        dataProviderbindings,
      )) {
        for (const [operator, param] of Object.entries(operatorParam)) {
          const value = getParamValue(searchParams, param);
          if (value !== null) {
            filter[name] ??= {};
            filter[name]![operator] = value;
          }
        }
      }

      return [dataProvider, filter];
    });
  }, [bindings, searchParams]);

  const prevFiltersRef = React.useRef(filters);

  // Stabilize the value of filters so that we don't trigger unnecessary re-renders
  // this allows for taking the bindings as unstable prop
  const stableFilters = React.useMemo(() => {
    const prevFilters = prevFiltersRef.current;
    if (prevFilters === filters) {
      return filters;
    }
    if (prevFilters.length !== filters.length) {
      return filters;
    }

    const changes: FilterBindingContextValue = [];
    let changeDetected = false;
    for (let i = 0; i < filters.length; i++) {
      const [dp, filter] = filters[i];
      const [prevDp, prevFilter] = prevFilters[i];
      if (
        dp === prevDp &&
        getKeyFromFilter(filter) === getKeyFromFilter(prevFilter)
      ) {
        changes.push(prevFilters[i]);
      } else {
        changes.push(filters[i]);
        changeDetected = true;
      }
    }

    return changeDetected ? changes : prevFilters;
  }, [filters]);

  return (
    <FilterBindingContext.Provider value={stableFilters}>
      {children}
    </FilterBindingContext.Provider>
  );
}

interface FilterBindingOptions {
  field: string;
  operator: string;
  parameter: Parameter<any>;
}

function flattenFilterBinding(
  filter: FilterOperatorBinding<any>,
): FilterBindingOptions[] {
  return Object.entries(filter).flatMap(([field, operators]) => {
    return Object.entries(operators).map(([operator, parameter]) => ({
      field,
      operator,
      parameter,
    }));
  });
}

export function useAppliedFilter<R extends Datum>(
  dataProvider: ResolvedDataProvider<R>,
): Filter<R> {
  const filters = React.useContext(FilterBindingContext);
  return React.useMemo(
    () => filters.find(([dp]) => dp === dataProvider)?.[1] ?? {},
    [dataProvider, filters],
  );
}
