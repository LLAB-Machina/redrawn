/** @type {import('@rtk-query/codegen-openapi').ConfigFile} */
module.exports = {
  schemaFile: "../api/openapi.json",
  apiFile: "./src/services/emptyApi.ts",
  apiImport: "emptySplitApi",
  outputFile: "./src/services/genApi.ts",
  exportName: "api",
  hooks: {
    queries: true,
    lazyQueries: true,
    mutations: true,
  },
  tag: true,
  flattenArg: true,
};
