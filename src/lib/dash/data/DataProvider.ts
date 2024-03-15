import { useMutation, useQuery } from "@tanstack/react-query";
import { Filter, getKeyFromFilter, useAppliedFilter } from "../filter";
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

export interface GetManyParams<R extends Datum> {
  filter: Filter<R>;
}

export interface GetManyMethod<R extends Datum> {
  (params: GetManyParams<R>): Promise<{ rows: R[] }>;
}

export interface ResolvedField<
  R extends Datum,
  K extends ValidProp<R> = ValidProp<R>,
> {
  type: FieldType;
  label: string;
  valueFormatter?: ValueFormatter<R, K>;
}

export interface GetOneMethod<R extends Datum> {
  (id: ValidId): Promise<R | null>;
}

export interface CreateOneMethod<R extends Datum> {
  (data: R): Promise<R>;
}

export interface UpdateOneMethod<R extends Datum> {
  (id: ValidId, data: R): Promise<R>;
}

export interface DeleteOneMethod {
  (id: ValidId): Promise<void>;
}

export interface DataProviderDefinition<R extends Datum> {
  getMany: GetManyMethod<R>;
  getOne?: GetOneMethod<R>;
  createOne?: CreateOneMethod<R>;
  updateOne?: UpdateOneMethod<R>;
  deleteOne?: DeleteOneMethod;
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
  getMany: GetManyMethod<R>;
  getOne?: GetOneMethod<R>;
  createOne?: CreateOneMethod<R>;
  updateOne?: UpdateOneMethod<R>;
  deleteOne?: DeleteOneMethod;
  fields: resolvedFields<R>;
}

export function createDataProvider<R extends Datum>(
  input: DataProviderDefinition<R> | GetManyMethod<R>,
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

export interface Mutation<F extends (...args: any[]) => Promise<any>> {
  pending: boolean;
  error: Error | null;
  mutate: F;
  reset: () => void;
}

export function useCreateOne<R extends Datum>(
  dataProvider: ResolvedDataProvider<R>,
): Mutation<CreateOneMethod<R>> {
  const { mutateAsync, isPending, error, reset } = useMutation({
    async mutationFn(data: R) {
      invariant(dataProvider.createOne, "createOne not implemented");
      return dataProvider.createOne(data);
    },
  });

  return React.useMemo(
    () => ({
      pending: isPending,
      error,
      mutate: mutateAsync,
      reset,
    }),
    [isPending, error, mutateAsync, reset],
  );
}

export function useUpdateOne<R extends Datum>(
  dataProvider: ResolvedDataProvider<R>,
): Mutation<UpdateOneMethod<R>> {
  const { mutateAsync, error, isPending, reset } = useMutation({
    async mutationFn([id, data]: [ValidId, R]) {
      invariant(dataProvider.updateOne, "updateOne not implemented");
      return dataProvider.updateOne(id, data);
    },
  });

  const mutate = React.useCallback(
    (id: ValidId, data: R) => {
      return mutateAsync([id, data]);
    },
    [mutateAsync],
  );

  return React.useMemo(
    () => ({
      pending: isPending,
      error,
      mutate,
      reset,
    }),
    [isPending, error, mutate, reset],
  );
}

export function useDeleteOne<R extends Datum>(
  dataProvider: ResolvedDataProvider<R>,
): Mutation<DeleteOneMethod> {
  const { mutateAsync, error, isPending, reset } = useMutation({
    async mutationFn(id: ValidId) {
      invariant(dataProvider.deleteOne, "deleteOne not implemented");
      return dataProvider.deleteOne(id);
    },
  });

  return React.useMemo(
    () => ({
      pending: isPending,
      error,
      mutate: mutateAsync,
      reset,
    }),
    [isPending, error, mutateAsync, reset],
  );
}
