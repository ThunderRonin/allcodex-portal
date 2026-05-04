import { test } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const STORAGE_STATE_PATH = path.resolve(
  __dirname,
  ".auth/storage-state.json"
);

/**
 * Call at the top of every integration spec.
 * Skips the test when:
 *  - TEST_OPENROUTER_API_KEY is absent (no AI key → no live calls)
 *  - storageState.json doesn't exist (global-setup didn't run / failed)
 */
export function requireIntegrationEnv() {
  test.skip(
    !process.env.TEST_OPENROUTER_API_KEY,
    "Skipped: TEST_OPENROUTER_API_KEY not set"
  );
  test.skip(
    !fs.existsSync(STORAGE_STATE_PATH),
    "Skipped: storage-state.json not found — run globalSetup first"
  );
}
