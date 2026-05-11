//! Employees API — `Photo` BLOB is omitted from JSON and left NULL on insert/update.

use rocket::http::Status;
use rocket::response::status::{Created, NoContent};
use rocket::serde::json::Json;
use rocket::State;
use rusqlite::params;
use serde::{Deserialize, Serialize};

use crate::DbState;

const DEFAULT_PAGE: i64 = 1;
const DEFAULT_PER_PAGE: i64 = 10;
const MAX_PER_PAGE: i64 = 200;
const MAX_NAME_FILTER_LEN: usize = 200;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(non_snake_case)]
pub struct Employee {
    #[serde(default)]
    pub EmployeeID: Option<i64>,
    #[serde(default)]
    pub LastName: Option<String>,
    #[serde(default)]
    pub FirstName: Option<String>,
    #[serde(default)]
    pub Title: Option<String>,
    #[serde(default)]
    pub TitleOfCourtesy: Option<String>,
    #[serde(default)]
    pub BirthDate: Option<String>,
    #[serde(default)]
    pub HireDate: Option<String>,
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
    pub HomePhone: Option<String>,
    #[serde(default)]
    pub Extension: Option<String>,
    #[serde(default)]
    pub Notes: Option<String>,
    #[serde(default)]
    pub ReportsTo: Option<i64>,
    #[serde(default)]
    pub PhotoPath: Option<String>,
}

impl Employee {
    pub fn from_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<Self> {
        Ok(Employee {
            EmployeeID: row.get(0)?,
            LastName: row.get(1)?,
            FirstName: row.get(2)?,
            Title: row.get(3)?,
            TitleOfCourtesy: row.get(4)?,
            BirthDate: row.get(5)?,
            HireDate: row.get(6)?,
            Address: row.get(7)?,
            City: row.get(8)?,
            Region: row.get(9)?,
            PostalCode: row.get(10)?,
            Country: row.get(11)?,
            HomePhone: row.get(12)?,
            Extension: row.get(13)?,
            Notes: row.get(14)?,
            ReportsTo: row.get(15)?,
            PhotoPath: row.get(16)?,
        })
    }
}

#[derive(Debug, Serialize)]
pub struct PaginatedEmployees {
    pub employees: Vec<Employee>,
    pub total: i64,
    pub page: i64,
    pub per_page: i64,
    pub sort: String,
    pub dir: String,
}

fn normalize_name_filter(raw: &Option<String>) -> Option<String> {
    let s = raw.as_ref()?.trim();
    let trimmed: String = s.chars().take(MAX_NAME_FILTER_LEN).collect();
    if trimmed.chars().count() < 3 {
        return None;
    }
    Some(trimmed)
}

