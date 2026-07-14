import React from "react";
import { render, screen } from "@testing-library/react";
import { CaseSidebar } from "../case-sidebar";
import type { PatientCase } from "@/lib/types";

const patientCase: PatientCase = {
  name: "",
  sex: "",
  age: null,
  chiefComplaints: [],
  history: {},
  exam: {},
  investigations: [],
};

describe("CaseSidebar AI errors", () => {
  it("does not expose provider configuration or quota details", () => {
    render(
      <CaseSidebar
        patientCase={patientCase}
        aiError="GROQ_API_KEY is missing and the provider quota was exceeded"
      />,
    );

    expect(screen.queryByText(/GROQ_API_KEY/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/provider quota/i)).not.toBeInTheDocument();
    expect(screen.getAllByRole("alert")[0]).toHaveTextContent(
      /AI suggestions are temporarily unavailable/i,
    );
  });
});
