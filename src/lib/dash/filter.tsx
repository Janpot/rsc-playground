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

export function useParameterValues(params: Parameter<any>[]): any {
  const searchParams = useSearchParams();

  return React.useMemo(() => {
    return Object.fromEntries(
      params.map((param) => {
        const value = searchParams.get(param.name);
        if (value === null) {
          return [param.name, param.defaultValue ?? null];
        }
        const parsedValue = param.codec ? param.codec.parse(value) : value;
        return [param.name, parsedValue];
      }),
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
      console.log(" navigating to: ", `?${newParams.toString()}`);
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

const FilterBindingContext = React.createContext<FilterBinding<any>[]>([]);

export interface FilterBindingProviderProps {
  children?: React.ReactNode;
  bindings: FilterBinding<any>[];
}

export function FilterBindingProvider({
  children,
  bindings,
}: FilterBindingProviderProps) {
  return (
    <FilterBindingContext.Provider value={bindings}>
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
  const bindings = React.useContext(FilterBindingContext);

  const flat = React.useMemo(() => {
    const providerbinding = bindings.find(([dp]) => dp === dataProvider);
    const dataProviderbindings = providerbinding ? providerbinding[1] : {};
    return dataProviderbindings
      ? flattenFilterBinding(dataProviderbindings)
      : [];
  }, [bindings, dataProvider]);

  const parameterValues = useParameterValues(flat.map((f) => f.parameter));

  const filter: Filter<R> = React.useMemo(() => {
    const flatFilter = flat.map((option) => ({
      field: option.field,
      operator: option.operator,
      value: parameterValues[option.parameter.name],
    }));

    return expandFilter(flatFilter);
  }, [flat, parameterValues]);

  return filter;
}
