import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@radix-ui/react-separator";
import React, { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { SignInFlow } from "../types";
import { useAuthActions } from "@convex-dev/auth/react";
import { TriangleAlert } from "lucide-react";

interface SignUpCardProps {
  setState: (state: SignInFlow) => void;
}
const SignUpCard = ({ setState }: SignUpCardProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const { signIn } = useAuthActions();
  const handleProviderSignUP = (value: "github" | "google") => {
    setPending(true);
    signIn(value).finally(() => {
      setPending(false);
    });
  };
  const onPasswordSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setError(""); // Clear any previous errors

    // Check if passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setPending(false);
      return;
    }

    // Additional password validation could be added here
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      setPending(false);
      return;
    }

    try {
      await signIn("password", { name, email, password, flow: "signUp" });
    } catch (error: any) {
      // Check if specific error codes or messages are available
      setError("Email already in Use ");
    } finally {
      setPending(false);
    }
  };

  return (
    <Card className="w-full h-full p-8">
      <CardHeader className="px-0 pt-0 ">
        <CardTitle>Sign Up to continue</CardTitle>
        <CardDescription>
          Use your email or another service to continue
        </CardDescription>
      </CardHeader>
      {!!error && (
        <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-x-2 text-small text-destructive mb-2">
          <TriangleAlert className="size-4" />
          <p>{error}</p>
        </div>
      )}

      <CardContent className="space-y-5 px-0 pb-0">
        <form onSubmit={onPasswordSignUp} className="space-y-2.5 ">
          <Input
            disabled={pending}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
            }}
            placeholder="Full Name"
            type="text"
            required
          />
          <Input
            disabled={pending}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
            placeholder="Email"
            type="email"
            required
          />
          <Input
            disabled={pending}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
            placeholder="Password"
            type="password"
            required
          />
          <Input
            disabled={pending}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
            }}
            placeholder="ConfirmPassword"
            type="password"
            required
          />
          <Button className="w-full" size="lg" type="submit" disabled={pending}>
            Continue
          </Button>
        </form>
        <Separator />
        <div className="flex flex-col gap-y-2.5">
          <Button
            onClick={() => handleProviderSignUP("google")}
            variant="outline"
            size="lg"
            className="w-full relative"
            disabled={pending}
          >
            <FcGoogle className="size-5  top-2.5 left-2.5 absolute" />
            Continue with Google
          </Button>
          <Button
            onClick={() => handleProviderSignUP("github")}
            variant="outline"
            size="lg"
            className="w-full relative"
            disabled={pending}
          >
            <FaGithub className="size-5  top-3 left-2.5 absolute" />
            Continue with Github
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Already have an account ?{" "}
          <span
            onClick={() => {
              setState("signIn");
            }}
            className="text-sky-700 hover:underline cursor-pointer"
          >
            Sign In
          </span>
        </p>
      </CardContent>
    </Card>
  );
};

export default SignUpCard;
