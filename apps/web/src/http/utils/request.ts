type QueueItem = {
  resolve: () => void;
  reject: (err: Error) => void;
};

let isRefreshing = false;
let queue: QueueItem[] = [];

function processQueue(error: Error | null) {
  queue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });

  queue = [];
}

async function doRefresh(): Promise<void> {
  const response = await fetch("/api/auth/refresh", { method: "POST" });

  if (!response.ok) {
    throw new Error("Sessão expirada");
  }
}

export async function request(
  path: string,
  options?: RequestInit,
): Promise<Response> {
  const proxyPath = path.startsWith("/") ? path : `/${path}`;
  const url = `/api/proxy${proxyPath}`;

  const response = await fetch(url, options);

  if (response.status !== 401) return response;

  if (isRefreshing) {
    await new Promise<void>((resolve, reject) => {
      queue.push({ resolve, reject });
    });
    return fetch(url, options);
  }

  isRefreshing = true;

  try {
    await doRefresh();
    processQueue(null);

    return fetch(url, options);
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Erro desconhecido");
    processQueue(error);

    if (typeof window !== "undefined") {
      window.location.href = "/map";
    }
    throw error;
  } finally {
    isRefreshing = false;
  }
}
