import { useQuery } from "@tanstack/react-query";
import { FilterOption, useFilter } from "../filter";
import { getObjectKey } from "../utils";

export interface ValueFormatterParams {
  field: string;
  value: any;
}

export interface ValueFormatter {
  (params: ValueFormatterParams): string;
}

export interface FieldDef {
  field: string;
  type?: string;
  label?: string;
  valueFormatter?: ValueFormatter;
}

export interface GetManyParams {
  filter: FilterOption[];
}

export interface GetManyMethod {
  (params: GetManyParams): Promise<{ rows: any[] }>;
}

export interface ResolvedField {
  field: string;
  type: string;
  label: string;
  valueFormatter?: ValueFormatter;
}

export interface DataProviderDefinition {
  getMany: GetManyMethod;
  fields?: FieldDef[];
}

export interface ResolvedDataProvider {
  getMany: GetManyMethod;
  fields: ResolvedField[];
}

export function createDataProvider(
  input: DataProviderDefinition | GetManyMethod,
): ResolvedDataProvider {
  const fields = (
    typeof input !== "function" && input.fields ? input.fields : []
  ).map((fieldDef) => ({
    type: "string",
    label: fieldDef.field,
    ...fieldDef,
  }));
  if (typeof input === "function") {
    return { getMany: input, fields };
  }
  return { ...input, fields };
}

export function useDataProviderGetMany(dataProvider: ResolvedDataProvider) {
  const key = getObjectKey(dataProvider);
  const filter = useFilter();

  return useQuery({
    queryKey: ["data", key, filter?.getKey()],
    queryFn: () => dataProvider.getMany({ filter: filter?.filter ?? [] }),
  });
}
