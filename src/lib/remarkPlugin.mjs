import path from "path";

/**
 *
 * @param {string} localName
 * @param {string} importSpec
 * @returns {import('unist').Node}
 */
function createImportNode(localName, importSpec) {
  return {
    type: "mdxjsEsm",
    value: "import * as __connection from './connections';",
    data: {
      estree: {
        type: "Program",
        body: [
          {
            type: "ImportDeclaration",
            specifiers: [
              {
                type: "ImportNamespaceSpecifier",
                local: {
                  type: "Identifier",
                  name: localName,
                },
              },
            ],
            source: {
              type: "Literal",
              value: importSpec,
            },
          },
        ],
        sourceType: "module",
        comments: [],
      },
    },
  };
}

/**
 *
 * @param {string} varName
 * @param {string} connectionsLocalName
 * @param {string} connectionName
 * @param {string} query
 * @returns {import('unist').Node}
 */
function createDataSourceNode(
  varName,
  connectionsLocalName,
  connectionName,
  query
) {
  const createDataSourceMethod = "createDataSource";
  return {
    type: "mdxjsEsm",
    value: "",
    data: {
      estree: {
        type: "Program",
        body: [
          {
            type: "ExportNamedDeclaration",
            declaration: {
              type: "VariableDeclaration",
              declarations: [
                {
                  type: "VariableDeclarator",
                  id: {
                    type: "Identifier",
                    name: varName,
                  },
                  init: {
                    type: "CallExpression",
                    callee: {
                      type: "MemberExpression",
                      object: {
                        type: "MemberExpression",
                        object: {
                          type: "Identifier",
                          name: connectionsLocalName,
                        },
                        property: {
                          type: "Identifier",
                          name: connectionName,
                        },
                        computed: false,
                        optional: false,
                      },
                      property: {
                        type: "Identifier",
                        name: createDataSourceMethod,
                      },
                      computed: false,
                      optional: false,
                    },
                    arguments: [
                      {
                        type: "Literal",
                        value: query,
                      },
                    ],
                    optional: false,
                  },
                },
              ],
              kind: "const",
            },
            specifiers: [],
            source: null,
          },
        ],
        sourceType: "module",
        comments: [],
      },
    },
  };
}

/**
 *
 * @param {string} importPath
 * @returns {string}
 */
function toPosixPath(importPath) {
  return path.normalize(importPath).split(path.sep).join(path.posix.sep);
}

/**
 *
 * @param {string} importPath
 * @returns {string}
 */
function pathToNodeImportSpecifier(importPath) {
  const normalized = toPosixPath(importPath);
  return normalized.startsWith("/") || normalized.startsWith(".")
    ? normalized
    : `./${normalized}`;
}

/**
 * @param {{
 *   connectionsFile: string;
 * }} param0
 * @type {import('unified').Plugin}
 */
export default function remarkPlugin({ connectionsFile }) {
  return (tree, file) => {
    const connectionsLocalName = "__connections";

    const relativeConnectionsPath = path.relative(
      path.dirname(file.path),
      connectionsFile
    );

    const connectionsImportSpec = pathToNodeImportSpecifier(
      relativeConnectionsPath
    );

    const importNode = createImportNode(
      connectionsLocalName,
      connectionsImportSpec
    );

    const withDataSources = tree.children.flatMap((node) => {
      if (node.type === "code") {
        const [varName, ...rest] = node.meta.trim().split(/ +/);
        const props = Object.fromEntries(
          rest.map((pair) => pair.split(":").map((value) => value.trim()))
        );
        return [
          createDataSourceNode(
            varName,
            connectionsLocalName,
            props.connection,
            node.value
          ),
        ];
      }
      return [node];
    });

    return {
      ...tree,
      children: [importNode, ...withDataSources],
    };
  };
}
