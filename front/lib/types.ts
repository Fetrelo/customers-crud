export type Customer = {
  CustomerID: string;
  CompanyName?: string | null;
  ContactName?: string | null;
  ContactTitle?: string | null;
  Address?: string | null;
  City?: string | null;
  Region?: string | null;
  PostalCode?: string | null;
  Country?: string | null;
  Phone?: string | null;
  Fax?: string | null;
};

export type CustomersListResponse = {
  customers: Customer[];
  total: number;
  page: number;
  per_page: number;
  sort: string;
  dir: string;
};

/** Query params for GET /customers (backend defaults: page=1, per_page=10, sort=CompanyName, dir=asc) */
export type CustomersListQuery = {
  page?: number;
  perPage?: number;
  sort?: string;
  dir?: "asc" | "desc";
  /** Substring filter on CompanyName; backend applies only when length is at least 3. */
  company?: string;
};

export function emptyCustomer(): Customer {
  return {
    CustomerID: "",
    CompanyName: "",
    ContactName: "",
    ContactTitle: "",
    Address: "",
    City: "",
    Region: "",
    PostalCode: "",
    Country: "",
    Phone: "",
    Fax: "",
  };
}

/** API omits `Photo` BLOB; `EmployeeID` optional on create. */
export type Employee = {
  EmployeeID?: number | null;
  LastName?: string | null;
  FirstName?: string | null;
  Title?: string | null;
  TitleOfCourtesy?: string | null;
  BirthDate?: string | null;
  HireDate?: string | null;
  Address?: string | null;
  City?: string | null;
  Region?: string | null;
  PostalCode?: string | null;
  Country?: string | null;
  HomePhone?: string | null;
  Extension?: string | null;
  Notes?: string | null;
  ReportsTo?: number | null;
  PhotoPath?: string | null;
};

export type EmployeesListResponse = {
  employees: Employee[];
  total: number;
  page: number;
  per_page: number;
  sort: string;
  dir: string;
};

export type EmployeesListQuery = {
  page?: number;
  perPage?: number;
  sort?: string;
  dir?: "asc" | "desc";
  /** First or last name substring; backend applies when length ≥ 3. */
  name?: string;
};

export function emptyEmployee(): Employee {
  return {
    EmployeeID: undefined,
    LastName: "",
    FirstName: "",
    Title: "",
    TitleOfCourtesy: "",
    BirthDate: "",
    HireDate: "",
    Address: "",
    City: "",
    Region: "",
    PostalCode: "",
    Country: "",
    HomePhone: "",
    Extension: "",
    Notes: "",
    ReportsTo: null,
    PhotoPath: "",
  };
}
