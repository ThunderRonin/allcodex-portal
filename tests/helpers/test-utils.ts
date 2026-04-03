import { expect, type Page } from "@playwright/test";

export function attachConsoleErrorCollector(page: Page) {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });

  return errors;
}

export async function expectNoConsoleErrors(errors: string[]) {
  await expect(errors.filter((error) => !error.includes("favicon"))).toHaveLength(0);
}