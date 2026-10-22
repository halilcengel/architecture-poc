import type { Action } from "@poc/nuc";

const lines: Record<string, "ACTIVE" | "SUSPENDED"> = {
  "05551112233": "ACTIVE",
  "05554445566": "SUSPENDED",
};

const checkLine: Action = {
  name: "check_line",
  keywords: ["hat", "line"],
  parameters: { lineNumber: /(05\d{9})/ },
  run: ({ lineNumber }) => {
    const status = lineNumber ? lines[lineNumber] : undefined;

    return status
      ? `Line ${lineNumber} is ${status}`
      : `Line ${lineNumber} is not registered`;
  },
};

export default checkLine;
