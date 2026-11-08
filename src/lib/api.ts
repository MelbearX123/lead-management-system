export async function sendJson(path: string, method: string, data?: unknown) {
  return check(
    await fetch(path, {
      method,
      headers: { "content-type": "application/json" },
      body: data === undefined ? undefined : JSON.stringify(data),
    }),
  );
}

export async function sendForm(path: string, form: FormData) {
  return check(await fetch(path, { method: "POST", body: form }));
}

async function check(response: Response) {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Something went wrong");
  }
  return response;
}
