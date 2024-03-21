import { OpenAPIHono } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";

import { ScreenshotOptionsSchema, ScreenshotResultSchema } from "./schema";

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
    (c) => {
        const screenshotOptions = c.req.valid("query");
        console.log(screenshotOptions);
        // Output:
        // {
        //     "block_cookie_canners": true,
        //     "viewport_width": 1920,
        //     "viewport_height": 1080,
        //     "device_scale_factor": 1,
        //     "full_page": false
        // }

        const screenshotUrl = "https://example.com";

        return c.json({ screenshot_url: screenshotUrl });

        // For http://localhost:3000/screenshot, it returns:
        // {"screenshot_url":"https://example.com"}
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
