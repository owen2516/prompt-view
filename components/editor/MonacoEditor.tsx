"use client";

import Editor from "@monaco-editor/react";

export function MonacoEditor({
  language,
  value,
  onChange,
  readOnly,
  height = "100%",
}: {
  language: string;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  height?: string;
}) {
  return (
    <Editor
      height={height}
      language={language}
      value={value}
      onChange={(v) => onChange?.(v ?? "")}
      options={{
        readOnly: !!readOnly,
        minimap: { enabled: false },
        fontSize: 13,
        scrollBeyondLastLine: false,
        automaticLayout: true,
      }}
      theme="vs-dark"
    />
  );
}
