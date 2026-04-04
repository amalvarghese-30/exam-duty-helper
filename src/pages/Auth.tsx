import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { GraduationCap, Sparkles, User, Mail, Lock, Building2, BookOpen } from 'lucide-react';

const API = "http://localhost:3000/api";

export default function Auth() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-950 dark:to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (user && role) {
    return <Navigate to={role === 'admin' ? '/admin' : '/teacher'} replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="w-full max-w-md animate-fade-in">

        {/* Logo & Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 shadow-xl">
            <GraduationCap className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent dark:from-white dark:to-slate-300">
            Exam Duty AI
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Smart AI-powered exam invigilation management
          </p>
        </div>

        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-t-xl rounded-b-none bg-slate-100 dark:bg-slate-800 p-1">
              <TabsTrigger value="login" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900">
                Sign In
              </TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900">
                Sign Up
              </TabsTrigger>
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
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      <div className="space-y-2">
        <Label htmlFor="login-email" className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Email
        </Label>
        <Input
          id="login-email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@university.edu"
          className="rounded-xl"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="login-password" className="flex items-center gap-2">
          <Lock className="h-4 w-4" />
          Password
        </Label>
        <Input
          id="login-password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          className="rounded-xl"
          required
        />
      </div>
      <Button type="submit" className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" disabled={loading}>
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Signing in...
          </div>
        ) : (
          'Sign In'
        )}
      </Button>
    </form>
  );
}

function RegisterForm() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/register`, {
        fullName,
        email,
        password,
        department,
        subject
      });

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('role', response.data.role);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userName', fullName);
        localStorage.setItem('userDepartment', department);
        localStorage.setItem('userSubject', subject);
        toast.success('Account created! Please login.');
        window.location.href = '/';
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reg-name" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Full Name
        </Label>
        <Input
          id="reg-name"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          placeholder="Dr. Jane Smith"
          className="rounded-xl"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reg-email" className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Email
        </Label>
        <Input
          id="reg-email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@university.edu"
          className="rounded-xl"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reg-department" className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Department
        </Label>
        <Input
          id="reg-department"
          value={department}
          onChange={e => setDepartment(e.target.value)}
          placeholder="e.g., Computer Science"
          className="rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reg-subject" className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Subject
        </Label>
        <Input
          id="reg-subject"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="e.g., Data Structures"
          className="rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reg-password" className="flex items-center gap-2">
          <Lock className="h-4 w-4" />
          Password
        </Label>
        <Input
          id="reg-password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Min 6 characters"
          className="rounded-xl"
          required
          minLength={6}
        />
      </div>

      <Button type="submit" className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700" disabled={loading}>
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Creating account...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Create Account
          </div>
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground mt-4">
        By signing up, you agree to our Terms of Service and Privacy Policy.
      </p>
    </form>
  );
}