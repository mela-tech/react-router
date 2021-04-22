"use strict";

if (process.env.NODE_ENV === "production") {
  module.exports = require("./cjs/react-horizontal-router-config.min.js");
} else {
  module.exports = require("./cjs/react-horizontal-router-config.js");
}
