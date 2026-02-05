import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useParams } from "react-router-dom";
import { EmployContext } from "../context/EmployContextProvider";

const TABS = [
  { key: "personal", label: "Personal Info" },
  { key: "contact", label: "Contact" },
  { key: "education", label: "Education" },
  { key: "experience", label: "Experience" },
  { key: "bank", label: "Bank Details" },
  { key: "documents", label: "Documents" },
];

const DataField = ({ label, value, highlight = false }) => (
  <div className="flex flex-col border-b border-gray-100 py-2">
    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
    <span className={`text-sm ${highlight ? "text-blue-600 font-bold" : "text-gray-800"}`}>
      {value || "—"}
    </span>
  </div>
);

const DocumentRow = ({ label, file }) => {
  if (!file) return <span className="text-gray-400 italic text-sm">Not Uploaded</span>;
  const isPdf = file.toLowerCase().endsWith(".pdf");
  return (
    <div className="flex items-center gap-3 p-2 bg-gray-50 rounded border border-dashed border-gray-300">
      {isPdf ? (
        <a href={file} target="_blank" rel="noreferrer" className="text-blue-600 font-medium text-sm hover:underline flex items-center gap-2">
          📄 View {label}
        </a>
      ) : (
        <img src={file} alt={label} className="w-16 h-16 object-cover rounded shadow-sm" />
      )}
    </div>
  );
};

