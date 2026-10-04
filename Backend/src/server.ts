import { createServer } from "node:http";
import { env } from "node:process";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";

const authHandler = toNodeHandler(auth);
const authPath = "/api/auth";
const port = Number(env.PORT ?? 3000);

const server = createServer((request, response) => {
  const pathname = request.url?.split("?")[0];

  if (pathname === authPath || pathname?.startsWith(`${authPath}/`)) {
    void authHandler(request, response);
    return;
  }

  response.writeHead(404, { "Content-Type": "application/json" });
  response.end(JSON.stringify({ error: "Not found" }));
});

server.listen(port, () => {
  console.log(`Better Auth server listening on http://localhost:${port}`);
});