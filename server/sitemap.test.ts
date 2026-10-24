import { describe, expect, it } from "vitest";
import { generateMatrixSitemap } from "./sitemap";

describe("Matrix sitemap", () => {
  it("emits one URL for every approved Matrix series", () => {
    let body = "";
    let contentType = "";
    const response = {
      setHeader(name: string, value: string) {
        if (name.toLowerCase() === "content-type") contentType = value;
      },
      send(value: string) {
        body = value;
      },
    };

    generateMatrixSitemap({} as never, response as never);

    expect(contentType).toContain("application/xml");
    expect(body).toContain("<urlset");
    expect((body.match(/<loc>/g) ?? []).length).toBe(15);
    expect(body).toContain("/products/matrix/hypersep-c18");
  });
});
