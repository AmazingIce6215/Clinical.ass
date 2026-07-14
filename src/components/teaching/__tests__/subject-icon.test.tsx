import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import { TeachingSubjectIcon } from "@/components/teaching/subject-icon";
import { teachingSubjects } from "@/lib/teaching-subjects";

describe("teaching subject presentation metadata", () => {
  it("uses Lucide icons instead of emoji glyphs", () => {
    for (const subject of teachingSubjects) {
      const { container, unmount } = render(
        <TeachingSubjectIcon name={subject.icon} />,
      );

      expect(container.querySelector("svg")).toBeInTheDocument();
      expect(subject.icon).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
      unmount();
    }
  });
});
