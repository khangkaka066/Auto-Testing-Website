import React from "react";

function parseDiff(suggestion) {
  if (!suggestion) return [];

  const raw = suggestion.trim();

  // Before/After block style
  if (/\/\/\s*(before|after)[:\s]/i.test(raw)) {
    const lines = raw.split("\n");
    const result = [];
    let section = "context";
    for (const line of lines) {
      if (/\/\/\s*before[:\s]/i.test(line)) { section = "del"; continue; }
      if (/\/\/\s*after[:\s]/i.test(line))  { section = "add"; continue; }
      result.push({ type: section, content: line });
    }
    return result;
  }

  // Git diff / unified diff style
  const lines = raw.split("\n");
  const hasDiffMarkers = lines.some(l => /^[+\-]/.test(l) && !l.startsWith("+++") && !l.startsWith("---"));
  if (hasDiffMarkers) {
    return lines
      .filter(l => !l.startsWith("+++") && !l.startsWith("---") && !l.startsWith("@@"))
      .map(line => {
        if (line.startsWith("+")) return { type: "add", content: line.slice(1) };
        if (line.startsWith("-")) return { type: "del", content: line.slice(1) };
        return { type: "context", content: line.startsWith(" ") ? line.slice(1) : line };
      });
  }

  // Plain code / note — show as all-green additions
  return lines.map(line => ({ type: "add", content: line }));
}

const LINE_STYLES = {
  add:     { bg: "bg-emerald-950", text: "text-emerald-300", gutter: "bg-emerald-900 text-emerald-500", marker: "+" },
  del:     { bg: "bg-red-950",     text: "text-red-300",     gutter: "bg-red-900 text-red-500",         marker: "-" },
  context: { bg: "bg-[#1e1e1e]",   text: "text-[#d4d4d4]",  gutter: "bg-[#252526] text-[#858585]",     marker: " " },
};

export default function DiffViewer({ recommendation }) {
  if (!recommendation) return null;

  const { source_file, root_cause, fix_description, code_suggestion } = recommendation;
  const parsedLines = parseDiff(code_suggestion);

  let addCount = 0;
  let delCount = 0;
  const numberedLines = parsedLines.map(line => {
    if (line.type === "add")     return { ...line, lineNum: ++addCount };
    if (line.type === "del")     return { ...line, lineNum: ++delCount };
    addCount++; delCount++;
    return { ...line, lineNum: addCount };
  });

  return (
    <div className="mt-3 rounded-lg overflow-hidden border border-[#3c3c3c] text-left">
      {/* Header */}
      <div className="bg-[#252526] border-b border-[#3c3c3c] px-4 py-2.5 flex items-center gap-3">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <span className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
        <span className="font-mono text-xs text-[#858585] truncate">{source_file || "unknown"}</span>
        <div className="ml-auto flex gap-2 text-xs font-mono">
          <span className="text-red-400">-{parsedLines.filter(l => l.type === "del").length}</span>
          <span className="text-emerald-400">+{parsedLines.filter(l => l.type === "add").length}</span>
        </div>
      </div>

      {/* Root cause + fix description */}
      <div className="bg-[#1e1e1e] border-b border-[#3c3c3c] px-4 py-3 space-y-1">
        <p className="text-xs text-[#858585] font-semibold uppercase tracking-wide">Root cause</p>
        <p className="text-sm text-[#ce9178]">{root_cause}</p>
        {fix_description && (
          <>
            <p className="text-xs text-[#858585] font-semibold uppercase tracking-wide pt-2">Fix</p>
            <p className="text-sm text-[#9cdcfe]">{fix_description}</p>
          </>
        )}
      </div>

      {/* Diff lines */}
      <div className="overflow-x-auto bg-[#1e1e1e]">
        <table className="w-full border-collapse text-xs font-mono">
          <tbody>
            {numberedLines.map((line, i) => {
              const s = LINE_STYLES[line.type];
              return (
                <tr key={i} className={s.bg}>
                  <td className={`select-none w-10 px-2 py-0.5 text-right border-r border-[#3c3c3c] ${s.gutter}`}>
                    {line.lineNum}
                  </td>
                  <td className={`select-none w-5 px-1 py-0.5 text-center border-r border-[#3c3c3c] ${s.gutter}`}>
                    {s.marker}
                  </td>
                  <td className={`px-3 py-0.5 whitespace-pre ${s.text}`}>
                    {line.content}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
