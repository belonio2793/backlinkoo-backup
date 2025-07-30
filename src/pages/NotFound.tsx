import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );

    // Automatically redirect to home page after logging the error
    navigate('/', { replace: true });
  }, [location.pathname, navigate]);

  return null; // Don't render anything since we're redirecting
};

export default NotFound;
