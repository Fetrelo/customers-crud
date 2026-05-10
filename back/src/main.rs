#[macro_use]
extern crate rocket;

use rocket::fairing::{Fairing, Info, Kind};
use rocket::serde::json::Json;
use rocket::{Request, Response, State};
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};

use rocket::http::Status;
use rocket::response::status::{Created, NoContent};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(non_snake_case)]
pub struct Customer {
    pub CustomerID: String,
    #[serde(default)]
    pub CompanyName: Option<String>,
    #[serde(default)]
    pub ContactName: Option<String>,
    #[serde(default)]
    pub ContactTitle: Option<String>,
    #[serde(default)]
    pub Address: Option<String>,
    #[serde(default)]
    pub City: Option<String>,
    #[serde(default)]
    pub Region: Option<String>,
    #[serde(default)]
    pub PostalCode: Option<String>,
    #[serde(default)]
    pub Country: Option<String>,
    #[serde(default)]
    pub Phone: Option<String>,
    #[serde(default)]
    pub Fax: Option<String>,
}

impl Customer {
    fn from_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<Self> {
        Ok(Customer {
            CustomerID: row.get(0)?,
            CompanyName: row.get(1)?,
            ContactName: row.get(2)?,
            ContactTitle: row.get(3)?,
            Address: row.get(4)?,
            City: row.get(5)?,
            Region: row.get(6)?,
            PostalCode: row.get(7)?,
            Country: row.get(8)?,
            Phone: row.get(9)?,
            Fax: row.get(10)?,
        })
    }
}

pub struct Cors;

#[rocket::async_trait]
impl Fairing for Cors {
    fn info(&self) -> Info {
        Info {
            name: "CORS headers",
            kind: Kind::Response,
        }
    }

    async fn on_response<'r>(&self, _req: &'r Request<'_>, res: &mut Response<'r>) {
        res.adjoin_raw_header("Access-Control-Allow-Origin", "*");
        res.adjoin_raw_header(
            "Access-Control-Allow-Methods",
            "GET, POST, PUT, DELETE, OPTIONS",
        );
        res.adjoin_raw_header("Access-Control-Allow-Headers", "Content-Type");
    }
}

type DbState = Arc<Mutex<Connection>>;

const DEFAULT_PAGE: i64 = 1;
const DEFAULT_PER_PAGE: i64 = 10;
const MAX_PER_PAGE: i64 = 200;
/// Max characters accepted for the company name filter query param.
const MAX_COMPANY_FILTER_LEN: usize = 200;

/// Returns `Some(needle)` only when the filter has at least 3 Unicode scalars (trimmed).
fn normalize_company_filter(raw: &Option<String>) -> Option<String> {
    let s = raw.as_ref()?.trim();
    let trimmed: String = s.chars().take(MAX_COMPANY_FILTER_LEN).collect();
    if trimmed.chars().count() < 3 {
        return None;
    }
    Some(trimmed)
}

#[derive(Debug, Serialize)]
pub struct PaginatedCustomers {
    pub customers: Vec<Customer>,
    pub total: i64,
    pub page: i64,
    pub per_page: i64,
    pub sort: String,
    pub dir: String,
}

fn resolve_sort_column(raw: Option<&String>) -> &'static str {
    match raw.map(|s| s.trim()) {
        None | Some("") => "CompanyName",
        Some(s) => match s.to_ascii_lowercase().as_str() {
            "customerid" => "CustomerID",
            "companyname" => "CompanyName",
            "contactname" => "ContactName",
            "contacttitle" => "ContactTitle",
            "address" => "Address",
            "city" => "City",
            "region" => "Region",
            "postalcode" => "PostalCode",
            "country" => "Country",
            "phone" => "Phone",
            "fax" => "Fax",
            _ => "",
        },
    }
}

fn resolve_sort_dir(raw: Option<&String>) -> Result<&'static str, ()> {
    let s = raw
        .map(|x| x.trim().to_ascii_lowercase())
        .unwrap_or_default();
    match s.as_str() {
        "" | "asc" => Ok("ASC"),
        "desc" => Ok("DESC"),
        _ => Err(()),
    }
}

