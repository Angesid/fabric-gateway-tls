import { t } from "elysia";
import type { ElysiaSetup } from "@setup";
import { invokeGateway, queryGateway } from "@services/gateway";
import { CONTRACT } from "@config";

export default (app: ElysiaSetup) =>
  app
    .post(
      "/query",
      async ({ gateway, body: { func, args } }) => {
        return await queryGateway(
          gateway,
          CONTRACT.channel,
          CONTRACT.name,
          func,
          args
        );
      },
      {
        body: t.Object(
          {
            func: t.String({ description: "Contract function to query" }),
            args: t.Array(t.String(), {
              description: "Contract function argumens",
            }),
          },
          { error: "Invalid body arguments" }
        ),
      }
    )
    .post(
      "/invoke",
      async ({ gateway, body: { func, args } }) => {
        return await invokeGateway(
          gateway,
          CONTRACT.channel,
          CONTRACT.name,
          func,
          args
        );
      },
      {
        body: t.Object(
          {
            func: t.String({ description: "Contract function to invoke" }),
            args: t.Array(t.String(), {
              description: "Contract function argumens",
            }),
          },
          { error: "Invalid body arguments" }
        ),
      }
    );
