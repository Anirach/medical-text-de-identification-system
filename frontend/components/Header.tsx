// @ts-nocheck
import { Link, useLocation } from "react-router-dom";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

export default function Header() {
  const location = useLocation();
  const { isSignedIn } = useUser();

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
              {isSignedIn ? (
                <UserButton />
              ) : (
                <>
                  <SignInButton mode="modal">
                    <Button variant="ghost" size="sm">Sign In</Button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <Button size="sm">Sign Up</Button>
                  </SignUpButton>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
