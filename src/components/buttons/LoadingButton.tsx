"use client";

import React from "react";
import { FaSpinner } from "react-icons/fa";
import clsx from "clsx";

export interface LoadingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean;
  children: React.ReactNode;
}

const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading,
  children,
  disabled,
  className,
  type = "button",
  ...props
}) => {
  return (
    <button
      type={type}
      disabled={isLoading || disabled}
      className={clsx(
        // base
        "inline-flex items-center justify-center gap-2",
        "px-4 py-2 sm:px-5 sm:py-2.5",
        "rounded-xl font-semibold",
        "transition-colors duration-150",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#EC5B20]",
        "disabled:opacity-60 disabled:cursor-not-allowed",

        // cores / estados
        isLoading
          ? "bg-gray-400 cursor-wait"
          : "bg-[#EC5B20] hover:bg-[#c94a16] text-white",

        className
      )}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <FaSpinner className="animate-spin" aria-hidden="true" />
          <span>Carregando...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default LoadingButton;
