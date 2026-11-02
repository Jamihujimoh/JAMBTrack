const createHandler = require("../lib/adapter");
const api = require("../../api/access");

exports.handler = createHandler(api);
