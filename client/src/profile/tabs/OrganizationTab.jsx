import React, { useContext, useEffect, useState } from "react";
import FormCard from "../../components/FormCard";
import Input from "../../components/Input";
import { getOrganization } from "../../../api/profile";
import { EmployContext } from "../../context/EmployContextProvider";
import { AuthContext } from "../../context/AuthContextProvider";
import Loader from "../../components/Loader";
const OrganizationTab = () => {
  const [org, setOrg] = useState({});
  const [loading, setLoading] = useState(true); // 1. Added loading state
  const { setOrgAddress } = useContext(EmployContext);
  const { token } = useContext(AuthContext);
  
  const user = JSON.parse(localStorage.getItem("user"));
  const emp_id = user?.emp_id;

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const storedToken = localStorage.getItem("token");
  
    const currentToken = token || storedToken; 
    const currentEmpId = emp_id || storedUser?.emp_id;
  
    if (currentToken && currentEmpId) {
      setLoading(true); // Start loading
      getOrganization()
        .then((res) => {
          const orgDetails = res.data?.organizationDetails || res.data?.data || res.data || {};
          setOrg(orgDetails);
          setOrgAddress(orgDetails);
        })
        .catch((err) => {
          console.error("Admin Fetch Error:", err.response?.data || err.message);
        })
        .finally(() => {
          setLoading(false); // 2. Stop loading regardless of success or error
        });
    } else {
      setLoading(false);
      console.warn("Fetch skipped: Missing token or emp_id.");
    }
  }, [token, emp_id]);

  const hiddenFields = ["is_active", "created_at"];
  const displayFields = Object.keys(org).filter((key) => !hiddenFields.includes(key));

  return (
    <FormCard title="">
      {loading ? (
        /* 3. Modern Loading UI */
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', padding: '20px' }}>
           
              <Loader/>
        </div>
      ) : displayFields.length > 0 ? (
        displayFields.map((key) => (
          <Input 
            key={key} 
            label={key.replace("_", " ").toUpperCase()} 
            value={org[key] || "---"} 
            disabled 
          />
        ))
      ) : (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p>No organization records found.</p>
        </div>
      )}
    </FormCard>
  );
};

export default OrganizationTab;