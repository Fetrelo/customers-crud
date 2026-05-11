"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createEmployee,
  deleteEmployee,
  fetchEmployees,
  updateEmployee,
} from "@/lib/api";
import { emptyEmployee, type Employee } from "@/lib/types";

const EMPLOYEE_SORT_COLUMNS: { id: string; label: string }[] = [
  { id: "EmployeeID", label: "Employee ID" },
  { id: "LastName", label: "Last name" },
  { id: "FirstName", label: "First name" },
  { id: "Title", label: "Title" },
  { id: "TitleOfCourtesy", label: "Title of courtesy" },
  { id: "BirthDate", label: "Birth date" },
  { id: "HireDate", label: "Hire date" },
  { id: "City", label: "City" },
  { id: "Country", label: "Country" },
  { id: "HomePhone", label: "Home phone" },
];

function dateInputValue(v: string | null | undefined): string {
  if (v == null || v === "") return "";
  const s = String(v).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : "";
}

export default function EmployeesPanel() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortCol, setSortCol] = useState("LastName");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [nameSearch, setNameSearch] = useState("");
  const [nameFilter, setNameFilter] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Employee>(() => emptyEmployee());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  useEffect(() => {
    const id = setTimeout(() => {
      const t = nameSearch.trim();
      setNameFilter([...t].length >= 3 ? t : undefined);
    }, 300);
    return () => clearTimeout(id);
  }, [nameSearch]);

  useEffect(() => {
    setPage(1);
  }, [nameFilter]);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await fetchEmployees({
        page,
        perPage,
        sort: sortCol,
        dir: sortDir,
        name: nameFilter,
      });
      setEmployees(data.employees ?? []);
      setTotal(data.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load employees");
    } finally {
      setLoading(false);
    }
  }, [page, perPage, sortCol, sortDir, nameFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  function field<K extends keyof Employee>(key: K, value: Employee[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await updateEmployee(Number(editingId), form);
      } else {
        await createEmployee({ ...form, EmployeeID: undefined });
      }
      setForm(emptyEmployee());
      setEditingId(null);
      setFormVisible(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: number) {
    if (!confirm(`Delete employee #${id}?`)) return;
    setError(null);
    try {
      await deleteEmployee(id);
      if (editingId === String(id)) {
        setEditingId(null);
        setForm(emptyEmployee());
        setFormVisible(false);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  function openCreateForm() {
    setEditingId(null);
    setForm(emptyEmployee());
    setFormVisible(true);
  }

  function onEdit(row: Employee) {
    const id = row.EmployeeID;
    if (id == null) return;
    setEditingId(String(id));
    setFormVisible(true);
    setForm({
      EmployeeID: id,
      LastName: row.LastName ?? "",
      FirstName: row.FirstName ?? "",
      Title: row.Title ?? "",
      TitleOfCourtesy: row.TitleOfCourtesy ?? "",
      BirthDate: row.BirthDate ?? "",
      HireDate: row.HireDate ?? "",
      Address: row.Address ?? "",
      City: row.City ?? "",
      Region: row.Region ?? "",
      PostalCode: row.PostalCode ?? "",
      Country: row.Country ?? "",
      HomePhone: row.HomePhone ?? "",
      Extension: row.Extension ?? "",
      Notes: row.Notes ?? "",
      ReportsTo: row.ReportsTo ?? null,
      PhotoPath: row.PhotoPath ?? "",
    });
  }

  function closeForm() {
    setEditingId(null);
    setForm(emptyEmployee());
    setFormVisible(false);
  }

  const inputCls =
    "mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50";

  return (
    <div className="flex flex-1 flex-col gap-8">
      {error && (
        <div
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
          role="alert"
        >
          {error}
        </div>
      )}

      {!formVisible && (
        <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex flex-col gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
              Employees
            </h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={openCreateForm}
                className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              >
                Add employee
              </button>
              <button
                type="button"
                onClick={() => void load()}
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                Refresh
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-3 border-b border-zinc-100 px-4 py-3 text-sm dark:border-zinc-800 md:flex-row md:flex-wrap md:items-end md:gap-4">
            <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-zinc-700 dark:text-zinc-300 md:max-w-md">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Filter by name
              </span>
              <input
                type="search"
                className={inputCls}
                value={nameSearch}
                onChange={(e) => setNameSearch(e.target.value)}
                placeholder="Type at least 3 characters…"
                autoComplete="off"
                aria-describedby="employee-name-filter-hint"
              />
              {nameSearch.trim().length > 0 &&
                [...nameSearch.trim()].length < 3 && (
                  <span
                    id="employee-name-filter-hint"
                    className="text-xs text-zinc-500 dark:text-zinc-400"
                  >
                    Enter at least 3 characters to filter the list.
                  </span>
                )}
            </label>
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
                {EMPLOYEE_SORT_COLUMNS.map((c) => (
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
                onClick={() => setPage((p) => (p < totalPages ? p + 1 : p))}
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
                      Last name
                    </th>
                    <th className="px-4 py-2 font-medium text-zinc-700 dark:text-zinc-300">
                      First name
                    </th>
                    <th className="px-4 py-2 font-medium text-zinc-700 dark:text-zinc-300">
                      Title
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
                  {(employees ?? [])
                    .filter((row) => row.EmployeeID != null)
                    .map((row) => {
                    const eid = row.EmployeeID as number;
                    return (
                      <tr
                        key={eid}
                        className={
                          formVisible && editingId === String(eid)
                            ? "bg-zinc-100/80 dark:bg-zinc-900/80"
                            : ""
                        }
                      >
                        <td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-zinc-900 dark:text-zinc-100">
                          {eid}
                        </td>
                        <td className="max-w-[10rem] truncate px-4 py-2 text-zinc-800 dark:text-zinc-200">
                          {row.LastName ?? "—"}
                        </td>
                        <td className="max-w-[10rem] truncate px-4 py-2 text-zinc-800 dark:text-zinc-200">
                          {row.FirstName ?? "—"}
                        </td>
                        <td className="max-w-[12rem] truncate px-4 py-2 text-zinc-800 dark:text-zinc-200">
                          {row.Title ?? "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2 text-zinc-800 dark:text-zinc-200">
                          {row.City ?? "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2 text-zinc-800 dark:text-zinc-200">
                          {row.Country ?? "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2 text-zinc-600 dark:text-zinc-400">
                          {row.HomePhone ?? "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2">
                          <button
                            type="button"
                            onClick={() => onEdit(row)}
                            className="mr-2 text-sm font-medium text-zinc-900 underline hover:no-underline dark:text-zinc-100"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void onDelete(eid)}
                            className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          {!loading && employees.length === 0 && (
            <p className="px-4 py-8 text-sm text-zinc-500">No employees found.</p>
          )}
        </section>
      )}

      {formVisible && (
        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
              {editingId ? `Edit employee (#${editingId})` : "New employee"}
            </h2>
            <button
              type="button"
              onClick={closeForm}
              className="text-sm font-medium text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Close
            </button>
          </div>
          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {editingId && (
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Employee ID
                <input
                  className={inputCls}
                  disabled
                  value={editingId}
                  readOnly
                />
              </label>
            )}
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Last name *
              <input
                className={inputCls}
                required
                value={form.LastName ?? ""}
                onChange={(e) => field("LastName", e.target.value)}
              />
            </label>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              First name *
              <input
                className={inputCls}
                required
                value={form.FirstName ?? ""}
                onChange={(e) => field("FirstName", e.target.value)}
              />
            </label>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Title
              <input
                className={inputCls}
                value={form.Title ?? ""}
                onChange={(e) => field("Title", e.target.value)}
              />
            </label>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Title of courtesy
              <input
                className={inputCls}
                value={form.TitleOfCourtesy ?? ""}
                onChange={(e) => field("TitleOfCourtesy", e.target.value)}
              />
            </label>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Birth date
              <input
                type="date"
                className={inputCls}
                value={dateInputValue(form.BirthDate)}
                onChange={(e) => field("BirthDate", e.target.value || "")}
              />
            </label>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Hire date
              <input
                type="date"
                className={inputCls}
                value={dateInputValue(form.HireDate)}
                onChange={(e) => field("HireDate", e.target.value || "")}
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
              Home phone
              <input
                className={inputCls}
                value={form.HomePhone ?? ""}
                onChange={(e) => field("HomePhone", e.target.value)}
              />
            </label>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Extension
              <input
                className={inputCls}
                value={form.Extension ?? ""}
                onChange={(e) => field("Extension", e.target.value)}
              />
            </label>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Reports to (employee ID)
              <input
                type="number"
                className={inputCls}
                value={form.ReportsTo ?? ""}
                onChange={(e) =>
                  field(
                    "ReportsTo",
                    e.target.value === "" ? null : Number(e.target.value),
                  )
                }
              />
            </label>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Photo path
              <input
                className={inputCls}
                value={form.PhotoPath ?? ""}
                onChange={(e) => field("PhotoPath", e.target.value)}
              />
            </label>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 sm:col-span-2 lg:col-span-3">
              Notes
              <textarea
                className={`${inputCls} min-h-[5rem]`}
                value={form.Notes ?? ""}
                onChange={(e) => field("Notes", e.target.value)}
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
              <button
                type="button"
                onClick={closeForm}
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
