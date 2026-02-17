// Lightweight mock for next/server used in API route tests

export class NextRequest {
  url: string;
  method: string;
  private _body: string;
  headers: Headers;

  constructor(url: string, init?: RequestInit) {
    this.url = url;
    this.method = (init?.method ?? 'GET').toUpperCase();
    this._body = typeof init?.body === 'string' ? init.body : '';
    this.headers = new Headers((init?.headers as HeadersInit) ?? {});
    // Attach nextUrl for query param access
    Object.defineProperty(this, 'nextUrl', {
      get: () => new URL(url),
    });
  }

  async json() {
    return JSON.parse(this._body);
  }
}

class MockResponse {
  status: number;
  private _body: unknown;

  constructor(body: unknown, init?: ResponseInit) {
    this._body = body;
    this.status = init?.status ?? 200;
  }

  async json() {
    return typeof this._body === 'string' ? JSON.parse(this._body) : this._body;
  }
}

export const NextResponse = {
  json: (data: unknown, init?: ResponseInit) =>
    new MockResponse(data, init) as unknown as Response,
};
