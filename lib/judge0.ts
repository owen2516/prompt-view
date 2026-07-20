const JUDGE0_BASE = "https://ce.judge0.com";

// Free, keyless public Judge0 CE instance. IDs pinned to specific runtime
// versions available on that instance as of 2026-07; re-check GET /languages
// if executions start failing with "language not found".
const LANGUAGE_IDS: Record<string, number> = {
  javascript: 102, // Node.js 22.08.0
  typescript: 101, // TypeScript 5.6.2
  python: 100, // Python 3.12.5
  java: 62, // OpenJDK 13.0.1
  cpp: 105, // C++ (GCC 14.1.0)
  go: 107, // Go 1.23.5
};

export function isRunnableLanguage(language: string): boolean {
  return language in LANGUAGE_IDS;
}

type Judge0Result = {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  status: { id: number; description: string };
  time: string | null;
  memory: number | null;
};

async function executeOne(language: string, sourceCode: string, stdin: string): Promise<Judge0Result> {
  const languageId = LANGUAGE_IDS[language];
  if (!languageId) throw new Error(`unsupported_language:${language}`);

  const res = await fetch(`${JUDGE0_BASE}/submissions?base64_encoded=false&wait=true`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language_id: languageId,
      source_code: sourceCode,
      stdin,
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    throw new Error(`judge0_error:${res.status}`);
  }
  return res.json();
}

export type RunOutput = {
  stdout: string;
  stderr: string | null;
  compileOutput: string | null;
  statusDescription: string;
  timedOut: boolean;
};

export async function runOnce(language: string, sourceCode: string, stdin: string): Promise<RunOutput> {
  const result = await executeOne(language, sourceCode, stdin);
  return {
    stdout: result.stdout ?? "",
    stderr: result.stderr,
    compileOutput: result.compile_output,
    statusDescription: result.status.description,
    // Judge0 status id 5 = "Time Limit Exceeded"
    timedOut: result.status.id === 5,
  };
}

export type TestCase = { input: string; expected_output: string; label?: string };

export type TestCaseResult = {
  label?: string;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  error: string | null;
};

export async function runTestCases(
  language: string,
  sourceCode: string,
  testCases: TestCase[]
): Promise<TestCaseResult[]> {
  const results: TestCaseResult[] = [];
  // Judge0's free public instance has no documented burst limit, but we run
  // sequentially to stay well inside a mannered rate to avoid getting throttled.
  for (const testCase of testCases) {
    try {
      const output = await runOnce(language, sourceCode, testCase.input);
      const error = output.compileOutput || output.stderr || (output.timedOut ? "執行逾時" : null);
      const actualOutput = output.stdout.trim();
      results.push({
        label: testCase.label,
        input: testCase.input,
        expectedOutput: testCase.expected_output,
        actualOutput,
        passed: !error && actualOutput === testCase.expected_output.trim(),
        error,
      });
    } catch (e) {
      results.push({
        label: testCase.label,
        input: testCase.input,
        expectedOutput: testCase.expected_output,
        actualOutput: "",
        passed: false,
        error: e instanceof Error ? e.message : "execution_failed",
      });
    }
  }
  return results;
}
