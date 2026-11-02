const createHandler = require("../lib/adapter");
const api = require("../../api/sync");

exports.handler = createHandler(api);
