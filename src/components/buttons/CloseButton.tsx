"use client";

import React from "react";
import { useRouter } from "next/navigation";

type CloseButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  onClose?: () => void;
};

const CloseButton: React.FC<CloseButtonProps> = ({
  onClose,
  className,
  type,
  ...rest
}) => {
  const router = useRouter();

  const handleClose = () => {
    if (onClose) onClose();
    else router.back();
  };

  return (
    <button
      type={type ?? "button"}
      onClick={handleClose}
      className={`text-gray-500 hover:text-gray-800 text-4xl ${className || ""}`}
      aria-label="Fechar"
      {...rest}
    >
      ×
    </button>
  );
};

export default CloseButton;