type SchemaNode<V> = V extends any[]
  ? {
      kind: "array";
      items: SchemaNode<V[0]>;
    }
  : V extends object
    ? {
        kind: "object";
        properties: {
          [K in keyof V]: SchemaNode<V[K]>;
        };
      }
    : {
        kind: "ref";
      };

type InferType<S extends SchemaNode<any>> = S extends { kind: "array" }
  ? InferType<S["items"]>[]
  : S extends { kind: "object" }
    ? { [K in keyof S["properties"]]: InferType<S["properties"][K]> }
    : S extends { kind: "record" }
      ? Record<string, InferType<S["items"]>>
      : S extends { kind: "ref" }
        ? any
        : never;

type ExtractType<
  S extends SchemaNode<any>,
  V extends InferType<S>,
> = S extends {
  kind: "array";
}
  ? ExtractType<S["items"], V[number]>[]
  : S extends { kind: "object" }
    ? { [K in keyof S["properties"]]: ExtractType<S["properties"][K], V[K]> }
    : S extends { kind: "record" }
      ? Record<string, ExtractType<S["items"], V[keyof V]>>
      : S extends { kind: "ref" }
        ? V
        : never;

function getStable<S extends SchemaNode<any>, V extends InferType<S>>(
  schema: S,
  value: V,
): ExtractType<S, V> {}

function createSchema<S extends SchemaNode<any>>(input: S): S {
  return input;
}

const schema = createSchema({
  kind: "array",
  items: {
    kind: "object",
    properties: {
      foo: {
        kind: "ref",
      },
    },
  },
});

const x = getStable(schema, [
  {
    foo: [{ bar: 1 }],
    djkehksfdj: 123,
  },
]);