#[get("/customers?<page>&<per_page>&<sort>&<dir>&<company>")]
fn get_customers(
    db: &State<DbState>,
    page: Option<i64>,
    per_page: Option<i64>,
    sort: Option<String>,
    dir: Option<String>,
    company: Option<String>,
) -> Result<Json<PaginatedCustomers>, Status> {
    let page = page.unwrap_or(DEFAULT_PAGE).max(1);
    let per_page = per_page
        .unwrap_or(DEFAULT_PER_PAGE)
        .clamp(1, MAX_PER_PAGE);

    let sort_col = resolve_sort_column(sort.as_ref());
    if sort_col.is_empty() {
        return Err(Status::BadRequest);
    }
    let sort_dir = resolve_sort_dir(dir.as_ref()).map_err(|_| Status::BadRequest)?;

    let offset = (page - 1).saturating_mul(per_page);

    let company_filter = normalize_company_filter(&company);

    let conn = db.lock().map_err(|_| Status::InternalServerError)?;

    const SELECT_FROM: &str = "SELECT CustomerID, CompanyName, ContactName, ContactTitle, Address, City, Region, PostalCode, Country, Phone, Fax FROM Customers";

    let (total, out) = match &company_filter {
        None => {
            let total: i64 = conn
                .query_row("SELECT COUNT(*) FROM Customers", [], |row| row.get(0))
                .map_err(|_| Status::InternalServerError)?;
            let sql = format!(
                "{SELECT_FROM} ORDER BY {} {} LIMIT ? OFFSET ?",
                sort_col, sort_dir
            );
            let mut stmt = conn.prepare(&sql).map_err(|_| Status::InternalServerError)?;
            let rows = stmt
                .query_map(params![per_page, offset], Customer::from_row)
                .map_err(|_| Status::InternalServerError)?;
            let mut out = Vec::new();
            for row in rows {
                out.push(row.map_err(|_| Status::InternalServerError)?);
            }
            (total, out)
        }
        Some(needle) => {
            let where_instr =
                "instr(lower(COALESCE(CompanyName, '')), lower(?)) > 0";
            let total: i64 = conn
                .query_row(
                    &format!("SELECT COUNT(*) FROM Customers WHERE {where_instr}"),
                    params![needle],
                    |row| row.get(0),
                )
                .map_err(|_| Status::InternalServerError)?;
            let sql = format!(
                "{SELECT_FROM} WHERE {where_instr} ORDER BY {} {} LIMIT ? OFFSET ?",
                sort_col, sort_dir
            );
            let mut stmt = conn.prepare(&sql).map_err(|_| Status::InternalServerError)?;
            let rows = stmt
                .query_map(params![needle, per_page, offset], Customer::from_row)
                .map_err(|_| Status::InternalServerError)?;
            let mut out = Vec::new();
            for row in rows {
                out.push(row.map_err(|_| Status::InternalServerError)?);
            }
            (total, out)
        }
    };

    Ok(Json(PaginatedCustomers {
        customers: out,
        total,
        page,
        per_page,
        sort: sort_col.to_string(),
        dir: sort_dir.to_ascii_lowercase(),
    }))
}

#[get("/customers/<id>")]
fn get_customer(db: &State<DbState>, id: &str) -> Result<Json<Customer>, Status> {
    let conn = db.lock().map_err(|_| Status::InternalServerError)?;
    let mut stmt = conn
        .prepare(
            "SELECT CustomerID, CompanyName, ContactName, ContactTitle, Address, City, Region, PostalCode, Country, Phone, Fax FROM Customers WHERE CustomerID = ?",
        )
        .map_err(|_| Status::InternalServerError)?;
    let mut rows = stmt
        .query_map(params![id], Customer::from_row)
        .map_err(|_| Status::InternalServerError)?;
    rows.next()
        .transpose()
        .map_err(|_| Status::InternalServerError)?
        .map(Json)
        .ok_or(Status::NotFound)
}

#[post("/customers", format = "json", data = "<customer>")]
fn create_customer(db: &State<DbState>, customer: Json<Customer>) -> Result<Created<Json<Customer>>, Status> {
    let c = customer.into_inner();
    let conn = db.lock().map_err(|_| Status::InternalServerError)?;
    let n = conn
        .execute(
            "INSERT INTO Customers (CustomerID, CompanyName, ContactName, ContactTitle, Address, City, Region, PostalCode, Country, Phone, Fax) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            params![
                c.CustomerID,
                c.CompanyName,
                c.ContactName,
                c.ContactTitle,
                c.Address,
                c.City,
                c.Region,
                c.PostalCode,
                c.Country,
                c.Phone,
                c.Fax,
            ],
        )
        .map_err(|e| {
            let msg = e.to_string();
            if msg.contains("UNIQUE") || msg.contains("unique") {
                Status::Conflict
            } else {
                Status::InternalServerError
            }
        })?;
    if n == 0 {
        return Err(Status::InternalServerError);
    }
    Ok(Created::new(format!("/customers/{}", c.CustomerID)).body(Json(c)))
}

#[put("/customers/<id>", format = "json", data = "<customer>")]
fn update_customer(db: &State<DbState>, id: &str, customer: Json<Customer>) -> Result<Json<Customer>, Status> {
    let mut c = customer.into_inner();
    c.CustomerID = id.to_string();
    let conn = db.lock().map_err(|_| Status::InternalServerError)?;
    let n = conn
        .execute(
            "UPDATE Customers SET CompanyName = ?, ContactName = ?, ContactTitle = ?, Address = ?, City = ?, Region = ?, PostalCode = ?, Country = ?, Phone = ?, Fax = ? WHERE CustomerID = ?",
            params![
                c.CompanyName,
                c.ContactName,
                c.ContactTitle,
                c.Address,
                c.City,
                c.Region,
                c.PostalCode,
                c.Country,
                c.Phone,
                c.Fax,
                c.CustomerID,
            ],
        )
        .map_err(|_| Status::InternalServerError)?;
    if n == 0 {
        return Err(Status::NotFound);
    }
    Ok(Json(c))
}

#[delete("/customers/<id>")]
fn delete_customer(db: &State<DbState>, id: &str) -> Result<NoContent, Status> {
    let conn = db.lock().map_err(|_| Status::InternalServerError)?;
    let n = conn
        .execute("DELETE FROM Customers WHERE CustomerID = ?", params![id])
        .map_err(|_| Status::InternalServerError)?;
    if n == 0 {
        return Err(Status::NotFound);
    }
    Ok(NoContent)
}

#[options("/customers")]
fn options_customers() -> Status {
    Status::Ok
}

#[options("/customers/<_id>")]
fn options_customer(_id: &str) -> Status {
    Status::Ok
}

#[launch]
fn rocket() -> _ {
    let conn = Connection::open("northwind.db").expect("failed to open northwind.db");
    let db: DbState = Arc::new(Mutex::new(conn));

    rocket::build()
        .manage(db)
        .attach(Cors)
        .mount(
            "/",
            routes![
                get_customers,
                get_customer,
                create_customer,
                update_customer,
                delete_customer,
                options_customers,
                options_customer,
            ],
        )
}
