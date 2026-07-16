"use client";

import { useRef, useState } from "react";
import { buildDomainTutorPrompt, getNextDomainName } from "@/lib/domainTutorPrompts";

export function DomainTutorPrompt({ domainId, domainName }: { domainId: string; domainName: string }) {
  const [copied, setCopied] = useState(false);
  const prompt = buildDomainTutorPrompt(domainId);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
    } catch {
      promptRef.current?.select();
      document.execCommand("copy");
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  }

  return (
    <section className="domain-tutor-panel" aria-labelledby={`tutor-${domainId}`}>
      <div className="tutor-panel-head">
        <div>
          <p className="eyebrow">Claude learning companion</p>
          <h2 id={`tutor-${domainId}`}>{domainName} tutor prompt</h2>
          <p>Turns Claude into a Socratic tutor that helps Jada begin, think, revise, and finish—without doing the work for her.</p>
        </div>
        <button className="copy-prompt-button" onClick={copyPrompt}>{copied ? "Copied" : "Copy prompt"}<span aria-hidden="true">{copied ? "✓" : "→"}</span></button>
      </div>
      <div className="tutor-use-grid">
        <ol>
          <li><span>1</span><p>Copy the prompt into a new Claude conversation.</p></li>
          <li><span>2</span><p>Answer one tutor question at a time. Rough notes are welcome.</p></li>
          <li><span>3</span><p>Stay in this domain until the completion review is finished.</p></li>
          <li><span>4</span><p>Then load the <strong>{getNextDomainName(domainId)}</strong> tutor prompt.</p></li>
        </ol>
        <details>
          <summary>Preview the full prompt</summary>
          <textarea ref={promptRef} readOnly value={prompt} rows={22} aria-label={`Full Claude tutor prompt for ${domainName}`} />
        </details>
      </div>
      <p className="copy-status" role="status" aria-live="polite">{copied ? `${domainName} tutor prompt copied. Paste it into Claude to begin.` : ""}</p>
    </section>
  );
}
