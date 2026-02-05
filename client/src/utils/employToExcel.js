import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// Helper for total hours formatting (Handles PG Interval)
const formatHours = (val) => {
    if (!val || val === "0h 0m") return "00:00";
  
    // Case 1: If it's the string "8h 23m" from your backend
    if (typeof val === "string" && val.includes('h')) {
      const parts = val.match(/\d+/g); // Extracts numbers: ["8", "23"]
      if (parts) {
        const h = parts[0].padStart(2, "0");
        const m = (parts[1] || "0").padStart(2, "0");
        return `${h}:${m}`;
      }
    }
  
    // Case 2: If it's a raw Postgres object { hours: 8, minutes: 23 }
    if (typeof val === "object") {
      const h = String(val.hours || 0).padStart(2, "0");
      const m = String(val.minutes || 0).padStart(2, "0");
      return `${h}:${m}`;
    }
  
    return val;
  };

export const exportEmployeeAttendanceToExcel = (data, fileName = "Active_Employee_Attendance") => {
  if (!data || !data.length) {
    console.warn("No data available to export");
    return;
  }

  const excelData = data.map((row, index) => {
    // Ensure we use the correct date from your SQL query
    const dateObj = row.attendance_date ? new Date(row.attendance_date) : new Date();
    
    return {
      "Sr No": index + 1,
      "Employee Name": row.employee_name
      || "N/A", // Matches your SQL 'u.name'
      "Emp ID": row.emp_id || "--",
      "Date": dateObj.toLocaleDateString('en-GB'), // Format: DD/MM/YYYY
      "Day": dateObj.toLocaleDateString('en-GB', { weekday: 'short' }),
      "Punch In": row.punch_in ? row.punch_in : "--",
      "Punch Out": row.punch_out ? row.punch_out : "--",
      "Total Hours": formatHours(row.total_hours_str),
      "Status": row.status || "Absent",
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  
  // Set column widths for better readability
  worksheet["!cols"] = [
    { wch: 8 },  // Sr No
    { wch: 25 }, // Employee Name
    { wch: 12 }, // Emp ID
    { wch: 15 }, // Date
    { wch: 10 }, // Day
    { wch: 15 }, // Punch In
    { wch: 15 }, // Punch Out
    { wch: 15 }, // Total Hours
    { wch: 12 }, // Status
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Report");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const dataBlob = new Blob([excelBuffer], { 
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
  });
  
  // Generate filename with current date
  const dateString = new Date().toISOString().split('T')[0];
  saveAs(dataBlob, `${fileName}_${dateString}.xlsx`);
};