import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // We'll keep this for backward compatibility
    // but now also provide manual navigation options
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Attune Platform</h1>
        
        <div className="grid gap-4">
          <Link to="/chat">
            <Button className="w-full py-6 text-lg">
              Go to Chat
            </Button>
          </Link>
          
          <Link to="/test-api">
            <Button variant="outline" className="w-full py-6 text-lg">
              API Connection Test
            </Button>
          </Link>
          
          <Link to="/learn">
            <Button variant="outline" className="w-full py-6 text-lg">
              Learning Resources
            </Button>
          </Link>
          
          <Link to="/you">
            <Button variant="outline" className="w-full py-6 text-lg">
              Your Profile
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
