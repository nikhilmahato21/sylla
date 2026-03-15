import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const { login, register, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  async function handleLogin(data: LoginForm) {
    try {
      await login(data.email, data.password);
      navigate("/");
    } catch (err) {
      toast({ title: "Login failed", description: (err as Error).message, variant: "destructive" });
    }
  }

  async function handleRegister(data: RegisterForm) {
    try {
      await register(data.name, data.email, data.password);
      navigate("/");
    } catch (err) {
      toast({ title: "Registration failed", description: (err as Error).message, variant: "destructive" });
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Grid pattern bg */}
      <div
        className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(hsl(0 0% 100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-mono text-2xl font-semibold text-foreground">Sylla</h1>
          <p className="font-mono text-[11px] text-muted-foreground tracking-widest mt-1">
            AI SYLLABUS TRACKER
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-xl p-6">
          {/* Tabs */}
          <div className="flex bg-secondary rounded-lg p-1 mb-6">
            {(["login", "register"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setMode(tab)}
                className={`flex-1 py-1.5 text-sm rounded-md transition-all font-mono ${
                  mode === tab
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "login" ? "Sign in" : "Register"}
              </button>
            ))}
          </div>

          {/* Login Form */}
          {mode === "login" && (
            <motion.form
              key="login"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={loginForm.handleSubmit(handleLogin)}
              className="space-y-4"
            >
              <div>
                <label className="block font-mono text-[11px] text-muted-foreground mb-1.5 tracking-wider">
                  EMAIL
                </label>
                <input
                  {...loginForm.register("email")}
                  type="email"
                  placeholder="you@example.com"
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
                {loginForm.formState.errors.email && (
                  <p className="text-destructive text-xs mt-1 font-mono">
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block font-mono text-[11px] text-muted-foreground mb-1.5 tracking-wider">
                  PASSWORD
                </label>
                <input
                  {...loginForm.register("password")}
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </button>
            </motion.form>
          )}

          {/* Register Form */}
          {mode === "register" && (
            <motion.form
              key="register"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={registerForm.handleSubmit(handleRegister)}
              className="space-y-4"
            >
              <div>
                <label className="block font-mono text-[11px] text-muted-foreground mb-1.5 tracking-wider">
                  FULL NAME
                </label>
                <input
                  {...registerForm.register("name")}
                  placeholder="Your name"
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
                {registerForm.formState.errors.name && (
                  <p className="text-destructive text-xs mt-1 font-mono">
                    {registerForm.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block font-mono text-[11px] text-muted-foreground mb-1.5 tracking-wider">
                  EMAIL
                </label>
                <input
                  {...registerForm.register("email")}
                  type="email"
                  placeholder="you@example.com"
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
              <div>
                <label className="block font-mono text-[11px] text-muted-foreground mb-1.5 tracking-wider">
                  PASSWORD
                </label>
                <input
                  {...registerForm.register("password")}
                  type="password"
                  placeholder="Min 8 characters"
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
                {registerForm.formState.errors.password && (
                  <p className="text-destructive text-xs mt-1 font-mono">
                    {registerForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isLoading ? "Creating account..." : "Create account"}
              </button>
            </motion.form>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4 font-mono">
          AI-powered study tracking for serious students
        </p>
      </motion.div>
    </div>
  );
}
