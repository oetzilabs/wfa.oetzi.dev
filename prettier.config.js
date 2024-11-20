/** @type {import("@ianvs/prettier-plugin-sort-imports").PrettierConfig} */

export default {
  arrowParens: "always",
  semi: true,
  jsxSingleQuote: false,
  printWidth: 120,
  singleQuote: false,
  quoteProps: "as-needed",
  endOfLine: "lf",
  plugins: ["prettier-plugin-tailwindcss", "@ianvs/prettier-plugin-sort-imports"],
  // @ianvs/prettier-plugin-sort-imports plugin's options
  // https://github.com/IanVS/prettier-plugin-sort-imports#options
  importOrderParserPlugins: ["typescript", "jsx", "decorators-legacy"],
  importOrderTypeScriptVersion: "5.5.4",
  importOrder: ["<TYPES>^(node:)", "<TYPES>", "<TYPES>^[.]", "<BUILTIN_MODULES>", "<THIRD_PARTY_MODULES>", "^[.]"],
};
