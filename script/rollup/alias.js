const path = require("path");
const resolve = (p) => path.resolve(process.cwd(), p);

module.exports = {
  vue: resolve("src/platforms/web/entry-runtime-with-compiler"),
  compiler: resolve("src/compiler"),
  core: resolve("src/core"),
  shared: resolve("src/shared"),
  web: resolve("src/platforms/web"),
};
