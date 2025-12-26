export function resolveAdminApiBaseUrl(env) {
    const e = env ?? globalThis?.process?.env ?? {};
    const baseUrl = (typeof e.ADMIN_API_INTERNAL_URL === "string" && e.ADMIN_API_INTERNAL_URL.trim()) ||
        (typeof e.NEXT_PUBLIC_ADMIN_API_BASE_URL === "string" && e.NEXT_PUBLIC_ADMIN_API_BASE_URL.trim()) ||
        "";
    if (!baseUrl) {
        throw new Error("admin-api baseUrl missing (set ADMIN_API_INTERNAL_URL or NEXT_PUBLIC_ADMIN_API_BASE_URL)");
    }
    return baseUrl;
}
function isLoopbackHostname(hostname) {
    const h = hostname.toLowerCase();
    return h === "localhost" || h === "127.0.0.1" || h === "::1";
}
function assertNoLoopbackInProd(baseUrl) {
    const nodeEnv = globalThis?.process?.env?.NODE_ENV;
    if (nodeEnv !== "production")
        return;
    if (baseUrl.startsWith("/"))
        return;
    try {
        const url = new URL(baseUrl);
        if (isLoopbackHostname(url.hostname))
            throw new Error("loopback baseUrl forbidden in production");
    }
    catch {
        throw new Error("invalid admin-api baseUrl");
    }
}
async function fetchJson(client, path, init) {
    assertNoLoopbackInProd(client.baseUrl);
    const fetcher = client.fetchImpl ?? fetch;
    const normalizedPath = `/${path.replace(/^\//, "")}`;
    const baseUrl = client.baseUrl.replace(/\/+$/, "");
    const target = baseUrl.startsWith("/")
        ? `${baseUrl}${normalizedPath}`
        : new URL(normalizedPath.replace(/^\//, ""), `${baseUrl}/`).toString();
    const headers = new Headers(init?.headers);
    for (const [k, v] of Object.entries(client.defaultHeaders ?? {})) {
        if (!headers.has(k))
            headers.set(k, v);
    }
    if (!headers.has("accept"))
        headers.set("accept", "application/json");
    const res = await fetcher(target, { ...init, headers });
    const resHeaders = res.headers;
    let body = null;
    try {
        body = await res.json();
    }
    catch {
        body = null;
    }
    if (!res.ok) {
        return { ok: false, status: res.status, error: body ?? res.statusText, headers: resHeaders };
    }
    return { ok: true, status: res.status, data: body, headers: resHeaders };
}
function mergeDeep(target, patch) {
    if (!patch || typeof patch !== "object" || Array.isArray(patch))
        return target;
    if (!target || typeof target !== "object" || Array.isArray(target))
        return { ...patch };
    const out = { ...target };
    for (const [k, v] of Object.entries(patch)) {
        if (v && typeof v === "object" && !Array.isArray(v)) {
            out[k] = mergeDeep(out[k], v);
        }
        else if (v !== undefined) {
            out[k] = v;
        }
    }
    return out;
}
export function createAdminApiClient(client) {
    return {
        getUserSettings(userId) {
            return fetchJson(client, `/api/settings/user/${encodeURIComponent(userId)}`, { method: "GET" });
        },
        setUserSettings(userId, settings) {
            return fetchJson(client, `/api/settings/user/${encodeURIComponent(userId)}`, {
                method: "PUT",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(settings),
            });
        },
        async patchUserSettings(userId, patch) {
            const current = await fetchJson(client, `/api/settings/user/${encodeURIComponent(userId)}`, { method: "GET" });
            if (!current.ok)
                return current;
            const next = mergeDeep(current.data.settings, patch);
            return fetchJson(client, `/api/settings/user/${encodeURIComponent(userId)}`, {
                method: "PUT",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(next),
            });
        },
        getGuildSettings(guildId) {
            return fetchJson(client, `/api/settings/guild/${encodeURIComponent(guildId)}`, { method: "GET" });
        },
        setGuildSettings(guildId, settings) {
            return fetchJson(client, `/api/settings/guild/${encodeURIComponent(guildId)}`, {
                method: "PUT",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(settings),
            });
        },
        async patchGuildSettings(guildId, patch) {
            const current = await fetchJson(client, `/api/settings/guild/${encodeURIComponent(guildId)}`, { method: "GET" });
            if (!current.ok)
                return current;
            const next = mergeDeep(current.data.settings, patch);
            return fetchJson(client, `/api/settings/guild/${encodeURIComponent(guildId)}`, {
                method: "PUT",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(next),
            });
        },
        listMemory(scopeType, scopeId, opts) {
            const qs = opts?.kind ? `?kind=${encodeURIComponent(opts.kind)}` : "";
            return fetchJson(client, `/api/memory/${encodeURIComponent(scopeType)}/${encodeURIComponent(scopeId)}${qs}`, { method: "GET" });
        },
        writeMemory(input) {
            return fetchJson(client, `/api/memory/${encodeURIComponent(input.scopeType)}/${encodeURIComponent(input.scopeId)}`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ kind: input.kind, source: input.source, content: input.content }),
            });
        },
    };
}
export function createAdminApiClientFromEnv(opts) {
    return createAdminApiClient({
        baseUrl: resolveAdminApiBaseUrl(opts?.env),
        fetchImpl: opts?.fetchImpl,
        defaultHeaders: opts?.defaultHeaders,
    });
}
