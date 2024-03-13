import { useMutation, useQuery } from "@tanstack/react-query";
import { FilterOption, getKeyFromFilter, useAppliedFilter } from "../filter";
import { getObjectKey } from "../utils";
import invariant from "invariant";
import * as React from "react";

export type ValidDatum = { [key: string]: unknown };
export type Datum<R extends ValidDatum = ValidDatum> = R;

export type ValidProp<R extends Datum> = keyof R & string;

export type FieldType = "string" | "number" | "boolean" | "date";

export interface ValueFormatterParams<R extends Datum, K extends ValidProp<R>> {
  field: K;
  value: unknown;
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
  getOne?: (id: string) => Promise<R | null>;
  createOne?: (data: R) => Promise<R>;
  updateOne?: (id: string, data: R) => Promise<R>;
  deleteOne?: (id: string) => Promise<void>;
  fields?: FieldDef<R>[];
}

export interface ResolvedDataProvider<R extends Datum> {
  getMany: GetManyMethod;
  getOne?: (id: string) => Promise<R | null>;
  createOne?: (data: R) => Promise<R>;
  updateOne?: (id: string, data: R) => Promise<R>;
  deleteOne?: (id: string) => Promise<void>;
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

export interface Query<R> {
  loading: boolean;
  error: Error | null;
  data?: R;
}

export function useGetMany<R extends Datum>(
  dataProvider: ResolvedDataProvider<R>,
): Query<{ rows: R[] }> {
  const key = getObjectKey(dataProvider);
  const filter = useAppliedFilter(dataProvider);

  const {
    data,
    error,
    isLoading: loading,
  } = useQuery({
    queryKey: ["getMany", key, getKeyFromFilter(filter)],
    queryFn: () => dataProvider.getMany({ filter: filter ?? [] }),
  });
  return React.useMemo(
    () => ({ data, error, loading }),
    [data, error, loading],
  );
}

export function useGetOne<R extends Datum>(
  dataProvider: ResolvedDataProvider<R>,
  id: string,
): Query<R | null> {
  const key = getObjectKey(dataProvider);
  const {
    data,
    error,
    isLoading: loading,
  } = useQuery({
    queryKey: ["getOne", key, id],
    queryFn: () => {
      invariant(dataProvider.getOne, "getOne not implemented");
      return dataProvider.getOne(id);
    },
  });
  return React.useMemo(
    () => ({ data, error, loading }),
    [data, error, loading],
  );
}

export interface Mutation<R> {
  pending: boolean;
  mutate: (data: R) => void;
}

export function useCreateOne<R extends Datum>(
  dataProvider: ResolvedDataProvider<R>,
): Mutation<R> {
  const { mutate, isPending } = useMutation({
    async mutationFn(data: any) {
      invariant(dataProvider.createOne, "createOne not implemented");
      await dataProvider.createOne(data);
    },
  });

  return React.useMemo(
    () => ({
      pending: isPending,
      mutate,
    }),
    [isPending, mutate],
  );
}

export function useUpdateOne<R extends Datum>(
  dataProvider: ResolvedDataProvider<R>,
  id: string,
): Mutation<R> {
  const { mutate, isPending } = useMutation({
    async mutationFn(data: any) {
      invariant(dataProvider.updateOne, "updateOne not implemented");
      await dataProvider.updateOne(id, data);
    },
  });

  return React.useMemo(
    () => ({
      pending: isPending,
      mutate,
    }),
    [isPending, mutate],
  );
}
