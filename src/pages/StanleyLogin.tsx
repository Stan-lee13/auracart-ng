import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ShieldCheck } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function StanleyLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [assignRole, setAssignRole] = useState(true);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();

    const sanitizedUsername = username.trim();
    if (sanitizedUsername.toLowerCase() !== "stanleyvic13@gmail.com") {
      toast.error("Only Stanleyvic13@gmail.com is authorized to register as admin.");
      return;
    }

    if (!password || password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting admin setup for:', sanitizedUsername);
      const { data, error } = await supabase.functions.invoke('admin-setup', {
        body: { username: sanitizedUsername, password, assignRole }
      });

      if (error) {
        console.error('Edge Function Error (Setup):', error);

        // Try to get the JSON error message from the response body
        if (error.context && typeof error.context.json === 'function') {
          try {
            const errorBody = await error.context.json();
            throw new Error(errorBody.error || errorBody.message || error.message);
          } catch (e) {
            throw error;
          }
        }
        throw error;
      }

      if (data.success) {
        toast.success(data.message ?? "Admin account created.");

        if (assignRole) {
          if (data.roleAssigned) {
            toast.success("Admin role assigned to your Supabase profile.");
          } else if (data.assignRoleAttempted) {
            toast.warning(data.roleAssignmentMessage ?? "Role assignment attempted but not confirmed.");
          } else {
            toast.info(data.roleAssignmentMessage ?? "Role assignment skipped.");
          }
        } else {
          toast.info("Role assignment skipped. You can assign it later via admin login.");
        }

        setActiveTab("login");
      } else {
        toast.error(data.message ?? "Admin setup failed.");
      }
    } catch (error: unknown) {
      console.error('Setup catch block:', error);
      const message = error instanceof Error ? error.message : "Setup failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const sanitizedUsername = username.trim();
    if (!sanitizedUsername || !password) {
      toast.error("Please enter username and password");
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting admin login for:', sanitizedUsername);
      const { data, error } = await supabase.functions.invoke('admin-login', {
        body: { username: sanitizedUsername, password }
      });

      if (error) {
        console.error('Edge Function Error (Login):', error);

        // Try to get the JSON error message from the response body
        if (error.context && typeof error.context.json === 'function') {
          try {
            const errorBody = await error.context.json();
            throw new Error(errorBody.error || errorBody.message || error.message);
          } catch (e) {
            throw error;
          }
        }
        throw error;
      }

      if (data.success) {
        toast.success(data.message ?? "Admin credentials verified.");

        if (data.roleAssigned) {
          toast.success("Your Supabase profile already has admin access. Proceed to dashboard.");
        } else {
          toast.info("Please sign in with your Supabase account so we can confirm admin access.");
        }

        navigate('/auth');
      } else {
        toast.error(data.message ?? "Invalid credentials");
      }
    } catch (error: unknown) {
      console.error('Login catch block:', error);
      const message = error instanceof Error ? error.message : "Login failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/10 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Stanley Access</CardTitle>
          <CardDescription>
            Enter your credentials to access the admin panel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="setup">Setup Admin</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Email</Label>
                  <Input
                    id="username"
                    type="email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Stanleyvic13@gmail.com"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    'Login'
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="setup">
              <form onSubmit={handleSetup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="setup-username">Email</Label>
                  <Input
                    id="setup-username"
                    type="email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Stanleyvic13@gmail.com"
                    disabled={loading}
                    required
                  />
                  <p className="text-[10px] text-muted-foreground">Note: Only authorized email is accepted.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="setup-password">New Password</Label>
                  <Input
                    id="setup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    'Create Admin Account'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col items-center">
          <p className="text-xs text-muted-foreground mt-2">
            This section is restricted to authorized personnel only.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
