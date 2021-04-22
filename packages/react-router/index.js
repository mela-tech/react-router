"use strict";

if (process.env.NODE_ENV === "production") {
  module.exports = require("./cjs/react-horizontal-router.min.js");
} else {
  module.exports = require("./cjs/react-horizontal-router.js");
}
