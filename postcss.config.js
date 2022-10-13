import autoprefixer from "autoprefixer";
import postcssImport from "postcss-import";
import tailwindcss from "tailwindcss";
import tailwindNesting from "@tailwindcss/nesting";

import tailwindConfig from "./tailwind.config.js";

export default {
  plugins: [postcssImport, tailwindNesting, tailwindcss(tailwindConfig), autoprefixer],
};
