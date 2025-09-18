import Elysia from "elysia";
import swagger from "@elysiajs/swagger";
import { createLogger } from "@plugins/logger";
import { createGateway } from "@services/gateway";
import { GLOBAL } from "@config";

export const server = new Elysia()
  // _________________________
  //
  // ## Context Decorators
  //
  // ‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
  // Method Decorator (Logger)
  .decorate("logger", createLogger())
  // _________________________
  // ‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
  // Method Decorator (Gateway)
  .decorate("gateway", await createGateway())
  // _________________________
  //
  // ## Lifecycle Hooks
  //
  // ‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
  // Lifecycle Hook [Error]
  .onError(({ code, set, path, logger }) => {
    if (code === "NOT_FOUND") {
      set.status = 404;
      const message = "404 Error: API not found";
      logger.log("error", `${message} for path: ${path}`);
      return { success: false, message };
    }
  })
  // _________________________
  // ‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
  // Lifecycle Hook [Request] [*DEV*]
  .onRequest(({ request, logger }) => {
    logger.debug(`[${request.method}] ${request.url}`);
  });
// _________________________
//
// ## Plugin Injections
//
// ‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
// Plugin Injection (Swagger)
if (GLOBAL.env === "development")
  server
    .use(swagger({ path: "/docs" }))
    .get("/", () => "Hello from Fabric Gateway");
// _________________________

export type ElysiaSetup = typeof server;
