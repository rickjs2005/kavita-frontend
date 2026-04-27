import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import OfflineEmptyState from "@/app/motorista/_components/OfflineEmptyState";

describe("OfflineEmptyState", () => {
  it("renders headline, secondary copy and retry button", () => {
    render(<OfflineEmptyState onRetry={() => {}} />);

    expect(
      screen.getByText(/Você está sem internet e ainda não temos dados/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/suas ações vão sincronizar automaticamente/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /tentar novamente/i }),
    ).toBeInTheDocument();
  });

  it("calls onRetry once when the button is clicked", () => {
    const onRetry = vi.fn();
    render(<OfflineEmptyState onRetry={onRetry} />);

    fireEvent.click(screen.getByRole("button", { name: /tentar novamente/i }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("disables the button and shows a spinner when isRetrying is true", () => {
    const onRetry = vi.fn();
    render(<OfflineEmptyState onRetry={onRetry} isRetrying />);

    const button = screen.getByRole("button", { name: /tentando/i });
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(onRetry).not.toHaveBeenCalled();
  });
});
