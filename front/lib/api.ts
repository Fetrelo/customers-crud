import type { Customer, CustomersListQuery, CustomersListResponse } from "./types";

export function apiBase(): string {
  return process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8001";
}

function normalizeCustomersPayload(payload: unknown): CustomersListResponse {
  if (Array.isArray(payload)) {
    const customers = payload as Customer[];
    return {
      customers,
      total: customers.length,
      page: 1,
      per_page: customers.length || 10,
      sort: "CompanyName",
      dir: "asc",
    };
  }
  if (payload != null && typeof payload === "object") {
    const o = payload as Record<string, unknown>;
    const raw = o.customers;
    const customers = Array.isArray(raw) ? (raw as Customer[]) : [];
    const total = typeof o.total === "number" ? o.total : customers.length;
    return {
      customers,
      total,
      page: typeof o.page === "number" ? o.page : 1,
      per_page: typeof o.per_page === "number" ? o.per_page : 10,
      sort: typeof o.sort === "string" ? o.sort : "CompanyName",
      dir: typeof o.dir === "string" ? o.dir : "asc",
    };
  }
  return {
    customers: [],
    total: 0,
    page: 1,
    per_page: 10,
    sort: "CompanyName",
    dir: "asc",
  };
}

export async function fetchCustomers(
  query: CustomersListQuery = {},
): Promise<CustomersListResponse> {
  const p = new URLSearchParams();
  if (query.page != null) p.set("page", String(query.page));
  if (query.perPage != null) p.set("per_page", String(query.perPage));
  if (query.sort != null && query.sort !== "") p.set("sort", query.sort);
  if (query.dir != null) p.set("dir", query.dir);
  const qs = p.toString();
  const url = `${apiBase()}/customers${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(await res.text());
  const payload: unknown = await res.json();
  return normalizeCustomersPayload(payload);
}

function jsonBody(c: Customer): Record<string, unknown> {
  const body: Record<string, unknown> = {
    CustomerID: c.CustomerID,
    CompanyName: nullIfEmpty(c.CompanyName),
    ContactName: nullIfEmpty(c.ContactName),
    ContactTitle: nullIfEmpty(c.ContactTitle),
    Address: nullIfEmpty(c.Address),
    City: nullIfEmpty(c.City),
    Region: nullIfEmpty(c.Region),
    PostalCode: nullIfEmpty(c.PostalCode),
    Country: nullIfEmpty(c.Country),
    Phone: nullIfEmpty(c.Phone),
    Fax: nullIfEmpty(c.Fax),
  };
  return body;
}

function nullIfEmpty(v: string | null | undefined): string | null {
  if (v == null || v === "") return null;
  return v;
}

export async function createCustomer(c: Customer): Promise<Customer> {
  const res = await fetch(`${apiBase()}/customers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(jsonBody(c)),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<Customer>;
}

export async function updateCustomer(id: string, c: Customer): Promise<Customer> {
  const res = await fetch(`${apiBase()}/customers/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(jsonBody({ ...c, CustomerID: id })),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<Customer>;
}

export async function deleteCustomer(id: string): Promise<void> {
  const res = await fetch(`${apiBase()}/customers/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(await res.text());
}
