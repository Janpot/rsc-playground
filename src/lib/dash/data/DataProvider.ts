import { useMutation, useQuery } from "@tanstack/react-query";
import { FilterOption, getKeyFromFilter, useAppliedFilter } from "../filter";
import { getObjectKey } from "../utils";
import invariant from "invariant";
import * as React from "react";

export type ValidId = string | number;
export type ValidDatum = {
  id: ValidId;
  [key: string]: string | number | boolean | Date;
};
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
  fields: {
    [K in Exclude<keyof R & string, "id">]: FieldDef<R, K>;
  } & {
    id?: FieldDef<R, "id">;
  };
}

export type resolvedFields<R extends Datum> = {
  [K in keyof R & string]: ResolvedField<R, K>;
};

export interface ResolvedDataProvider<R extends Datum> {
  getMany: GetManyMethod;
  getOne?: (id: string) => Promise<R | null>;
  createOne?: (data: R) => Promise<R>;
  updateOne?: (id: string, data: R) => Promise<R>;
  deleteOne?: (id: string) => Promise<void>;
  fields: resolvedFields<R>;
}

export function createDataProvider<R extends Datum>(
  input: DataProviderDefinition<R> | GetManyMethod,
): ResolvedDataProvider<R> {
  if (typeof input === "function") {
    return {
      getMany: input,
      fields: { id: { label: "id", type: "string" } } as resolvedFields<R>,
    };
  }
  const fields = {
    id: { label: "id", type: "string" },
    ...Object.fromEntries(
      Object.entries(input.fields).map(([k, v]) => [
        k,
        { type: "string", label: k, ...v },
      ]),
    ),
  } as resolvedFields<R>;
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
  error: Error | null;
  mutate: (data: R) => Promise<R>;
}

export function useCreateOne<R extends Datum>(
  dataProvider: ResolvedDataProvider<R>,
): Mutation<R> {
  const { mutateAsync, isPending, error } = useMutation({
    async mutationFn(data: any) {
      invariant(dataProvider.createOne, "createOne not implemented");
      return dataProvider.createOne(data);
    },
  });

  return React.useMemo(
    () => ({
      pending: isPending,
      error,
      mutate: mutateAsync,
    }),
    [isPending, error, mutateAsync],
  );
}

export function useUpdateOne<R extends Datum>(
  dataProvider: ResolvedDataProvider<R>,
  id: string,
): Mutation<R> {
  const { mutateAsync, error, isPending } = useMutation({
    async mutationFn(data: any) {
      invariant(dataProvider.updateOne, "updateOne not implemented");
      return dataProvider.updateOne(id, data);
    },
  });

  return React.useMemo(
    () => ({
      pending: isPending,
      error,
      mutate: mutateAsync,
    }),
    [isPending, error, mutateAsync],
  );
}
