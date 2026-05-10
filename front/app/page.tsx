"use client";

import { useCallback, useEffect, useState } from "react";
import {
  apiBase,
  createCustomer,
  deleteCustomer,
  fetchCustomers,
  updateCustomer,
} from "@/lib/api";
import { emptyCustomer, type Customer } from "@/lib/types";

const SORT_COLUMNS: { id: string; label: string }[] = [
  { id: "CustomerID", label: "Customer ID" },
  { id: "CompanyName", label: "Company name" },
  { id: "ContactName", label: "Contact name" },
  { id: "ContactTitle", label: "Contact title" },
  { id: "Address", label: "Address" },
  { id: "City", label: "City" },
  { id: "Region", label: "Region" },
  { id: "PostalCode", label: "Postal code" },
  { id: "Country", label: "Country" },
  { id: "Phone", label: "Phone" },
  { id: "Fax", label: "Fax" },
];

export default function Home() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortCol, setSortCol] = useState("CompanyName");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Customer>(() => emptyCustomer());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await fetchCustomers({
        page,
        perPage,
        sort: sortCol,
        dir: sortDir,
      });
      setCustomers(data.customers ?? []);
      setTotal(data.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, [page, perPage, sortCol, sortDir]);

  useEffect(() => {
    void load();
  }, [load]);

  function field<K extends keyof Customer>(key: K, value: Customer[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await updateCustomer(editingId, form);
      } else {
        await createCustomer(form);
      }
      setForm(emptyCustomer());
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm(`Delete customer ${id}?`)) return;
    setError(null);
    try {
      await deleteCustomer(id);
      if (editingId === id) {
        setEditingId(null);
        setForm(emptyCustomer());
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  function onEdit(c: Customer) {
    setEditingId(c.CustomerID);
    setForm({
      CustomerID: c.CustomerID,
      CompanyName: c.CompanyName ?? "",
      ContactName: c.ContactName ?? "",
      ContactTitle: c.ContactTitle ?? "",
      Address: c.Address ?? "",
      City: c.City ?? "",
      Region: c.Region ?? "",
      PostalCode: c.PostalCode ?? "",
      Country: c.Country ?? "",
      Phone: c.Phone ?? "",
      Fax: c.Fax ?? "",
    });
  }

  function onCancelEdit() {
    setEditingId(null);
    setForm(emptyCustomer());
  }

  const inputCls =
    "mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50";

  return (
    <div className="flex flex-1 flex-col gap-8 px-4 py-8 sm:px-8">
      <header className="flex flex-col gap-2 border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Customers
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          API: <code className="rounded bg-zinc-100 px-1 py-0.5 dark:bg-zinc-900">{apiBase()}</code>
        </p>
      </header>

      {error && (
        <div
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
          role="alert"
        >
          {error}
        </div>
      )}

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-4 text-lg font-medium text-zinc-900 dark:text-zinc-50">
          {editingId ? `Edit customer (${editingId})` : "Create customer"}
        </h2>
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Customer ID *
            <input
              className={inputCls}
              required
              disabled={!!editingId}
              value={form.CustomerID}
              onChange={(e) => field("CustomerID", e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Company name
            <input
              className={inputCls}
              value={form.CompanyName ?? ""}
              onChange={(e) => field("CompanyName", e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Contact name
            <input
              className={inputCls}
              value={form.ContactName ?? ""}
              onChange={(e) => field("ContactName", e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Contact title
            <input
              className={inputCls}
              value={form.ContactTitle ?? ""}
              onChange={(e) => field("ContactTitle", e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 sm:col-span-2">
            Address
            <input
              className={inputCls}
              value={form.Address ?? ""}
              onChange={(e) => field("Address", e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            City
            <input
              className={inputCls}
              value={form.City ?? ""}
              onChange={(e) => field("City", e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Region
            <input
              className={inputCls}
              value={form.Region ?? ""}
              onChange={(e) => field("Region", e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Postal code
            <input
              className={inputCls}
              value={form.PostalCode ?? ""}
              onChange={(e) => field("PostalCode", e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Country
            <input
              className={inputCls}
              value={form.Country ?? ""}
              onChange={(e) => field("Country", e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Phone
            <input
              className={inputCls}
              value={form.Phone ?? ""}
              onChange={(e) => field("Phone", e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Fax
            <input
              className={inputCls}
              value={form.Fax ?? ""}
              onChange={(e) => field("Fax", e.target.value)}
            />
          </label>
          <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              {saving ? "Saving…" : editingId ? "Update" : "Create"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={onCancelEdit}
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                Cancel edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
            All customers
          </h2>
          <button
            type="button"
            onClick={() => void load()}
            className="self-start rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900 sm:self-auto"
          >
            Refresh
          </button>
        </div>
        <div className="flex flex-col gap-3 border-b border-zinc-100 px-4 py-3 text-sm dark:border-zinc-800 md:flex-row md:flex-wrap md:items-end md:gap-4">
          <label className="flex flex-col gap-1 text-zinc-700 dark:text-zinc-300">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Page size
            </span>
            <select
              className={inputCls}
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n} per page
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-[10rem] flex-col gap-1 text-zinc-700 dark:text-zinc-300">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Sort by
            </span>
            <select
              className={inputCls}
              value={sortCol}
              onChange={(e) => {
                setSortCol(e.target.value);
                setPage(1);
              }}
            >
              {SORT_COLUMNS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-zinc-700 dark:text-zinc-300">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Direction
            </span>
            <select
              className={inputCls}
              value={sortDir}
              onChange={(e) => {
                setSortDir(e.target.value as "asc" | "desc");
                setPage(1);
              }}
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </label>
          <div className="flex flex-wrap items-center gap-2 md:ml-auto">
            <span className="text-zinc-600 dark:text-zinc-400">
              Page {page} of {totalPages}
              <span className="text-zinc-400 dark:text-zinc-500">
                {" "}
                ({total} total)
              </span>
            </span>
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-md border border-zinc-300 px-3 py-1.5 font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() =>
                setPage((p) => (p < totalPages ? p + 1 : p))
              }
              className="rounded-md border border-zinc-300 px-3 py-1.5 font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              Next
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <p className="px-4 py-8 text-sm text-zinc-500">Loading…</p>
          ) : (
            <table className="min-w-full divide-y divide-zinc-200 text-left text-sm dark:divide-zinc-800">
              <thead className="bg-zinc-50 dark:bg-zinc-900">
                <tr>
                  <th className="px-4 py-2 font-medium text-zinc-700 dark:text-zinc-300">
                    ID
                  </th>
                  <th className="px-4 py-2 font-medium text-zinc-700 dark:text-zinc-300">
                    Company
                  </th>
                  <th className="px-4 py-2 font-medium text-zinc-700 dark:text-zinc-300">
                    Contact
                  </th>
                  <th className="px-4 py-2 font-medium text-zinc-700 dark:text-zinc-300">
                    City
                  </th>
                  <th className="px-4 py-2 font-medium text-zinc-700 dark:text-zinc-300">
                    Country
                  </th>
                  <th className="px-4 py-2 font-medium text-zinc-700 dark:text-zinc-300">
                    Phone
                  </th>
                  <th className="px-4 py-2 font-medium text-zinc-700 dark:text-zinc-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {(customers ?? []).map((c) => (
                  <tr
                    key={c.CustomerID}
                    className={
                      editingId === c.CustomerID
                        ? "bg-zinc-100/80 dark:bg-zinc-900/80"
                        : ""
                    }
                  >
                    <td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-zinc-900 dark:text-zinc-100">
                      {c.CustomerID}
                    </td>
                    <td className="max-w-[12rem] truncate px-4 py-2 text-zinc-800 dark:text-zinc-200">
                      {c.CompanyName ?? "—"}
                    </td>
                    <td className="max-w-[10rem] truncate px-4 py-2 text-zinc-800 dark:text-zinc-200">
                      {c.ContactName ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-zinc-800 dark:text-zinc-200">
                      {c.City ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-zinc-800 dark:text-zinc-200">
                      {c.Country ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-zinc-600 dark:text-zinc-400">
                      {c.Phone ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2">
                      <button
                        type="button"
                        onClick={() => onEdit(c)}
                        className="mr-2 text-sm font-medium text-zinc-900 underline hover:no-underline dark:text-zinc-100"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void onDelete(c.CustomerID)}
                        className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {!loading && customers.length === 0 && (
          <p className="px-4 py-8 text-sm text-zinc-500">No customers found.</p>
        )}
      </section>
    </div>
  );
}
