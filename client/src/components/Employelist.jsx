import React, { useContext, useEffect } from 'react';
import { EmployContext } from '../context/EmployContextProvider';
import { NavLink } from 'react-router-dom';
import Loader from './Loader';

const Employelist = () => {
  const { adminAttendance, loading } = useContext(EmployContext);

  const empHeader = [
    { label: "Emp ID", key: "emp_id" },
    { label: "Emp Name", key: "name" },
    { label: "Email", key: "email" },
    // { label: "Status", key: "status" },
    { label: "Action", key: "action" }
  ];

  // useEffect(()=>{

  //   console.log("adminAttendance",adminAttendance)
  // },[adminAttendance])

  // Function to handle the toggle update


  const filteredEmployees = adminAttendance.filter(
    emp => emp.emp_id !== "202500021" && emp.emp_id
  );



  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader/>
      </div>
    );
  }

  return (
    <div className="p-2 md:p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Employee Management</h2>
          <p className="text-sm text-gray-500">View and manage all organization personnel</p>
        </div>
        <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-semibold border border-blue-200 shadow-sm">
          Total Staff: {filteredEmployees.length}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {empHeader.map((header, index) => (
                  <th key={index} className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {header.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-100">
              {filteredEmployees.map((emp) => (
                <tr key={emp.emp_id} className="hover:bg-blue-50/40 transition-colors duration-150">
                  <td className="px-6 py-4">
                    <span className=" text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {emp.emp_id}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">{emp.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{emp.email}</td>
                  

                  {/* STATUS TOGGLE COLUMN */}
                  {/* <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={emp.is_active}
                          onChange={() => handleToggleActive(emp.emp_id, emp.is_active)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                      <span className={`text-xs font-bold ${emp.is_active ? "text-green-700" : "text-red-700"}`}>
                        {emp.is_active ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </div>
                  </td> */}

                  <td className="px-6 py-4">
                    <NavLink
                      to={`/admin/employee-details/${emp.emp_id}`}
                      className="inline-flex items-center px-3 py-1.5 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-600 hover:text-white transition-all duration-200 shadow-sm"
                    >
                      View Profile
                    </NavLink>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Employelist;