const createHandler = require("../lib/adapter");
const api = require("../../api/status");

exports.handler = createHandler(api);
