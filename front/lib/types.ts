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
