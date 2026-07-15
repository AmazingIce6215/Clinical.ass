import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CalculatorCard } from "@/components/calculators/calculator-card";
import { CalculatorEvidencePanel } from "@/components/calculators/calculator-evidence";
import { CalculatorResultDisplay } from "@/components/calculators/calculator-result";
import { CalculatorWorkspace } from "@/components/calculators/calculator-workspace";
import { getCalculator } from "@/lib/calculators/registry";
import type { CalculatorResult } from "@/lib/calculators/types";

const heartCalculator = getCalculator("heart-score");

if (!heartCalculator) throw new Error("HEART calculator fixture is unavailable");

describe("calculator interface", () => {
  test("keeps save and navigation controls as separate interactive elements", async () => {
    const user = userEvent.setup();
    const onToggleFavorite = jest.fn();

    const { container } = render(
      <CalculatorCard
        calculator={heartCalculator}
        isFavorite={false}
        onToggleFavorite={onToggleFavorite}
      />,
    );

    const saveButton = screen.getByRole("button", { name: "Save HEART Score" });
    expect(saveButton.closest("a")).toBeNull();
    expect(container.querySelector("a button")).toBeNull();
    expect(saveButton).toHaveAttribute("aria-pressed", "false");
    expect(saveButton).toHaveClass("motion-reduce:transition-none");

    await user.click(saveButton);
    expect(onToggleFavorite).toHaveBeenCalledWith("heart-score");
    expect(screen.getAllByRole("link", { name: /HEART Score|Open HEART Score/ })).toHaveLength(2);
  });

  test("shows evidence scope, exclusions, review date, and external references", () => {
    render(<CalculatorEvidencePanel evidence={heartCalculator.evidence} />);

    expect(screen.getByRole("heading", { name: "Evidence and scope" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Intended population" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Exclusions and cautions" })).toBeInTheDocument();
    expect(screen.getByText("Original 10-point HEART score")).toBeInTheDocument();
    expect(screen.getByText("2026-07-14")).toHaveAttribute("dateTime", "2026-07-14");

    const references = screen.getAllByRole("link");
    expect(references).toHaveLength(2);
    expect(references[0]).toHaveAttribute("target", "_blank");
    expect(references[0]).toHaveAttribute("rel", "noreferrer");
  });

  test("validates missing inputs and calculates without render-time state mutation", async () => {
    const user = userEvent.setup();
    render(<CalculatorWorkspace slug="heart-score" />);

    await user.click(screen.getByRole("button", { name: "Calculate" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Complete the following fields");

    await user.selectOptions(screen.getByLabelText("History (typical chest pain features)"), "0");
    await user.selectOptions(screen.getByLabelText("ECG"), "0");
    await user.selectOptions(screen.getByLabelText("Age"), "0");
    await user.selectOptions(screen.getByLabelText("Risk Factors"), "0");
    await user.selectOptions(screen.getByLabelText("Initial Troponin"), "0");
    await user.click(screen.getByRole("button", { name: "Calculate" }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByText("Lower-risk score band")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Considerations for clinical review" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear result and start again" }));
    expect(screen.getByRole("heading", { name: "No result calculated" })).toBeInTheDocument();
  });

  test("uses neutral educational labels for result guidance", () => {
    const result: CalculatorResult = {
      score: 2,
      maxScore: 5,
      label: "Reference category",
      severity: "moderate",
      interpretation: "Example interpretation.",
      clinicalSignificance: "Example clinical context.",
      limitations: "Example limitation.",
      recommendations: ["Review the finding in context."],
    };

    render(<CalculatorResultDisplay result={result} onReset={jest.fn()} />);

    expect(screen.getByRole("heading", { name: "Considerations for clinical review" })).toBeInTheDocument();
    expect(screen.getByText("Educational interpretation only.", { exact: false })).toBeInTheDocument();
    expect(screen.queryByText("What Should I Do Now?", { exact: false })).not.toBeInTheDocument();
  });

  test("blocks mutually exclusive CHA2DS2-VASc age bands", async () => {
    const user = userEvent.setup();
    render(<CalculatorWorkspace slug="cha2ds2-vasc" />);

    await user.click(screen.getByLabelText("Age ≥ 75 years (+2)"));
    await user.click(screen.getByLabelText("Age 65–74 years (+1)"));
    await user.click(screen.getByRole("button", { name: "Calculate" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Select only one age band");
    expect(screen.getByRole("heading", { name: "No result calculated" })).toBeInTheDocument();
  });
});
