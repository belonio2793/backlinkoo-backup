import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { AuthService } from "@/services/authService";
import { validateEmail, validatePassword, validateRequired } from "@/utils/authValidation";

export const useAuthForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (email: string, password: string, onSuccess?: (user: any) => void) => {
    if (!email || !password) {
      toast({
        title: "Missing credentials",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    if (!validateEmail(email)) {
      toast({
        title: "Invalid email format",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await AuthService.signIn({ email, password });
      if (result.success) {
        toast({
          title: "Welcome back!",
          description: `Signing in as ${email}`,
        });
        onSuccess?.(result.user);
        return { success: true, user: result.user };
      } else {
        toast({
          title: "Sign in failed",
          description: result.error || "Invalid email or password.",
          variant: "destructive",
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      toast({
        title: "Sign in failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return { success: false, error: "Unexpected error" };
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (
    email: string, 
    password: string, 
    confirmPassword: string, 
    firstName: string,
    onSuccess?: (user: any) => void
  ) => {
    // Validate all fields
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);
    const nameValidation = validateRequired(firstName, "First name");

    if (!emailValidation) {
      toast({
        title: "Invalid email format",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    if (!passwordValidation.isValid) {
      toast({
        title: "Password requirements not met",
        description: passwordValidation.message,
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }

    if (!nameValidation.isValid) {
      toast({
        title: "Required field missing",
        description: nameValidation.message,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await AuthService.signUp({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
      });

      if (result.success) {
        if (result.requiresEmailVerification) {
          toast({
            title: "Account created! Check your email",
            description: "We've sent you a confirmation link to verify your account.",
          });
        } else {
          toast({
            title: "Account created successfully!",
            description: "Your account has been created and verified.",
          });
        }
        onSuccess?.(result.user);
        return { success: true, user: result.user };
      } else {
        toast({
          title: "Sign up failed",
          description: result.error || "An error occurred during sign up.",
          variant: "destructive",
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      toast({
        title: "Sign up failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return { success: false, error: "Unexpected error" };
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (email: string) => {
    if (!validateEmail(email)) {
      toast({
        title: "Invalid email format",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await AuthService.resetPassword(email);
      if (result.success) {
        toast({
          title: "Password reset email sent!",
          description: "Check your email for password reset instructions.",
        });
        return { success: true };
      } else {
        toast({
          title: "Reset failed",
          description: result.error || "Failed to send reset email.",
          variant: "destructive",
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      toast({
        title: "Reset failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return { success: false, error: "Unexpected error" };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    handleLogin,
    handleSignup,
    handleForgotPassword
  };
};
