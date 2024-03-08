import { useQuery } from "@tanstack/react-query";
import { FilterOption, useFilter } from "../filter";
import { getObjectKey } from "../utils";

export type ValidDatum = { [key: string]: unknown };
export type Datum<R extends ValidDatum = ValidDatum> = R;

export type ValidProp<R extends Datum> = keyof R & string;

export type FieldType = "string" | "number" | "boolean" | "date";

export interface ValueFormatterParams<R extends Datum, K extends ValidProp<R>> {
  field: K;
  value: R[K];
}

export interface ValueFormatter<R extends Datum, K extends ValidProp<R>> {
  (params: ValueFormatterParams<R, K>): string;
}

export interface FieldDef<
  R extends Datum,
  K extends ValidProp<R> = ValidProp<R>,
> {
  field: K;
  type?: FieldType;
  label?: string;
  valueFormatter?: ValueFormatter<R, K>;
}

export interface GetManyParams {
  filter: FilterOption[];
}

export interface GetManyMethod {
  (params: GetManyParams): Promise<{ rows: any[] }>;
}

export interface ResolvedField<
  R extends Datum,
  K extends ValidProp<R> = ValidProp<R>,
> {
  field: K;
  type: FieldType;
  label: string;
  valueFormatter?: ValueFormatter<R, K>;
}

export interface DataProviderDefinition<R extends Datum> {
  getMany: GetManyMethod;
  fields?: FieldDef<R>[];
}

export interface ResolvedDataProvider<R extends Datum> {
  getMany: GetManyMethod;
  fields: ResolvedField<R>[];
}

export function createDataProvider<R extends Datum>(
  input: DataProviderDefinition<R> | GetManyMethod,
): ResolvedDataProvider<R> {
  const fields = (
    typeof input !== "function" && input.fields ? input.fields : []
  ).map(
    (fieldDef) =>
      ({
        type: "string",
        label: fieldDef.field,
        ...fieldDef,
      }) satisfies ResolvedField<R>,
  );
  if (typeof input === "function") {
    return { getMany: input, fields };
  }
  return { ...input, fields };
}

export function useDataProviderGetMany<R extends Datum>(
  dataProvider: ResolvedDataProvider<R>,
) {
  const key = getObjectKey(dataProvider);
  const filter = useFilter();

  return useQuery({
    queryKey: ["data", key, filter?.getKey()],
    queryFn: () => dataProvider.getMany({ filter: filter?.filter ?? [] }),
  });
}
