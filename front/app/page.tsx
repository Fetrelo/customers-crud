"use client";

import { useState } from "react";
import { apiBase } from "@/lib/api";
import CustomersPanel from "@/app/components/CustomersPanel";
import EmployeesPanel from "@/app/components/EmployeesPanel";

type Tab = "customers" | "employees";

export default function Home() {
  const [tab, setTab] = useState<Tab>("customers");

  const tabBtn =
    "rounded-t-md border border-b-0 px-4 py-2 text-sm font-medium transition-colors";
  const tabInactive =
    "border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100";
  const tabActive =
    "border-zinc-200 bg-white text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50";

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-8 sm:px-8">
      <header className="flex flex-col gap-4 border-b border-zinc-200 pb-4 dark:border-zinc-800">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Northwind CRUD
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          API:{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 dark:bg-zinc-900">
            {apiBase()}
          </code>
        </p>
        <div
          className="flex gap-1"
          role="tablist"
          aria-label="Data domain"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "customers"}
            id="tab-customers"
            className={`${tabBtn} ${tab === "customers" ? tabActive : tabInactive}`}
            onClick={() => setTab("customers")}
          >
            Customers
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "employees"}
            id="tab-employees"
            className={`${tabBtn} ${tab === "employees" ? tabActive : tabInactive}`}
            onClick={() => setTab("employees")}
          >
            Employees
          </button>
        </div>
      </header>

      <div
        role="tabpanel"
        aria-labelledby={tab === "customers" ? "tab-customers" : "tab-employees"}
        className="min-h-0 flex-1"
      >
        {tab === "customers" && <CustomersPanel />}
        {tab === "employees" && <EmployeesPanel />}
      </div>
    </div>
  );
}
