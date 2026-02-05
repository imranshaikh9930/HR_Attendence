import React, { useContext, useEffect } from "react";
import { useLocation } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { IoSearchOutline } from "react-icons/io5";
import { HiMiniFunnel } from "react-icons/hi2";
import { EmployContext } from "../context/EmployContextProvider";
import { exportToExcel } from "../utils/exportToExcel";
import { exportActivityToExcel } from "../utils/activityToExcel";
import { exportAdminAttendanceToExcel } from "../utils/adminToExcel"
import { exportEmployeeAttendanceToExcel } from "../utils/employToExcel";

const Filters = ({ adminData }) => {
  const location = useLocation();
  const {
    filters,
    setFilters,
    handleFilterChange,
    adminAttendance,
    employeeAttendance,
    activelogs
  } = useContext(EmployContext);

  // Debugging Logs
  // useEffect(() => { console.log("adminAttendance", adminAttendance); }, [adminAttendance]);
  // useEffect(() => { console.log("employeeAttendance", employeeAttendance); }, [employeeAttendance]);
  // useEffect(() => { console.log("activelogs", activelogs); }, [activelogs]);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user?.role?.toLowerCase();
  const todayPlaceholder = new Date().toLocaleDateString("en-GB");

  const {singleAdminAttendance} = useContext(EmployContext);

  // Route Flags
  const isAttendancePage = location.pathname.includes("admin/attendance") 
  const isAdminAttendancePage = location.pathname.includes("admin/admin-attendance");
  const isActivityPage = location.pathname.includes("admin/activity-log");
  const isEmployeePage = location.pathname.includes("employee/attendance");

  const resetFilter = () => {
    setFilters({ startDate: "", endDate: "", search: "" });
  };

  const handleDateChange = (date, fieldName) => {
    if (date) {
      const formattedDate = date.toISOString().split("T")[0];
      setFilters((prev) => ({ ...prev, [fieldName]: formattedDate }));
    } else {
      setFilters((prev) => ({ ...prev, [fieldName]: "" }));
    }
  };

  // useEffect(()=>{
  //   console.log("adminAttendance",adminAttendance)
  // },[adminAttendance])

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full bg-[#4f565b] p-3 md:p-2 rounded-md">
      
      {/* LEFT SECTION: Date Filters */}
      <div className="flex flex-row items-center gap-2 w-full md:w-auto justify-between md:justify-start flex-wrap">
        <div className="flex items-center gap-2 text-white bg-[#3f4549] md:bg-transparent px-2 py-1.5 rounded flex-1 md:flex-none justify-center">
          <label className="text-xs md:text-sm font-medium">From:</label>
          <DatePicker
            selected={filters.startDate ? new Date(filters.startDate) : null}
            onChange={(date) => handleDateChange(date, "startDate")}
            placeholderText={todayPlaceholder}
            dateFormat="dd/MM/yyyy"
            className="bg-white text-black px-2 py-1 rounded outline-none w-24 md:w-28 text-xs md:text-sm"
          />
        </div>

        <div className="flex items-center gap-2 text-white bg-[#3f4549] md:bg-transparent px-2 py-1.5 rounded flex-1 md:flex-none justify-center">
          <label className="text-xs md:text-sm font-medium">To:</label>
          <DatePicker
            selected={filters.endDate ? new Date(filters.endDate) : null}
            onChange={(date) => handleDateChange(date, "endDate")}
            placeholderText={todayPlaceholder}
            dateFormat="dd/MM/yyyy"
            className="bg-white text-black px-2 py-1 rounded outline-none w-24 md:w-28 text-xs md:text-sm"
          />
        </div>

        <button
          type="button"
          onClick={resetFilter}
          className="bg-white p-2 rounded shadow-sm hover:bg-gray-200 transition-all flex items-center justify-center h-[32px] w-[32px]"
          title="Reset Filters"
        >
          <HiMiniFunnel className="text-black text-lg" />
        </button>
      </div>

      {/* MIDDLE SECTION: Search */}
      {role === "admin" && (
        <div className="relative w-full md:max-w-[250px] lg:max-w-[300px]">
          <input
            type="text"
            name="search"
            value={filters.search || ""}
            onChange={handleFilterChange}
            placeholder="Search employee..."
            className="w-full border border-gray-300 pl-4 pr-10 py-2 md:py-1.5 rounded outline-none text-sm"
          />
          <IoSearchOutline className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-700 font-bold" />
        </div>
      )}

      {/* RIGHT SECTION: Action Buttons */}
      <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-2 border-t border-gray-500 md:border-none pt-3 md:pt-0">
        
        <button className="flex-1 md:flex-none flex justify-center px-3 py-2 bg-gray-200 rounded hover:bg-white transition-colors" title="Settings">
          <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="16" width="16"><path d="M413.967 276.8c1.06-6.235 1.06-13.518 1.06-20.8s-1.06-13.518-1.06-20.8l44.667-34.318c4.26-3.118 5.319-8.317 2.13-13.518L418.215 115.6c-2.129-4.164-8.507-6.235-12.767-4.164l-53.186 20.801c-10.638-8.318-23.394-15.601-36.16-20.801l-7.448-55.117c-1.06-4.154-5.319-8.318-10.638-8.318h-85.098c-5.318 0-9.577 4.164-10.637 8.318l-8.508 55.117c-12.767 5.2-24.464 12.482-36.171 20.801l-53.186-20.801c-5.319-2.071-10.638 0-12.767 4.164L49.1 187.365c-2.119 4.153-1.061 10.399 2.129 13.518L96.97 235.2c0 7.282-1.06 13.518-1.06 20.8s1.06 13.518 1.06 20.8l-44.668 34.318c-4.26 3.118-5.318 8.317-2.13 13.518L92.721 396.4c2.13 4.164 8.508 6.235 12.767 4.164l53.187-20.801c10.637 8.318 23.394 15.601-36.16 20.801l8.508 55.117c1.069 5.2 5.318 8.318 10.637 8.318h85.098c5.319 0 9.578-4.164 10.638-8.318l8.518-55.117c12.757-5.2 24.464-12.482 36.16-20.801l53.187 20.801c5.318 2.071 10.637 0 12.767-4.164l42.549-71.765c2.129-4.153 1.06-10.399-2.13-13.518l-46.8-34.317zm-158.499 52c-41.489 0-74.46-32.235-74.46-72.8s32.971-72.8 74.46-72.8 74.461 32.235 74.461 72.8-32.972 72.8-74.461 72.8z"></path></svg>
        </button>

        {/* 1. Employee Attendance Excel(Admin Personal View) */}
        {isAttendancePage && (
          <button
            onClick={() => exportToExcel(adminAttendance, null, "My_Attendance")}
            className="flex-1 md:flex-none flex justify-center px-3 py-2 bg-gray-200 rounded hover:bg-green-100 transition-all border border-transparent hover:border-green-400"
            title="Export My Attendance"
          >
            <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 384 512" height="16" width="16"><path d="M224 136V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 0-24-10.8-24-24zm60.1 106.5L224 336l60.1 93.5c5.1 8-.6 18.5-10.1 18.5h-34.9c-4.4 0-8.5-2.4-10.6-6.3C208.9 405.5 192 373 192 373c-6.4 14.8-10 20-36.6 68.8-2.1 3.9-6.1 6.3-10.5 6.3H110c-9.5 0-15.2-10.5-10.1-18.5l60.3-93.5-60.3-93.5c-5.2-8 .6-18.5 10.1-18.5h34.8c4.4 0 8.5 2.4 10.6 6.3 26.1 48.8 20 33.6 36.6 68.5 0 0 6.1-11.7 36.6-68.5 2.1-3.9 6.2-6.3 10.6-6.3H274c9.5-.1 15.2 10.4 10.1 18.4zM384 121.9v6.1H256V0h6.1c6.4 0 12.5 2.5 17 7l97.9 98c4.5 4.5 7 10.6 7 16.9z"></path>
            </svg>
          </button>
        )}

        {/* 2. Admin Full Attendance Excel (Admin Page View) */}
        {isAdminAttendancePage && (
          <button 
            className="flex-1 md:flex-none flex justify-center px-3 py-2 bg-gray-200 rounded hover:bg-blue-100 transition-all border border-transparent hover:border-blue-400"
            onClick={() => exportAdminAttendanceToExcel(singleAdminAttendance, "Admin-Attendance")}
            title="Export Raw Activity Logs"
          >
            <svg className="text-gray-600" stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 384 512" height="16" width="16"><path d="M224 136V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 0-24-10.8-24-24zm60.1 106.5L224 336l60.1 93.5c5.1 8-.6 18.5-10.1 18.5h-34.9c-4.4 0-8.5-2.4-10.6-6.3C208.9 405.5 192 373 192 373c-6.4 14.8-10 20-36.6 68.8-2.1 3.9-6.1 6.3-10.5 6.3H110c-9.5 0-15.2-10.5-10.1-18.5l60.3-93.5-60.3-93.5c-5.2-8 .6-18.5 10.1-18.5h34.8c4.4 0 8.5 2.4 10.6 6.3 26.1 48.8 20 33.6 36.6 68.5 0 0 6.1-11.7 36.6-68.5 2.1-3.9 6.2-6.3 10.6-6.3H274c9.5-.1 15.2 10.4 10.1 18.4zM384 121.9v6.1H256V0h6.1c6.4 0 12.5 2.5 17 7l97.9 98c4.5 4.5 7 10.6 7 16.9z"></path></svg>
          </button>
        )}

        {/* 3. Device Activity Log */}
        {isActivityPage && (
          <button 
            className="flex-1 md:flex-none flex justify-center px-3 py-2 bg-gray-200 rounded hover:bg-blue-100 transition-all border border-transparent hover:border-blue-400"
            onClick={() => exportActivityToExcel(activelogs, "Device_Punch_Activity")}
            title="Export Raw Activity Logs"
          >
            <svg className="text-gray-600" stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 384 512" height="16" width="16"><path d="M224 136V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 0-24-10.8-24-24zm60.1 106.5L224 336l60.1 93.5c5.1 8-.6 18.5-10.1 18.5h-34.9c-4.4 0-8.5-2.4-10.6-6.3C208.9 405.5 192 373 192 373c-6.4 14.8-10 20-36.6 68.8-2.1 3.9-6.1 6.3-10.5 6.3H110c-9.5 0-15.2-10.5-10.1-18.5l60.3-93.5-60.3-93.5c-5.2-8 .6-18.5 10.1-18.5h34.8c4.4 0 8.5 2.4 10.6 6.3 26.1 48.8 20 33.6 36.6 68.5 0 0 6.1-11.7 36.6-68.5 2.1-3.9 6.2-6.3 10.6-6.3H274c9.5-.1 15.2 10.4 10.1 18.4zM384 121.9v6.1H256V0h6.1c6.4 0 12.5 2.5 17 7l97.9 98c4.5 4.5 7 10.6 7 16.9z"></path></svg>
          </button>
        )}

        {/* 4 Employee Individual Attendance */}
        {isEmployeePage && (
          <button
            onClick={() => exportToExcel(employeeAttendance, null, "My_Attendance")}
            className="flex-1 md:flex-none flex justify-center px-3 py-2 bg-gray-200 rounded hover:bg-green-100 transition-all border border-transparent hover:border-green-400"
            title="Export My Attendance"
          >
            <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 384 512" height="16" width="16"><path d="M224 136V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 0-24-10.8-24-24zm60.1 106.5L224 336l60.1 93.5c5.1 8-.6 18.5-10.1 18.5h-34.9c-4.4 0-8.5-2.4-10.6-6.3C208.9 405.5 192 373 192 373c-6.4 14.8-10 20-36.6 68.8-2.1 3.9-6.1 6.3-10.5 6.3H110c-9.5 0-15.2-10.5-10.1-18.5l60.3-93.5-60.3-93.5c-5.2-8 .6-18.5 10.1-18.5h34.8c4.4 0 8.5 2.4 10.6 6.3 26.1 48.8 20 33.6 36.6 68.5 0 0 6.1-11.7 36.6-68.5 2.1-3.9 6.2-6.3 10.6-6.3H274c9.5-.1 15.2 10.4 10.1 18.4zM384 121.9v6.1H256V0h6.1c6.4 0 12.5 2.5 17 7l97.9 98c4.5 4.5 7 10.6 7 16.9z"></path>
            </svg>
          </button>
        )}
        <button className="flex-1 md:flex-none flex justify-center px-3 py-2 bg-gray-200 rounded hover:bg-white transition-colors" title="Add New">
          <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="16" width="16"><path d="M416 208H272V64c0-17.67-14.33-32-32-32h-32c-17.67 0-32 14.33-32 32v144H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h144v144c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32V304h144c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z"></path></svg>
        </button>
      </div>
    </div>
  );
};

export default Filters;