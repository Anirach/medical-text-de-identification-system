import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, LogOut, User } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function Header() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">Medical De-ID</span>
          </Link>

          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-2">
              <Button
                variant={isActive("/") ? "default" : "ghost"}
                asChild
              >
                <Link to="/">Home</Link>
              </Button>
              <Button
                variant={isActive("/deidentify") ? "default" : "ghost"}
                asChild
              >
                <Link to="/deidentify">De-Identify</Link>
              </Button>
              <Button
                variant={isActive("/batch") ? "default" : "ghost"}
                asChild
              >
                <Link to="/batch">Batch Process</Link>
              </Button>
            </nav>

            <div className="flex items-center gap-2 border-l pl-4">
              {user ? (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4" />
                    <span className="text-muted-foreground">{user.email}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={logout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/login">Sign In</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link to="/signup">Sign Up</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
