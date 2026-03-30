import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchWorkflows } from "../src/fetcher.js";

const validWorkflow = {
  id: "abc123",
  name: "My Workflow",
  nodes: [
    { name: "Start", type: "n8n-nodes-base.start", position: [0, 0] },
  ],
  connections: {},
};

const anotherWorkflow = {
  id: "def456",
  name: "Another Workflow",
  nodes: [
    { name: "HTTP", type: "n8n-nodes-base.httpRequest", position: [100, 0] },
  ],
  connections: { HTTP: { main: [[{ node: "HTTP", type: "main", index: 0 }]] } },
};

function makeFetchMock(status: number, body: unknown): typeof fetch {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    json: () => Promise.resolve(body),
  } as Response);
}

describe("fetchWorkflows", () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("returns parsed workflows on successful fetch", async () => {
    global.fetch = makeFetchMock(200, { data: [validWorkflow, anotherWorkflow] });

    const results = await fetchWorkflows("https://n8n.example.com", "my-api-key");

    expect(results).toHaveLength(2);
    expect(results[0].name).toBe("My Workflow");
    expect(results[0].filePath).toBe("https://n8n.example.com/workflow/abc123");
    expect(results[0].nodes).toHaveLength(1);
    expect(results[1].name).toBe("Another Workflow");
    expect(results[1].filePath).toBe("https://n8n.example.com/workflow/def456");
  });

  it("sends the correct URL and API key header", async () => {
    const mockFetch = makeFetchMock(200, { data: [validWorkflow] });
    global.fetch = mockFetch;

    await fetchWorkflows("https://n8n.example.com/", "test-key");

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = (mockFetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    // Trailing slash should be stripped, limit param added
    expect(url).toBe("https://n8n.example.com/api/v1/workflows?limit=250");
    expect((init.headers as Record<string, string>)["X-N8N-API-KEY"]).toBe("test-key");
  });

  it("throws on non-200 response", async () => {
    global.fetch = makeFetchMock(401, {});

    await expect(fetchWorkflows("https://n8n.example.com", "bad-key")).rejects.toThrow(
      "n8n API returned 401"
    );
  });

  it("throws on 500 response", async () => {
    global.fetch = makeFetchMock(500, {});

    await expect(fetchWorkflows("https://n8n.example.com", "key")).rejects.toThrow(
      "n8n API returned 500"
    );
  });

  it("throws when response body has no data array", async () => {
    global.fetch = makeFetchMock(200, { workflows: [] });

    await expect(fetchWorkflows("https://n8n.example.com", "key")).rejects.toThrow(
      "Unexpected n8n API response format"
    );
  });

  it("throws when data is not an array", async () => {
    global.fetch = makeFetchMock(200, { data: "not-an-array" });

    await expect(fetchWorkflows("https://n8n.example.com", "key")).rejects.toThrow(
      "Unexpected n8n API response format"
    );
  });

  it("skips invalid workflows and calls onWarning", async () => {
    const invalidWorkflow = { id: "bad1", name: "Bad One" }; // missing nodes/connections
    global.fetch = makeFetchMock(200, { data: [invalidWorkflow, validWorkflow] });

    const warnings: string[] = [];
    const results = await fetchWorkflows("https://n8n.example.com", "key", (msg) => {
      warnings.push(msg);
    });

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("My Workflow");
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("Bad One");
  });

  it("skips workflow with missing nodes array", async () => {
    const noNodes = { id: "x", name: "NoNodes", connections: {} };
    global.fetch = makeFetchMock(200, { data: [noNodes] });

    const warnings: string[] = [];
    const results = await fetchWorkflows("https://n8n.example.com", "key", (msg) => {
      warnings.push(msg);
    });

    expect(results).toHaveLength(0);
    expect(warnings).toHaveLength(1);
  });

  it("skips workflow with missing connections object", async () => {
    const noConnections = { id: "x", name: "NoConns", nodes: [] };
    global.fetch = makeFetchMock(200, { data: [noConnections] });

    const warnings: string[] = [];
    const results = await fetchWorkflows("https://n8n.example.com", "key", (msg) => {
      warnings.push(msg);
    });

    expect(results).toHaveLength(0);
    expect(warnings).toHaveLength(1);
  });

  it("handles empty data array", async () => {
    global.fetch = makeFetchMock(200, { data: [] });

    const results = await fetchWorkflows("https://n8n.example.com", "key");

    expect(results).toHaveLength(0);
  });

  it("uses 'unknown' as id when workflow has no id", async () => {
    const noId = { name: "NoId", nodes: [], connections: {} };
    global.fetch = makeFetchMock(200, { data: [noId] });

    const results = await fetchWorkflows("https://n8n.example.com", "key");

    expect(results).toHaveLength(1);
    expect(results[0].filePath).toBe("https://n8n.example.com/workflow/unknown");
  });

  it("works without onWarning callback (no crash)", async () => {
    const invalidWorkflow = { id: "bad1", name: "Bad" };
    global.fetch = makeFetchMock(200, { data: [invalidWorkflow] });

    // Should not throw even though there's a skipped workflow and no warning handler
    const results = await fetchWorkflows("https://n8n.example.com", "key");
    expect(results).toHaveLength(0);
  });

  it("paginates through multiple pages using nextCursor", async () => {
    const page1 = { data: [validWorkflow], nextCursor: "cursor-abc" };
    const page2 = { data: [anotherWorkflow] }; // no nextCursor = last page

    let callCount = 0;
    global.fetch = vi.fn().mockImplementation((url: string) => {
      callCount++;
      const body = callCount === 1 ? page1 : page2;
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: "OK",
        json: () => Promise.resolve(body),
      } as Response);
    });

    const results = await fetchWorkflows("https://n8n.example.com", "key");

    expect(results).toHaveLength(2);
    expect(results[0].name).toBe("My Workflow");
    expect(results[1].name).toBe("Another Workflow");

    // Verify second call includes cursor param
    const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls).toHaveLength(2);
    expect(calls[0][0]).toBe("https://n8n.example.com/api/v1/workflows?limit=250");
    expect(calls[1][0]).toBe("https://n8n.example.com/api/v1/workflows?limit=250&cursor=cursor-abc");
  });

  it("rejects non-http(s) URL schemes", async () => {
    await expect(fetchWorkflows("file:///etc/passwd", "key")).rejects.toThrow("must use http:// or https://");
    await expect(fetchWorkflows("ftp://evil.com", "key")).rejects.toThrow("must use http:// or https://");
  });
});
