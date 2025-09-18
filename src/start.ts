import { server } from "@setup";
import { GLOBAL } from "@config";
import gatewayRoutes from "@routes/gateway";

// ===========================
// ‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
server
  // ‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
  // Route Injection [Gateway]
  .group("/gateway", (app) => app.use(gatewayRoutes))
  // _________________________
  // ‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾

  // Start the Server (supports HTTP or HTTPS depending on GLOBAL.tlsEnabled)
  .listen(
    GLOBAL.tlsEnabled
      ? {
          port: GLOBAL.port,
          hostname: "0.0.0.0",
          // Use Bun.file to read the certificate and key. These paths are configurable via env.
          tls: {
            key: Bun.file(GLOBAL.tlsKeyPath),
            cert: Bun.file(GLOBAL.tlsCertPath)
          }
        }
      : { port: GLOBAL.port, hostname: "0.0.0.0" },
    () => {
      const proto = GLOBAL.tlsEnabled ? "https" : "http";
      server.decorator.logger.log(
        "global",
        `Gateway running on ${proto}://0.0.0.0:${GLOBAL.port}`
      );
      if (GLOBAL.env === "development")
        server.decorator.logger.log(
          "global",
          `Scalar docs running on ${proto}://0.0.0.0:${GLOBAL.port}/docs`
        );
    }
  );

// _________________________
