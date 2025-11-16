"use client";

import React from "react";
import { FaSpinner } from "react-icons/fa";
import Link from "next/link";

type CustomButtonProps = {
  label: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  href?: string;
  variant: "primary" | "secondary";
  isLoading: boolean;
  size: "small" | "medium" | "large";
  message?: string;
  className?: string;
  /** permite usar dentro de <form> */
  type?: "button" | "submit" | "reset";
};

const CustomButton: React.FC<CustomButtonProps> = ({
  label,
  onClick,
  href,
  variant,
  isLoading,
  size,
  message,
  className = "",
  type = "button",
}) => {
  const baseStyles =
    "text-white rounded-md flex items-center justify-center transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";
  const sizeStyles =
    size === "small"
      ? "px-3 py-2 text-sm"
      : size === "medium"
      ? "px-6 py-2"
      : "w-full px-6 py-3";
  const variantStyles =
    variant === "primary"
      ? "bg-[#359293] hover:bg-[#2b797a] focus-visible:outline-[#2b797a]"
      : "bg-[#EC5B20] hover:bg-[#d44c19] focus-visible:outline-[#d44c19]";
  const disabledStyles = isLoading
    ? "opacity-60 cursor-not-allowed pointer-events-none"
    : "disabled:opacity-50 disabled:cursor-not-allowed";
  const hoverStyles = "hover:scale-105";
  const buttonStyles = `${baseStyles} ${sizeStyles} ${variantStyles} ${hoverStyles} ${disabledStyles} ${className}`.trim();

  const inner = isLoading ? (
    <div className="flex items-center">
      <FaSpinner className="animate-spin mr-2" />
      <span>Carregando...</span>
    </div>
  ) : (
    label
  );

  if (href) {
    return (
      <>
        <Link
          href={href}
          className={buttonStyles}
          aria-disabled={isLoading || undefined}
          tabIndex={isLoading ? -1 : undefined}
        >
          {inner}
        </Link>
        {message && !isLoading && <p className="text-red-500 text-sm mt-2">{message}</p>}
      </>
    );
  }

  return (
    <>
      <button
        onClick={onClick}
        className={buttonStyles}
        disabled={isLoading}
        type={type}
        aria-busy={isLoading || undefined}
      >
        {inner}
      </button>
      {message && !isLoading && <p className="text-red-500 text-sm mt-2">{message}</p>}
    </>
  );
};

export default CustomButton;
