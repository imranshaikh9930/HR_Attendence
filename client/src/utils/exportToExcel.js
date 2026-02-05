import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

/** * HELPER FUNCTIONS 
 **/

/* Format date/time in Asia/Kolkata */
const formatIST = (value, type = "date") => {
  if (!value || value === "---" || value === "--") return "--";
  
  // If value is already a formatted time string like "09:00 AM"
  if (typeof value === 'string' && value.includes(':') && (value.includes('AM') || value.includes('PM'))) {
      return value;
  }

  const date = new Date(value);
  if (isNaN(date.getTime())) return value; 

  if (type === "date") {
    return date.toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata" }); // DD/MM/YYYY
  } else if (type === "time") {
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true, 
      timeZone: "Asia/Kolkata",
    });
  }
  return value;
};

/* Format duration strings or objects into HH:MM */
const formatInterval = (val) => {
  if (!val || val === "--" || val === "0h 0m") return "00:00";

  // Handle String format "8h 23m"
  if (typeof val === "string" && val.includes('h')) {
    const parts = val.match(/\d+/g); 
    if (parts) {
      const h = parts[0].padStart(2, "0");
      const m = (parts[1] || "0").padStart(2, "0");
      return `${h}:${m}`;
    }
    return val;
  }

  // Handle Object format {hours: 8, minutes: 23}
  if (typeof val === "object") {
    const h = String(val.hours || 0).padStart(2, "0");
    const m = String(val.minutes || 0).padStart(2, "0");
    return `${h}:${m}`;
  }
  return val;
};

/* Get the short weekday (Mon, Tue, etc.) */
const getWeekDayIST = (dateStr) => {
  if (!dateStr) return "--";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "--";
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    timeZone: "Asia/Kolkata",
  });
};

/** * MAIN EXPORT FUNCTION 
 **/

export const exportToExcel = (data, fileName = "Attendance_Report") => {
  if (!data || !data.length) {
    console.error("Export failed: No data provided");
    return;
  }

  // 1. FILTER: 
  // - Must have a valid emp_id
  // - Must be Active (is_active true or undefined)
  const filteredData = data.filter(row => {
    const hasId = row.emp_id && String(row.emp_id).trim() !== "";
    const isActive = row.is_active === true || row.is_active === 1 || row.is_active === undefined;
    return hasId && isActive;
  });

  if (filteredData.length === 0) {
    console.warn("No active records with valid Employee IDs found for export.");
    return;
  }

  // 2. MAP: Format the filtered data for Excel
  const excelData = filteredData.map((row, index) => {
    const workingHours = row.total_hours_str || row.total_hours;

    return {
      "Sr No": index + 1, // Stays sequential (1, 2, 3...)
      "Employee ID": row.emp_id,
      "Employee Name": row.name || row.employee_name || "--",
      "Date": formatIST(row.attendance_date, "date"),
      "Day": getWeekDayIST(row.attendance_date),
      "Punch In": formatIST(row.punch_in, "time"),
      "Punch Out": formatIST(row.punch_out, "time"),
      "Working Hours": formatInterval(workingHours),
      "Status": row.status || "Absent",
    };
  });

  // 3. Create Worksheet and Workbook
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Column Widths
  worksheet["!cols"] = [
    { wch: 6 },  // Sr No
    { wch: 15 }, // ID
    { wch: 25 }, // Name
    { wch: 12 }, // Date
    { wch: 10 }, // Day
    { wch: 12 }, // In
    { wch: 12 }, // Out
    { wch: 15 }, // Hours
    { wch: 15 }, // Status
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Daily Attendance");

  // 4. Write and Save
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], { 
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
  });

  const dateStr = new Date().toISOString().split('T')[0];
  saveAs(blob, `${fileName}_${dateStr}.xlsx`);
};