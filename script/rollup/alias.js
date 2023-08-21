const path = require("path");
const resolve = (p) => path.resolve(process.cwd(), p);

module.exports = {
  web: resolve("src/platforms/web"),
};
