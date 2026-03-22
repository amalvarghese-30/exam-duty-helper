import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { GraduationCap, Shield } from 'lucide-react';

export default function Auth() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (user && role) {
    return <Navigate to={role === 'admin' ? '/admin' : '/teacher'} replace />;
  }
  if (user && !role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Account Pending</CardTitle>
            <CardDescription>
              Your account has been created but no role has been assigned yet.
              Please contact the Exam Cell administrator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignOutButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary">
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            AI Exam Duty Allocation
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Smart exam invigilation management
          </p>
        </div>

        <Card className="shadow-lg border-border/60">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 m-0 rounded-b-none">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="p-0">
              <LoginForm />
            </TabsContent>
            <TabsContent value="register" className="p-0">
              <RegisterForm />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}

function LoginForm() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast.error(error.message);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="login-email">Email</Label>
        <Input id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@university.edu" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="login-password">Password</Label>
        <Input id="login-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  );
}

function RegisterForm() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signUp(email, password, fullName);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Account created! Please check your email to verify.');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reg-name">Full Name</Label>
        <Input id="reg-name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Dr. Jane Smith" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-email">Email</Label>
        <Input id="reg-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@university.edu" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-password">Password</Label>
        <Input id="reg-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" required minLength={6} />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Creating account...' : 'Create Account'}
      </Button>
    </form>
  );
}

function SignOutButton() {
  const { signOut } = useAuth();
  return (
    <Button variant="outline" className="w-full" onClick={signOut}>
      Sign Out
    </Button>
  );
}
