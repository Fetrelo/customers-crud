import type {
  Customer,
  CustomersListQuery,
  CustomersListResponse,
  Employee,
  EmployeesListQuery,
  EmployeesListResponse,
} from "./types";

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
  if (query.company != null && query.company.trim() !== "") {
    const t = query.company.trim();
    if ([...t].length >= 3) {
      p.set("company", t);
    }
  }
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

function normalizeEmployeesPayload(payload: unknown): EmployeesListResponse {
  if (Array.isArray(payload)) {
    const employees = payload as Employee[];
    return {
      employees,
      total: employees.length,
      page: 1,
      per_page: employees.length || 10,
      sort: "LastName",
      dir: "asc",
    };
  }
  if (payload != null && typeof payload === "object") {
    const o = payload as Record<string, unknown>;
    const raw = o.employees;
    const employees = Array.isArray(raw) ? (raw as Employee[]) : [];
    const total = typeof o.total === "number" ? o.total : employees.length;
    return {
      employees,
      total,
      page: typeof o.page === "number" ? o.page : 1,
      per_page: typeof o.per_page === "number" ? o.per_page : 10,
      sort: typeof o.sort === "string" ? o.sort : "LastName",
      dir: typeof o.dir === "string" ? o.dir : "asc",
    };
  }
  return {
    employees: [],
    total: 0,
    page: 1,
    per_page: 10,
    sort: "LastName",
    dir: "asc",
  };
}

export async function fetchEmployees(
  query: EmployeesListQuery = {},
): Promise<EmployeesListResponse> {
  const p = new URLSearchParams();
  if (query.page != null) p.set("page", String(query.page));
  if (query.perPage != null) p.set("per_page", String(query.perPage));
  if (query.sort != null && query.sort !== "") p.set("sort", query.sort);
  if (query.dir != null) p.set("dir", query.dir);
  if (query.name != null && query.name.trim() !== "") {
    const t = query.name.trim();
    if ([...t].length >= 3) {
      p.set("name", t);
    }
  }
  const qs = p.toString();
  const url = `${apiBase()}/employees${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(await res.text());
  const payload: unknown = await res.json();
  return normalizeEmployeesPayload(payload);
}

function employeeJsonBody(e: Employee): Record<string, unknown> {
  return {
    EmployeeID: e.EmployeeID ?? null,
    LastName: nullIfEmpty(e.LastName),
    FirstName: nullIfEmpty(e.FirstName),
    Title: nullIfEmpty(e.Title),
    TitleOfCourtesy: nullIfEmpty(e.TitleOfCourtesy),
    BirthDate: nullIfEmpty(e.BirthDate),
    HireDate: nullIfEmpty(e.HireDate),
    Address: nullIfEmpty(e.Address),
    City: nullIfEmpty(e.City),
    Region: nullIfEmpty(e.Region),
    PostalCode: nullIfEmpty(e.PostalCode),
    Country: nullIfEmpty(e.Country),
    HomePhone: nullIfEmpty(e.HomePhone),
    Extension: nullIfEmpty(e.Extension),
    Notes: nullIfEmpty(e.Notes),
    ReportsTo: e.ReportsTo == null || Number.isNaN(e.ReportsTo) ? null : e.ReportsTo,
    PhotoPath: nullIfEmpty(e.PhotoPath),
  };
}

export async function createEmployee(e: Employee): Promise<Employee> {
  const body = { ...employeeJsonBody(e) };
  delete body.EmployeeID;
  const res = await fetch(`${apiBase()}/employees`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<Employee>;
}

export async function updateEmployee(id: number, e: Employee): Promise<Employee> {
  const res = await fetch(`${apiBase()}/employees/${encodeURIComponent(String(id))}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(employeeJsonBody({ ...e, EmployeeID: id })),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<Employee>;
}

export async function deleteEmployee(id: number): Promise<void> {
  const res = await fetch(`${apiBase()}/employees/${encodeURIComponent(String(id))}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(await res.text());
}
