"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

interface LoginButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  href?: string;
}

/**
 * Simple Discord login trigger that redirects to the backend auth flow.
 */
export function LoginButton({
  label = "Login with Discord",
  href = "/api/auth/discord/login",
  className,
  disabled,
  ...props
}: LoginButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleClick = () => {
    setIsLoading(true);
    window.location.href = href;
  };

  return (
    <Button
      type="button"
      variant="neon"
      size="sm"
      className={className}
      onClick={handleClick}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Redirecting...</span>
        </>
      ) : (
        <span>{label}</span>
      )}
    </Button>
  );
}
