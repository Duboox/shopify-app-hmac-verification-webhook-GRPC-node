crypto = require("crypto");
// ENV
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET;

const getParamsFromUrl = (urlString) => {
  const url = new URL(urlString);
  const searchParams = new URLSearchParams(url.search);
  const params = {};

  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }
  return params;
};

module.exports = async (req, res) => {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
  });
  req.on("end", () => {
    if (req.headers["content-type"] === "application/x-www-form-urlencoded") {
      body = querystring.parse(body);
    } else if (req.headers["content-type"] === "application/json") {
      body = JSON.parse(body);
    }

    //Params
    const params = getParamsFromUrl("https://logoscorp.com" + req.url);
    console.log("params", params);
    console.log("req Body", body);
    console.log("req headers", req.headers);

    if (!body) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.write(JSON.stringify({ status: "Unauthorized", message: "No body received" }));
      return res.end();
    }

    const shopifyHmac = req.headers["x-shopify-hmac-sha256"];
    if (!shopifyHmac) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.write(JSON.stringify({ status: "Unauthorized", message: "HMAC header missing" }));
      return res.end();
    }

    const genHash = crypto.createHmac("sha256", SHOPIFY_API_SECRET).update(JSON.stringify(body)).digest("base64");

    console.log('genHash', genHash);
    
    if (genHash !== shopifyHmac) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.write(JSON.stringify({ status: "Unauthorized", message: "Couldn't verify incoming Webhook request!" }));
      return res.end();
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.write(JSON.stringify({ status: "Ok", message: "processed successfully." }));
    return res.end();
  });
};
