import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  House,
  LockKeyhole,
  Book,
  X
} from "lucide-react";
import { SlCalender } from "react-icons/sl";
import SidebarDropdown from "./SidebarDropdown";
import logo from "../assets/ids-logo.png"
import logoIcon from "../assets/IDS-Outline-logo.png"


const SidebarContent = ({ open, setOpen, setMobileOpen, navClass }) => {
  return (
    <>
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b">
        {open && <span className="font-semibold">Admin Attendance</span>}

        {/* Mobile close */}
        <button className="lg:hidden" onClick={() => setMobileOpen(false)}>
          <X />
        </button>
      </div>

      {/* Menu */}
      <nav className="mt-4 space-y-2 px-3 flex-1 overflow-y-auto">
        <NavLink to="/admin" end className={navClass}>
          <House />
          {open && <span>Overview</span>}
        </NavLink>

        {/* Employees Dropdown */}
        <SidebarDropdown
  icon={Book}
  label="Employees"
  openSidebar={open}
  items={[
    { label: "Employee List", path: "/admin/employees" },
    { label: "Add Employee", path: "/admin/add-emp" },
    { label: "Employee Attendance", path: "/admin/attendance" },
  ]}
/>

        <NavLink to="/admin/admin-attendance" className={navClass}>
          <LockKeyhole />
          {open && <span>My Attendance</span>}
        </NavLink>

        <NavLink to="/admin/profile" className={navClass}>
          <SlCalender size={18} />
          {open && <span>My Profile</span>}
        </NavLink>

        <NavLink to="/admin/leaves" className={navClass}>
          <SlCalender size={18} />
          {open && <span>Leave Requests</span>}
        </NavLink>
      </nav>
    </>
  );
};

const AdminSidebar = ({ open, setOpen }) => {
  const navClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2 rounded transition border
     ${
       isActive
         ? "bg-[#222F7D] text-white"
         : "text-black hover:bg-[#222F7D] hover:text-white border-[#dbdbdb]"
     }`;




  return (
<>
  {/* MOBILE OVERLAY (Backdrop) - Only visible when menu is open on mobile */}
  {open && (
    <div 
      className="fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity"
      onClick={() => setOpen(false)}
    />
  )}

  <aside
    className={`
      fixed inset-y-0 left-0 z-40 bg-white shadow-xl
      transform transition-all duration-300 ease-in-out 
      ${open ? "translate-x-0 w-64" : "-translate-x-full w-64"}
      md:static md:translate-x-0 
      ${open ? "md:w-64" : "md:w-20"}
      flex flex-col h-screen
    `}
  >
    {/* Header Section */}
    <div className="flex items-center justify-between px-4 h-16 border-b shrink-0 md:mx-auto">
      <div className="flex items-center gap-3 overflow-hidden">
        {open ? (
          <img src={logo} className="w-[100px] h-[40px] object-contain transition-all" alt="Logo" />
        ) : (
          <div className="flex w-12 justify-center">
            {/* <Book size={24} className="text-[#3a50cc]" /> */}

            <img src={logo} alt="icon" />
          </div>
        )}
      </div>

      {/* Mobile close button - only visible on small screens */}
      <button 
        className="md:hidden p-2 rounded-md hover:bg-gray-100" 
        onClick={() => setOpen(false)}
      >
        <X size={24} />
      </button>
      
      {/* Desktop Toggle Button (Optional: if you want the button inside the header) */}
      <button 
        onClick={() => setOpen(!open)}
        className="hidden md:block p-1 hover:bg-gray-100 rounded"
      >
        {/* You can put a chevron icon here or keep it blank if you use a top-bar toggle */}
      </button>
    </div>

    {/* Navigation Menu */}
    <nav className="mt-4 space-y-1 px-3 flex-1 overflow-y-auto custom-scrollbar">
      <NavLink to="/admin" end className={navClass}>
        <House size={20} className="shrink-0" />
        <span className={`transition-all duration-300 whitespace-nowrap ${!open && "md:hidden"}`}>
          Overview
        </span>
      </NavLink>

      {/* Employees Dropdown - Ensure it handles the 'open' state internally */}
      <SidebarDropdown
        icon={Book}
        label="Employees"
        openSidebar={open}
        items={[
          { label: "Employee List", path: "/admin/employees" },
          { label: "Add Employee", path: "/admin/add-emp" },
          { label: "Employee Attendance", path: "/admin/attendance" },
        ]}
      />

      <NavLink to="/admin/admin-attendance" className={navClass}>
        <LockKeyhole size={20} className="shrink-0" />
        <span className={`transition-all duration-300 whitespace-nowrap ${!open && "md:hidden"}`}>
          My Attendance
        </span>
      </NavLink>

      <NavLink to="/admin/profile" className={navClass}>
        <SlCalender size={18} className="shrink-0" />
        <span className={`transition-all duration-300 whitespace-nowrap ${!open && "md:hidden"}`}>
          My Profile
        </span>
      </NavLink>

      <NavLink to="/admin/activity-logs" className={navClass}>
        <SlCalender size={18} className="shrink-0" />
        <span className={`transition-all duration-300 whitespace-nowrap ${!open && "md:hidden"}`}>
          Attendance Log
        </span>
      </NavLink>

      <NavLink to="/admin/leaves" className={navClass}>
        <SlCalender size={18} className="shrink-0" />
        <span className={`transition-all duration-300 whitespace-nowrap ${!open && "md:hidden"}`}>
          Leave Requests
        </span>
      </NavLink>

      {/* <NavLink to="/admin/reporting" className={navClass}>
        <SlCalender size={18} className="shrink-0" />
        <span className={`transition-all duration-300 whitespace-nowrap ${!open && "md:hidden"}`}>
         Reporting
        </span>
      </NavLink> */}
    </nav>

    {/* Footer Section (Optional) */}
    {open && (
      <div className="p-4 border-t text-center">
        <p className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">I-diligence Solutions</p>
      </div>
    )}
  </aside>
</>
  );
};

export default AdminSidebar;

