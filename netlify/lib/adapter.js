module.exports = function createHandler(apiHandler) {
  return async function(event) {
    const headers = {};
    let statusCode = 200;
    let responseBody = "";

    const req = {
      method: event.httpMethod || "GET",
      headers: Object.fromEntries(
        Object.entries(event.headers || {}).map(
          ([k, v]) => [k.toLowerCase(), v]
        )
      ),
      body: event.body
        ? (event.isBase64Encoded
            ? Buffer.from(event.body, "base64").toString()
            : event.body)
        : undefined
    };

    if (typeof req.body === "string") {
      try {
        req.body = JSON.parse(req.body);
      } catch {}
    }

    const res = {
      setHeader(name, value) {
        headers[name] = value;
      },
      status(code) {
        statusCode = code;
        return this;
      },
      json(value) {
        responseBody = JSON.stringify(value);
        return this;
      }
    };

    try {
      await apiHandler(req, res);

      return {
        statusCode,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
          ...headers
        },
        body: responseBody
      };
    } catch (error) {
      console.error(error);
      return {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
        },
        body: JSON.stringify({error: "Internal server error."})
      };
    }
  };
};