fn resolve_employee_sort_column(raw: Option<&String>) -> &'static str {
    match raw.map(|s| s.trim()) {
        None | Some("") => "LastName",
        Some(s) => match s.to_ascii_lowercase().as_str() {
            "employeeid" => "EmployeeID",
            "lastname" => "LastName",
            "firstname" => "FirstName",
            "title" => "Title",
            "titleofcourtesy" => "TitleOfCourtesy",
            "birthdate" => "BirthDate",
            "hiredate" => "HireDate",
            "address" => "Address",
            "city" => "City",
            "region" => "Region",
            "postalcode" => "PostalCode",
            "country" => "Country",
            "homephone" => "HomePhone",
            "extension" => "Extension",
            "notes" => "Notes",
            "reportsto" => "ReportsTo",
            "photopath" => "PhotoPath",
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

const SELECT_EMPLOYEES: &str = "SELECT EmployeeID, LastName, FirstName, Title, TitleOfCourtesy, BirthDate, HireDate, Address, City, Region, PostalCode, Country, HomePhone, Extension, Notes, ReportsTo, PhotoPath FROM Employees";

#[get("/employees?<page>&<per_page>&<sort>&<dir>&<name>")]
pub fn get_employees(
    db: &State<DbState>,
    page: Option<i64>,
    per_page: Option<i64>,
    sort: Option<String>,
    dir: Option<String>,
    name: Option<String>,
) -> Result<Json<PaginatedEmployees>, Status> {
    let page = page.unwrap_or(DEFAULT_PAGE).max(1);
    let per_page = per_page
        .unwrap_or(DEFAULT_PER_PAGE)
        .clamp(1, MAX_PER_PAGE);

    let sort_col = resolve_employee_sort_column(sort.as_ref());
    if sort_col.is_empty() {
        return Err(Status::BadRequest);
    }
    let sort_dir = resolve_sort_dir(dir.as_ref()).map_err(|_| Status::BadRequest)?;

    let offset = (page - 1).saturating_mul(per_page);
    let name_filter = normalize_name_filter(&name);

    let conn = db.lock().map_err(|_| Status::InternalServerError)?;

    let where_name = "(instr(lower(COALESCE(LastName, '')), lower(?)) > 0 OR instr(lower(COALESCE(FirstName, '')), lower(?)) > 0)";

    let (total, out) = match &name_filter {
        None => {
            let total: i64 = conn
                .query_row("SELECT COUNT(*) FROM Employees", [], |row| row.get(0))
                .map_err(|_| Status::InternalServerError)?;
            let sql = format!(
                "{SELECT_EMPLOYEES} ORDER BY {} {} LIMIT ? OFFSET ?",
                sort_col, sort_dir
            );
            let mut stmt = conn.prepare(&sql).map_err(|_| Status::InternalServerError)?;
            let rows = stmt
                .query_map(params![per_page, offset], Employee::from_row)
                .map_err(|_| Status::InternalServerError)?;
            let mut out = Vec::new();
            for row in rows {
                out.push(row.map_err(|_| Status::InternalServerError)?);
            }
            (total, out)
        }
        Some(needle) => {
            let total: i64 = conn
                .query_row(
                    &format!("SELECT COUNT(*) FROM Employees WHERE {where_name}"),
                    params![needle, needle],
                    |row| row.get(0),
                )
                .map_err(|_| Status::InternalServerError)?;
            let sql = format!(
                "{SELECT_EMPLOYEES} WHERE {where_name} ORDER BY {} {} LIMIT ? OFFSET ?",
                sort_col, sort_dir
            );
            let mut stmt = conn.prepare(&sql).map_err(|_| Status::InternalServerError)?;
            let rows = stmt
                .query_map(params![needle, needle, per_page, offset], Employee::from_row)
                .map_err(|_| Status::InternalServerError)?;
            let mut out = Vec::new();
            for row in rows {
                out.push(row.map_err(|_| Status::InternalServerError)?);
            }
            (total, out)
        }
    };

    Ok(Json(PaginatedEmployees {
        employees: out,
        total,
        page,
        per_page,
        sort: sort_col.to_string(),
        dir: sort_dir.to_ascii_lowercase(),
    }))
}

#[get("/employees/<id>")]
pub fn get_employee(db: &State<DbState>, id: i64) -> Result<Json<Employee>, Status> {
    let conn = db.lock().map_err(|_| Status::InternalServerError)?;
    let mut stmt = conn
        .prepare(&format!("{SELECT_EMPLOYEES} WHERE EmployeeID = ?"))
        .map_err(|_| Status::InternalServerError)?;
    let mut rows = stmt
        .query_map(params![id], Employee::from_row)
        .map_err(|_| Status::InternalServerError)?;
    rows.next()
        .transpose()
        .map_err(|_| Status::InternalServerError)?
        .map(Json)
        .ok_or(Status::NotFound)
}

#[post("/employees", format = "json", data = "<employee>")]
pub fn create_employee(
    db: &State<DbState>,
    employee: Json<Employee>,
) -> Result<Created<Json<Employee>>, Status> {
    let mut e = employee.into_inner();
    e.EmployeeID = None;
    let conn = db.lock().map_err(|_| Status::InternalServerError)?;
    let n = conn
        .execute(
            "INSERT INTO Employees (LastName, FirstName, Title, TitleOfCourtesy, BirthDate, HireDate, Address, City, Region, PostalCode, Country, HomePhone, Extension, Photo, Notes, ReportsTo, PhotoPath) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)",
            params![
                e.LastName,
                e.FirstName,
                e.Title,
                e.TitleOfCourtesy,
                e.BirthDate,
                e.HireDate,
                e.Address,
                e.City,
                e.Region,
                e.PostalCode,
                e.Country,
                e.HomePhone,
                e.Extension,
                e.Notes,
                e.ReportsTo,
                e.PhotoPath,
            ],
        )
        .map_err(|_| Status::InternalServerError)?;
    if n == 0 {
        return Err(Status::InternalServerError);
    }
    let new_id = conn.last_insert_rowid();
    let mut stmt = conn
        .prepare(&format!("{SELECT_EMPLOYEES} WHERE EmployeeID = ?"))
        .map_err(|_| Status::InternalServerError)?;
    let mut rows = stmt
        .query_map(params![new_id], Employee::from_row)
        .map_err(|_| Status::InternalServerError)?;
    let created = rows
        .next()
        .transpose()
        .map_err(|_| Status::InternalServerError)?
        .ok_or(Status::InternalServerError)?;
    Ok(Created::new(format!("/employees/{}", new_id)).body(Json(created)))
}

#[put("/employees/<id>", format = "json", data = "<employee>")]
pub fn update_employee(
    db: &State<DbState>,
    id: i64,
    employee: Json<Employee>,
) -> Result<Json<Employee>, Status> {
    let mut e = employee.into_inner();
    e.EmployeeID = Some(id);
    let conn = db.lock().map_err(|_| Status::InternalServerError)?;
    let n = conn
        .execute(
            "UPDATE Employees SET LastName = ?, FirstName = ?, Title = ?, TitleOfCourtesy = ?, BirthDate = ?, HireDate = ?, Address = ?, City = ?, Region = ?, PostalCode = ?, Country = ?, HomePhone = ?, Extension = ?, Notes = ?, ReportsTo = ?, PhotoPath = ? WHERE EmployeeID = ?",
            params![
                e.LastName,
                e.FirstName,
                e.Title,
                e.TitleOfCourtesy,
                e.BirthDate,
                e.HireDate,
                e.Address,
                e.City,
                e.Region,
                e.PostalCode,
                e.Country,
                e.HomePhone,
                e.Extension,
                e.Notes,
                e.ReportsTo,
                e.PhotoPath,
                id,
            ],
        )
        .map_err(|_| Status::InternalServerError)?;
    if n == 0 {
        return Err(Status::NotFound);
    }
    let mut stmt = conn
        .prepare(&format!("{SELECT_EMPLOYEES} WHERE EmployeeID = ?"))
        .map_err(|_| Status::InternalServerError)?;
    let mut rows = stmt
        .query_map(params![id], Employee::from_row)
        .map_err(|_| Status::InternalServerError)?;
    let updated = rows
        .next()
        .transpose()
        .map_err(|_| Status::InternalServerError)?
        .ok_or(Status::InternalServerError)?;
    Ok(Json(updated))
}

#[delete("/employees/<id>")]
pub fn delete_employee(db: &State<DbState>, id: i64) -> Result<NoContent, Status> {
    let conn = db.lock().map_err(|_| Status::InternalServerError)?;
    let r = conn.execute("DELETE FROM Employees WHERE EmployeeID = ?", params![id]);
    match r {
        Ok(0) => Err(Status::NotFound),
        Ok(_) => Ok(NoContent),
        Err(e) => {
            let msg = e.to_string();
            if msg.contains("FOREIGN KEY") || msg.contains("constraint") {
                Err(Status::Conflict)
            } else {
                Err(Status::InternalServerError)
            }
        }
    }
}

#[options("/employees")]
pub fn options_employees() -> Status {
    Status::Ok
}

#[options("/employees/<_id>")]
pub fn options_employee(_id: i64) -> Status {
    Status::Ok
}
