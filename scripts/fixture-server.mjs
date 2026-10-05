import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
const html = await readFile(new URL("../tests/fixture.html", import.meta.url));
createServer((request, response) => {
  if (request.url === "/blocked") {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }
  if (request.url === "/empty") {
    response.writeHead(200, { "Content-Type": "text/html" });
    response.end(
      '<!doctype html><html><body style="display:none"></body></html>',
    );
    return;
  }
  response.writeHead(200, { "Content-Type": "text/html" });
  response.end(html);
}).listen(3987, "127.0.0.1", () =>
  console.log("Fixture: http://127.0.0.1:3987"),
);
