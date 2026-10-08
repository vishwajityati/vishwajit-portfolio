export async function apiRequest(path: string, options: RequestInit = {}): Promise<Response> {
  const response = await fetch(path, {
    ...options,
    credentials: "same-origin",
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...options.headers }
  });

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message = typeof body === "object" && body !== null && "error" in body && typeof body.error === "string"
      ? body.error
      : `Request failed (${response.status}).`;
    throw new Error(message);
  }
  return response;
}

export async function apiJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await apiRequest(path, options);
  if (response.status === 204) throw new Error("The server returned no response data.");
  return response.json() as Promise<T>;
}
