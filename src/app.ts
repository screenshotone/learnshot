import { OpenAPIHono } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";

import { ScreenshotOptionsSchema, ScreenshotResultSchema } from "./schema";
import { render } from "./screenshots";

const app = new OpenAPIHono();

app.openapi(
    createRoute({
        method: "get",
        path: "/screenshot",
        request: {
            query: ScreenshotOptionsSchema,
        },
        responses: {
            200: {
                content: {
                    "application/json": {
                        schema: ScreenshotResultSchema,
                    },
                },
                description: "Render a Screenshot",
            },
        },
    }),
    async (c) => {
        const screenshotOptions = c.req.valid("query");

        const result = await render(screenshotOptions);

        return c.json({ screenshot_url: result.url });
    }
);

app.doc("/openapi.json", {
    openapi: "3.0.0",
    info: {
        version: "1.0.0",
        title: "The Screenshot API",
    },
});

export default app;
