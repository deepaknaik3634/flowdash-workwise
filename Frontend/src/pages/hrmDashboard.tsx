import { Layout } from "@/components/Layout";
import { AlertCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function HrmDashboard() {
  const [hrmUrl, setHrmUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const tenant_code = import.meta.env.VITE_TENANT_CODE;
  const backend_url = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const loadHrmUrl = async () => {
      try {
        const res = await fetch(
          `${backend_url}/auth/go-to-hrm?tenantCode=${tenant_code}`,
          {
            method: "GET",
            credentials: "include", // 🔥 must include cookies for auth
          }
        );

        console.log(res);

        const data = await res.json();
        console.log("the data",data);

        if (res.ok && data.redirectUrl) {
          setHrmUrl(data.redirectUrl);
        } else if(data.error == "Session expired, login again.") {
          navigate("/login")
        }
      } catch (err: any) {
        console.error("Failed to load HRM URL:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadHrmUrl();
  }, []);

  if (loading) return <p>Loading HRM Dashboard...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
<Layout role="operator">
      <div className="w-full h-[calc(100vh-4rem)] flex items-center justify-center p-0 m-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center text-gray-600">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            <p className="text-sm mt-2">Loading HRM Dashboard...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center text-red-600">
            <AlertCircle className="h-6 w-6" />
            <p className="font-medium mt-2">Failed to load HRM</p>
            <p className="text-xs opacity-80">{error}</p>
          </div>
        ) : hrmUrl ? (
          <iframe
            src={hrmUrl}
            title="HRM Dashboard"
            className="w-full h-full border-0"
            style={{
              display: "block",
            }}
            allow="fullscreen *; geolocation *"
            
          />
        ) : (
          <p className="text-gray-500 text-sm">No HRM Dashboard available.</p>
        )}
      </div>
    </Layout>
  );
}
