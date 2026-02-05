import React, { useState } from "react";
import { addEmploy } from "../../services/authServices";
import { toast } from "react-hot-toast";

const AddEmploy = () => {
  const initialFormState = {
    name: "",
    email: "",
    password: "",
    emp_id: "",
    role: "employee",
    is_active: true,
    shift_id: 3,
    dob: "",
    gender: "",
    department: "",
    joining_date: "",
    maritalstatus: "",
    nominee: "",
    aadharnumber: "",
    bloodgroup: "",
    nationality: "",
    address: "",
    profile_image: null,
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    // Clear error for specific field
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));

    if (type === "file") {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const validate = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.name.trim()) newErrors.name = "Full Name is required";
    if (!formData.emp_id.trim()) newErrors.emp_id = "Employee ID is required";
    if (!formData.department.trim()) newErrors.department = "Department is required";
    if (!formData.role) newErrors.role = "Role is required";
    
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Minimum 6 characters required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddEmp = async (e) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);
      
      const data = new FormData();
      
      // Correctly appending data
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null && formData[key] !== undefined) {
          data.append(key, formData[key]);
        }
      });

      console.log("Formdata",data)
      // Verification log (FormData looks empty in standard console.log)
      console.log("--- Sending Payload ---");
      for (let [key, value] of data.entries()) {
        console.log(`${key}:`, value);
      }

      await addEmploy(data);
      toast.success("New Employee Record Created Successfully!");
      
      setFormData(initialFormState);
      setErrors({});
      
    } catch (error) {
      console.error("Submission Error:", error);
      toast.error(error.response?.data?.message || "Failed to sync employee data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto mt-0 sm:mt-10 mb-10 sm:mb-20 px-0 sm:px-4 font-sans text-gray-800">
    <div className="bg-white rounded-none sm:rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      
      {/* ERP Header */}
      <div className="px-6 py-5 bg-gray-50 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 tracking-tight">Onboard New Employee</h2>
          <p className="text-sm text-gray-500">Fill in all details to generate employee profile</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border sm:border-none">
          <span className="text-xs font-semibold text-gray-400 uppercase">Status:</span>
          <input
            type="checkbox"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            className="w-5 h-5 accent-green-600 cursor-pointer"
          />
          <span className="text-sm font-medium text-gray-700">Active Account</span>
        </div>
      </div>

      <form onSubmit={handleAddEmp} className="p-6 sm:p-8 space-y-10">
        
        {/* Section 1: Authentication */}
        <section>
          <h3 className="text-xs sm:text-sm font-bold text-blue-600 uppercase tracking-widest mb-6 flex items-center gap-2">
            <span className="w-8 h-px bg-blue-200"></span> Basic Credentials
          </h3>

          {/* Responsive Grid: 1 col on mobile, 2 on tablet, 3 on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            <Input label="Full Name *" name="name" value={formData.name} onChange={handleChange} error={errors.name} placeholder="John Doe" />
            <Input label="Email Address *" name="email" type="email" value={formData.email} onChange={handleChange} error={errors.email} placeholder="john@company.com" />
            <Input label="System Password *" name="password" type="password" value={formData.password} onChange={handleChange} error={errors.password} placeholder="••••••••" />
            <Input label="Employee ID *" name="emp_id" value={formData.emp_id} onChange={handleChange} error={errors.emp_id} placeholder="202500028" />
            <Input label="Department *" name="department" value={formData.department} onChange={handleChange} error={errors.department} placeholder="IT / Engineering" />
            <Input label="Nationality" name="nationality" value={formData.nationality} onChange={handleChange} placeholder="Indian" />

            <div className="flex flex-col">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-tight">Role *</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={`w-full rounded-lg border px-3 py-2.5 text-base sm:text-sm bg-white focus:ring-4 outline-none transition-all ${
                  errors.role ? "border-red-500 focus:ring-red-100" : "border-gray-200 focus:ring-blue-100 focus:border-blue-400"
                }`}
              >
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
              {errors.role && <p className="text-[10px] text-red-500 mt-1 font-medium">{errors.role}</p>}
            </div>
          </div>
        </section>

        {/* Section 2: Personal Information */}
        <section>
          <h3 className="text-xs sm:text-sm font-bold text-blue-600 uppercase tracking-widest mb-6 flex items-center gap-2">
            <span className="w-8 h-px bg-blue-200"></span> Personal Information
          </h3>
          {/* Responsive Grid: 1 col on mobile, 2 on tablet, 4 on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            <Input label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleChange} />
            <Select label="Gender" name="gender" value={formData.gender} onChange={handleChange} options={[{v:"Male", l:"Male"}, {v:"Female", l:"Female"}, {v:"Other", l:"Other"}]} />
            <Select label="Marital Status" name="maritalstatus" value={formData.maritalstatus} onChange={handleChange} options={[{v:"Single", l:"Single"}, {v:"Married", l:"Married"}]} />
            <Input label="Blood Group" name="bloodgroup" value={formData.bloodgroup} onChange={handleChange} placeholder="A+" />
            <Input label="Aadhar/National ID" name="aadharnumber" value={formData.aadharnumber} onChange={handleChange} placeholder="0000 0000 0000" />
            <Input label="Joining Date" name="joining_date" type="date" value={formData.joining_date} onChange={handleChange} />
            <div className="sm:col-span-2">
              <Input label="Address" name="address" value={formData.address} onChange={handleChange} placeholder="Full residential address" />
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="pt-8 border-t flex flex-col sm:flex-row justify-end gap-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-10 py-4 sm:py-3 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-nowrap" 
          >
            Confirm & Register
          </button>
        </div>
      </form>
    </div>
  </div>
  );
};

/* Components maintained exactly as requested */
const Input = ({ label, name, type = "text", value, onChange, placeholder, error }) => (
  <div className="flex flex-col">
    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-tight">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-all ${
        error ? "border-red-500 focus:ring-red-100" : "border-gray-200 focus:ring-blue-100 focus:border-blue-400"
      } focus:ring-4`}
    />
    {error && <span className="text-[10px] text-red-500 mt-1 font-medium">{error}</span>}
  </div>
);

const Select = ({ label, name, value, onChange, options }) => (
  <div className="flex flex-col">
    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-tight">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full rounded-lg border-gray-200 border px-3 py-2.5 text-sm bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
    >
      <option value="">Select Option</option>
      {options.map((opt) => (
        <option key={opt.v} value={opt.v}>{opt.l}</option>
      ))}
    </select>
  </div>
);

export default AddEmploy;