const EmployeeDetails = () => {
  const { emp_id } = useParams();
  const token = localStorage.getItem("token");
  const [activeTab, setActiveTab] = useState("personal");
  const [personal, setPersonal] = useState({});
  const [contact, setContact] = useState([]);
  const [education, setEducation] = useState([]);
  const [experience, setExperience] = useState([]);
  const [bank, setBank] = useState([]);
  const [documents, setDocuments] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const [isToggling, setIsToggling] = useState(false);
  // const [isActive,setIsActive] = useState(null);

  const { setAdminAttendance, adminAttendance } = useContext(EmployContext);

  // DERIVED STATE: The source of truth for the UI

 // 1. Remove [isActive, setIsActive] = useState(null);
// Instead, derive it from the personal state or context
const isActive = personal.is_active ?? true; 

// 2. Updated activeEmp to sync context with local state
const syncStatusFromContext = () => {
  if (!adminAttendance || !emp_id) return;
  
  // Use .find() to get the object, not .filter() which returns an array
  const currentEmp = adminAttendance.find((emp) => String(emp.emp_id) === String(emp_id));
  
  if (currentEmp) {
    // Sync the personal state with the global context status
    setPersonal(prev => ({ ...prev, is_active: currentEmp.is_active }));
  }
};

// 3. Effect logic
useEffect(() => {
  fetchEmployeeDetails();
}, [emp_id]);

// Sync from context only when the global list changes
useEffect(() => {
  syncStatusFromContext();
}, [adminAttendance]);

const fetchEmployeeDetails = async () => {
  if (!emp_id) return;
  try {
    const headers = { Authorization: `Bearer ${token}` };
    
    // Using allSettled so one failure doesn't kill the whole process
    const results = await Promise.allSettled([
      axios.get(`http://localhost:5000/api/employee/profile/personal/${emp_id}`, { headers }),
      axios.get(`http://localhost:5000/api/employee/profile/contact/${emp_id}`, { headers }),
      axios.get(`http://localhost:5000/api/employee/profile/education/${emp_id}`, { headers }),
      axios.get(`http://localhost:5000/api/employee/profile/experience/${emp_id}`, { headers }),
      axios.get(`http://localhost:5000/api/employee/profile/bank/${emp_id}`, { headers }),
      axios.get(`http://localhost:5000/api/employee/profile/bank/doc/${emp_id}`, { headers }),
    ]);

    // Check if ANY request failed
    const someFailed = results.some(result => result.status === 'rejected');
    if (someFailed) {
      toast.error("Some profile sections failed to load. Please refresh.");
    }

    // Helper to safely get data even if the promise failed
    const getData = (index, defaultValue = {}) => 
      results[index].status === 'fulfilled' ? results[index].value.data : defaultValue;

    // Destructure fulfilled data
    const pData = getData(0);
    const cData = getData(1, { contacts: [] });
    const eduData = getData(2, { education: [] });
    const expData = getData(3, { experience: [] });
    const bData = getData(4, { bankDetails: [] });
    const dData = getData(5, { documents: [] });

    // 1. Personal
    if (pData.emp_id && pData.is_active === undefined) {
      pData.is_active = true;
    }
    setPersonal(pData);

    // 2. Others
    setContact(cData.contacts || []);
    setEducation(eduData.education || []);
    setExperience(expData.experience || []);
    setBank(bData.bankDetails || []);

    // 3. Documents
    const docObj = {};
    (dData.documents || []).forEach((doc) => { 
      docObj[doc.file_type] = doc.file_path; 
    });
    setDocuments(docObj);

  } catch (err) {
    console.error("Critical error fetching details:", err);
    toast.error("System error occurred while loading profile.");
  }
};

  useEffect(() => { fetchEmployeeDetails(); }, [emp_id]);

  const handleToggleActive = async () => {
    if (!emp_id) {
      toast.error("No Employee ID found in URL");
      return;
    }
  
    setIsToggling(true);
  
    try {
      // Toggle current derived state
      const newStatus = !isActive;
  
      // 1. Perform the PATCH Update to DB
      const response = await fetch(`http://localhost:5000/api/admin/attendance/${emp_id}/status`, {
        method: 'PATCH',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ is_active: newStatus }),
      });
  
      if (!response.ok) throw new Error("Update failed");
  
      // 2. Update Local Personal State (Persists UI change)
      setPersonal(prev => ({ ...prev, is_active: newStatus }));
      
      // 3. Update Global Context (Persists change in the main Admin list)
      if (adminAttendance) {
        setAdminAttendance(prev => 
          prev.map(emp => String(emp.emp_id) === String(emp_id) ? { ...emp, is_active: newStatus } : emp)
        );
      }
  
      toast.success(`Employee ${newStatus ? 'Activated' : 'Deactivated'}`);
    } catch (error) {
      console.error("Toggle failed:", error);
      toast.error("Could not update status.");
    } finally {
      setIsToggling(false);
    }
  };

  const handleDownload = async (imageUrl) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const filename = imageUrl.split('/').pop().split('?')[0]; 
      link.setAttribute("download", filename || "document.png");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen p-4 lg:p-8">
      {/* Header Section */}
      <div className="max-w-6xl mx-auto bg-white rounded-t-xl shadow-sm border-b border-gray-200 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">{personal.name || "Employee Profile"}</h1>
            <p className="text-blue-600 font-mono text-sm tracking-widest uppercase">EMP-ID: {emp_id}</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-3 bg-white px-3 py-2 rounded-lg border border-gray-200 transition-all ${isToggling ? 'opacity-50 pointer-events-none' : 'hover:border-gray-300'}`}>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={isActive} 
                  onChange={handleToggleActive}
                  disabled={isToggling}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>

              <span className={`text-[10px] tracking-wider font-bold w-14 ${isActive ? "text-green-600" : "text-red-500"}`}>
                {isActive ? "ACTIVE" : "INACTIVE"}
              </span>
              
              {isToggling && <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>}
            </div>
          </div>
        </div>

        <div className="flex gap-1 mt-8 overflow-x-auto no-scrollbar border-b border-gray-200">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`px-6 py-3 text-sm font-medium transition-all duration-200 whitespace-nowrap border-b-2 ${
                activeTab === tab.key ? "border-blue-600 text-blue-600 bg-blue-50/50" : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Body */}
      <div className="max-w-6xl mx-auto bg-white rounded-b-xl shadow-sm p-6 min-h-[400px]">
        {activeTab === "personal" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-4">
            <DataField label="Full Name" value={personal.name} highlight />
            <DataField label="Employee ID" value={personal.emp_id} highlight />
            <DataField label="Official Email" value={personal.email} />
            <DataField label="Department" value={personal.department} highlight />
            <DataField label="Designation / Role" value={personal.role} />
            <DataField label="Employment Status" value={isActive ? "Active" : "Inactive"} />
            <DataField label="Date of Birth" value={personal.dob} />
            <DataField label="Date of Joining" value={personal.joining_date} />
            <DataField label="Gender" value={personal.gender} />
            <DataField label="Marital Status" value={personal.maritalstatus} />
            <DataField label="Nationality" value={personal.nationality} />
            <DataField label="Blood Group" value={personal.bloodgroup} />
            <DataField label="Aadhaar Number" value={personal.aadharnumber} />
            <div className="md:col-span-2 lg:col-span-3">
                <DataField label="Residential Address" value={personal.address} />
            </div>
          </div>
        )}

        {/* ... Rest of your tabs logic remains same ... */}
        {activeTab === "contact" && (
           <div className="overflow-hidden border border-gray-200 rounded-lg shadow-sm">
             <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Relation</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100 text-sm text-gray-700">
                  {contact.map((c, i) => (
                    <tr key={i} className="hover:bg-blue-50/30">
                      <td className="px-6 py-4 font-semibold text-gray-600">{c.contact_type}</td>
                      <td className="px-6 py-4">{c.email}</td>
                      <td className="px-6 py-4 font-mono">{c.phone}</td>
                      <td className="px-6 py-4 italic">{c.relation}</td>
                    </tr>
                  ))}
                </tbody>
             </table>
           </div>
        )}

        {activeTab === "education" && (
          <div className="overflow-hidden border border-gray-200 rounded-lg shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Degree</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Institution</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Field</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Year</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Result</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100 text-sm text-gray-700">
                {education.map((edu, i) => (
                  <tr key={i} className="hover:bg-blue-50/30">
                    <td className="px-6 py-4 font-semibold">{edu.degree}</td>
                    <td className="px-6 py-4 text-gray-500">{edu.institution_name}</td>
                    <td className="px-6 py-4 text-gray-500">{edu.field_of_study}</td>
                    <td className="px-6 py-4">{edu.passing_year}</td>
                    <td className="px-6 py-4 font-bold text-gray-500">{edu.percentage_or_grade} %</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "experience" && (
          <div className="overflow-hidden border border-gray-200 rounded-lg shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Designation</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Years</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100 text-sm text-gray-700">
                {experience.map((exp, i) => (
                  <tr key={i} className="hover:bg-blue-50/30">
                    <td className="px-6 py-4 font-semibold text-gray-900">{exp.company_name}</td>
                    <td className="px-6 py-4 text-gray-600 font-medium">{exp.designation}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {exp.start_date ? new Date(exp.start_date).toLocaleDateString() : 'N/A'} - 
                      {exp.end_date ? new Date(exp.end_date).toLocaleDateString() : 'Present'}
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-bold">{parseInt(exp.total_years) || 0} Yrs</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "bank" && (
          <div className="space-y-6">
            {bank.map((b, i) => (
              <div key={i} className="p-4 border border-blue-100 bg-blue-50/20 rounded-lg grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <DataField label="Account Holder" value={b.account_holder_name} />
                <DataField label="Bank Name" value={b.bank_name} />
                <DataField label="Account No" value={b.account_number} highlight />
                <DataField label="IFSC Code" value={b.ifsc_code} />
                <DataField label="Branch" value={b.branch_name} />
                <DataField label="Type" value={b.account_type} />
                <DataField label="PAN Number" value={b.pan_number} />
              </div>
            ))}
          </div>
        )}

        {activeTab === "documents" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {["aadhaar", "pan", "passbook", "address_proof"].map((key) => {
              const imageUrl = documents[key] ? `http://localhost:5000${documents[key]}` : null;
              return (
                <div 
                  key={key} 
                  className="p-4 border border-gray-100 rounded-lg bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => imageUrl && setPreviewImage(imageUrl)}
                >
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">{key.replace("_", " ")}</h4>
                  <DocumentRow label={key.toUpperCase()} file={imageUrl} />
                </div>
              );
            })}
          </div>
        )}

        {previewImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 transition-opacity" onClick={() => setPreviewImage(null)}>
            <div className="absolute top-5 right-10 flex gap-4" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => handleDownload(previewImage)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium text-sm">
                Download
              </button>
              <button className="text-white text-4xl leading-none hover:text-gray-300 transition-colors" onClick={() => setPreviewImage(null)}>
                &times;
              </button>
            </div>
            <img src={previewImage} alt="Preview" className="max-w-[85%] max-h-[85%] object-contain" onClick={(e) => e.stopPropagation()} />
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDetails;