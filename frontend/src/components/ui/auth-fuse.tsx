import * as React from "react";
import { useState, useId, useEffect, type ComponentRef, type SyntheticEvent } from "react";
import { Slot } from "@radix-ui/react-slot";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Typewriter ───────────────────────────────────────────────────────────────

export interface TypewriterProps {
  text: string | string[];
  speed?: number;
  cursor?: string;
  loop?: boolean;
  deleteSpeed?: number;
  delay?: number;
  className?: string;
}

export function Typewriter({
  text,
  speed = 100,
  cursor = "|",
  loop = false,
  deleteSpeed = 50,
  delay = 1500,
  className,
}: TypewriterProps) {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [textArrayIndex, setTextArrayIndex] = useState(0);

  const textArray = Array.isArray(text) ? text : [text];
  const currentText = textArray[textArrayIndex] || "";

  useEffect(() => {
    if (!currentText) return;

    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          if (currentIndex < currentText.length) {
            setDisplayText((prev) => prev + currentText[currentIndex]);
            setCurrentIndex((prev) => prev + 1);
          } else if (loop) {
            setTimeout(() => setIsDeleting(true), delay);
          }
        } else {
          if (displayText.length > 0) {
            setDisplayText((prev) => prev.slice(0, -1));
          } else {
            setIsDeleting(false);
            setCurrentIndex(0);
            setTextArrayIndex((prev) => (prev + 1) % textArray.length);
          }
        }
      },
      isDeleting ? deleteSpeed : speed,
    );

    return () => clearTimeout(timeout);
  }, [currentIndex, isDeleting, currentText, loop, speed, deleteSpeed, delay, displayText, text, textArray.length]);

  return (
    <span className={className}>
      {displayText}
      <span className="animate-pulse">{cursor}</span>
    </span>
  );
}

// ─── Label ────────────────────────────────────────────────────────────────────

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

const Label = React.forwardRef<
  ComponentRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

// ─── Button ───────────────────────────────────────────────────────────────────

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-foreground/60 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 rounded-md px-6",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

// ─── Input ────────────────────────────────────────────────────────────────────

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-3 text-sm text-foreground shadow-sm shadow-black/5 transition-shadow placeholder:text-muted-foreground/70 focus-visible:bg-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";

// ─── PasswordInput ────────────────────────────────────────────────────────────

export interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, ...props }, ref) => {
    const id = useId();
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="grid w-full items-center gap-2">
        {label && <Label htmlFor={id}>{label}</Label>}
        <div className="relative">
          <Input
            id={id}
            type={showPassword ? "text" : "password"}
            className={cn("pe-10", className)}
            ref={ref}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="absolute inset-y-0 end-0 flex h-full w-10 items-center justify-center text-muted-foreground/80 transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

// ─── Forms ────────────────────────────────────────────────────────────────────

interface SignInFormProps {
  onSubmit?: (email: string, password: string) => Promise<void>;
}

function SignInForm({ onSubmit }: SignInFormProps) {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    if (!onSubmit) return;
    setLoading(true);
    try {
      await onSubmit(email, password);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignIn} autoComplete="on" className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex items-center gap-2 mb-1">
          <img src="/logo.png" alt="TestPilot" className="h-7 w-7 rounded-md" />
          <span className="text-sm font-semibold text-orange-500 tracking-wide uppercase">TestPilot</span>
        </div>
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Sign in to your account to continue
        </p>
      </div>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </div>
        <PasswordInput
          name="password"
          label="Password"
          required
          autoComplete="current-password"
          placeholder="Your password"
        />
        <Button
          type="submit"
          variant="default"
          className="mt-2 bg-orange-500 hover:bg-orange-600 text-white"
          disabled={loading}
        >
          {loading ? "Signing in…" : "Sign In"}
        </Button>
      </div>
    </form>
  );
}

interface SignUpFormProps {
  onSubmit?: (name: string, email: string, password: string) => Promise<void>;
}

function SignUpForm({ onSubmit }: SignUpFormProps) {
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    if (!onSubmit) return;
    setLoading(true);
    try {
      await onSubmit(name, email, password);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignUp} autoComplete="on" className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex items-center gap-2 mb-1">
          <img src="/logo.png" alt="TestPilot" className="h-7 w-7 rounded-md" />
          <span className="text-sm font-semibold text-orange-500 tracking-wide uppercase">TestPilot</span>
        </div>
        <h1 className="text-2xl font-bold">Create an account</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Start automating your QA workflow today — it's free
        </p>
      </div>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="John Doe"
            required
            autoComplete="name"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </div>
        <PasswordInput
          name="password"
          label="Password"
          required
          autoComplete="new-password"
          placeholder="Min. 8 characters"
        />
        <Button
          type="submit"
          variant="default"
          className="mt-2 bg-orange-500 hover:bg-orange-600 text-white"
          disabled={loading}
        >
          {loading ? "Creating account…" : "Create Account"}
        </Button>
      </div>
    </form>
  );
}

// ─── AuthFormContainer ────────────────────────────────────────────────────────

interface AuthFormContainerProps {
  isSignIn: boolean;
  onToggle: () => void;
  onSignIn?: (email: string, password: string) => Promise<void>;
  onSignUp?: (name: string, email: string, password: string) => Promise<void>;
  onGoogleClick?: () => void;
  googleButton?: React.ReactNode;
}

function AuthFormContainer({
  isSignIn,
  onToggle,
  onSignIn,
  onSignUp,
  onGoogleClick,
  googleButton,
}: AuthFormContainerProps) {
  const showGoogleSection = onGoogleClick || googleButton;

  return (
    <div className="mx-auto grid w-[350px] gap-2">
      {isSignIn ? (
        <SignInForm onSubmit={onSignIn} />
      ) : (
        <SignUpForm onSubmit={onSignUp} />
      )}

      <div className="text-center text-sm mt-1">
        {isSignIn ? "Don't have an account?" : "Already have an account?"}{" "}
        <Button variant="link" className="pl-1 text-orange-500 hover:text-orange-600" onClick={onToggle}>
          {isSignIn ? "Sign up" : "Sign in"}
        </Button>
      </div>

      {showGoogleSection && (
        <>
          <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
            <span className="relative z-10 bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
          {googleButton ? (
            <div className="flex justify-center">{googleButton}</div>
          ) : (
            <Button variant="outline" type="button" onClick={onGoogleClick}>
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="Google"
                className="h-4 w-4"
              />
              Continue with Google
            </Button>
          )}
        </>
      )}
    </div>
  );
}

// ─── AuthUI (main export) ─────────────────────────────────────────────────────

interface AuthContentProps {
  image?: { src: string; alt: string };
  quote?: { text: string; author: string };
}

export interface AuthUIProps {
  initialMode?: "signin" | "signup";
  onSignIn?: (email: string, password: string) => Promise<void>;
  onSignUp?: (name: string, email: string, password: string) => Promise<void>;
  onGoogleClick?: () => void;
  googleButton?: React.ReactNode;
  signInContent?: AuthContentProps;
  signUpContent?: AuthContentProps;
}

const defaultSignInContent: Required<AuthContentProps> = {
  image: {
    src: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&q=80",
    alt: "Circuit board representing automated testing infrastructure",
  },
  quote: {
    text: "Your automated test suite, always ready.",
    author: "TestPilot",
  },
};

const defaultSignUpContent: Required<AuthContentProps> = {
  image: {
    src: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=900&q=80",
    alt: "Code editor showing test automation scripts",
  },
  quote: {
    text: "Ship with confidence. Test everything, automatically.",
    author: "TestPilot",
  },
};

export function AuthUI({
  initialMode = "signin",
  onSignIn,
  onSignUp,
  onGoogleClick,
  googleButton,
  signInContent = {},
  signUpContent = {},
}: AuthUIProps) {
  const [isSignIn, setIsSignIn] = useState(initialMode === "signin");

  const finalSignIn = {
    image: { ...defaultSignInContent.image, ...signInContent.image },
    quote: { ...defaultSignInContent.quote, ...signInContent.quote },
  };
  const finalSignUp = {
    image: { ...defaultSignUpContent.image, ...signUpContent.image },
    quote: { ...defaultSignUpContent.quote, ...signUpContent.quote },
  };

  const current = isSignIn ? finalSignIn : finalSignUp;

  return (
    <div className="w-full min-h-screen md:grid md:grid-cols-2">
      <style>{`
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear { display: none; }
      `}</style>

      {/* Back button */}
      <Link
        to="/"
        className="absolute top-5 left-5 z-50 flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Home
      </Link>

      {/* Form side */}
      <div className="flex h-screen items-center justify-center p-6 md:h-auto md:p-0 md:py-12">
        <AuthFormContainer
          isSignIn={isSignIn}
          onToggle={() => setIsSignIn((p) => !p)}
          onSignIn={onSignIn}
          onSignUp={onSignUp}
          onGoogleClick={onGoogleClick}
          googleButton={googleButton}
        />
      </div>

      {/* Image side */}
      <div
        key={current.image.src}
        className="hidden md:block relative bg-cover bg-center transition-all duration-500 ease-in-out"
        style={{ backgroundImage: `url(${current.image.src})` }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-x-0 bottom-0 h-[140px] bg-gradient-to-t from-black/80 to-transparent" />

        <div className="relative z-10 flex h-full flex-col items-center justify-end p-4 pb-8">
          <blockquote className="space-y-2 text-center text-white max-w-xs">
            <p className="text-lg font-medium leading-snug">
              "
              <Typewriter
                key={current.quote.text}
                text={current.quote.text}
                speed={55}
              />
              "
            </p>
            <cite className="block text-sm font-light text-white/60 not-italic">
              — {current.quote.author}
            </cite>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
