import { ScreenshotOptions } from "./schema";

import puppeteer, { Page } from "puppeteer";
import { PuppeteerBlocker } from "@cliqz/adblocker-puppeteer";
import fetch from "cross-fetch";

import {
    CompleteMultipartUploadCommandOutput,
    S3Client,
    S3ClientConfig,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

let blocker: PuppeteerBlocker | null = null;
async function blockCookieBanners(page: Page) {
    if (!blocker) {
        blocker = await PuppeteerBlocker.fromLists(fetch, [
            // the list of the cookie banners to block from the https://easylist.to/ website
            "https://secure.fanboy.co.nz/fanboy-cookiemonster.txt",
        ]);
    }

    await blocker.enableBlockingInPage(page);
}

async function scroll(page: Page) {
    return await page.evaluate(async () => {
        return await new Promise((resolve, reject) => {
            var i = setInterval(() => {
                window.scrollBy(0, window.innerHeight);
                if (
                    document.scrollingElement &&
                    document.scrollingElement.scrollTop + window.innerHeight >=
                        document.scrollingElement.scrollHeight
                ) {
                    window.scrollTo(0, 0);
                    clearInterval(i);
                    resolve(null);
                }
            }, 100);
        });
    });
}

const cfg: S3ClientConfig = {
    region: process.env.S3_REGION ?? "us-west-2",
    maxAttempts: 5,
    retryMode: "standard",
    credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID ?? "test",
        secretAccessKey: process.env.SECRET_ACCESS_KEY ?? "test",
    },
    endpoint: process.env.S3_ENDPOINT ?? "http://localhost:4566",
    forcePathStyle: true,
};

const client = new S3Client(cfg);

export async function uploadToS3Storage(
    screenshot: Buffer,
    key: string,
    contentType: string
) {
    const bucket = "screenshots";

    const upload = new Upload({
        client: client,
        params: {
            Bucket: bucket,
            Key: key,
            Body: screenshot,
            ContentType: contentType,
            StorageClass: "STANDARD",
        },
        queueSize: 4,
        partSize: 1024 * 1024 * 5,
        leavePartsOnError: false,
    });

    const result: CompleteMultipartUploadCommandOutput = await upload.done();
    if (!result.Location) {
        throw new Error("Failed to upload");
    }

    return result.Location;
}

export async function render(
    options: ScreenshotOptions
): Promise<{ url: string }> {
    const browser = await puppeteer.launch({
        args: [
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--single-process",
            "--disable-gpu",
        ],
        headless: true,
    });

    const page = await browser.newPage();

    if (options.block_cookie_canners) {
        await blockCookieBanners(page);
    }

    await page.setViewport({
        width: options.viewport_width,
        height: options.viewport_height,
        deviceScaleFactor: options.device_scale_factor,
    });

    await page.goto(options.url);

    if (options.full_page) {
        await scroll(page);
    }

    const screenshot = await page.screenshot({
        type: "jpeg",
        encoding: "binary",
        fullPage: options.full_page,
    });

    await browser.close();

    const location = await uploadToS3Storage(
        screenshot,
        "example.jpeg",
        "image/jpeg"
    );

    return { url: location };
}
