import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

/**
 * Export raw punch logs to Excel with IST formatting
 */
export const exportActivityToExcel = (data, fileName = "Activity_Log") => {
  if (!data || !data.length) {
    console.error("No data available to export");
    return;
  }

  // Map raw data using the same logic as your UI table
  const excelData = data.map((row, index) => {
    // Parse the ISO punch_time
    const dateObj = row.punch_time ? new Date(row.punch_time) : null;

    const punchDate = dateObj 
      ? dateObj.toLocaleDateString('en-IN') 
      : "--";

    const punchTime = dateObj 
      ? dateObj.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        }) 
      : "--";

    return {
      "Sr No": index + 1,
      "Emp ID": row.emp_id || "--",
      "Punch Date": punchDate,
      "Punch Time": punchTime,
      "Device IP": row.device_ip || "--",
      "Device SN": row.device_sn || "--",
    };
  });

  // Create Worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  
  // Set Column Widths for readability
  worksheet["!cols"] = [
    { wch: 8 },  // Sr No
    { wch: 15 }, // Emp ID
    { wch: 15 }, // Punch Date
    { wch: 18 }, // Punch Time
    { wch: 18 }, // Device IP
    { wch: 20 }, // Device SN
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Raw Activity Logs");

  // Generate Buffer
  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  // Create Blob
  const blob = new Blob([excelBuffer], {
    type: "application/octet-stream", 
  });
  
  // Generate single filename with date stamp
  const timestamp = new Date().toISOString().split('T')[0];
  const fullFileName = `${fileName}_${timestamp}.xlsx`;

  // Trigger one download
  saveAs(blob, fullFileName);
};