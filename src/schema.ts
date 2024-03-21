import { z } from "@hono/zod-openapi";

export const ScreenshotOptionsSchema = z.object({
    block_cookie_canners: z.boolean().default(true).openapi({
        description: "Render clean screenshots.",
        example: false,
    }),
    viewport_width: z.coerce.number().int().min(1).default(1920).openapi({
        description: "Change the viewport width.",
        example: 1920,
    }),
    viewport_height: z.coerce.number().int().min(1).default(1080).openapi({
        description: "Change the viewport height.",
        example: 600,
    }),
    device_scale_factor: z.coerce.number().int().min(1).default(1).openapi({
        description: "Change the device scale factor.",
        example: 2,
    }),
    full_page: z.boolean().default(false).openapi({
        description: "Render the full page screenshot.",
        example: false,
    }),
});

export const ScreenshotResultSchema = z
    .object({
        screenshot_url: z.string().url(),
    })
    .openapi("Screenshot");
