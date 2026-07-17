import { Notice } from "obsidian";

export type LogLevel = "info" | "warn" | "error";

/** One place for user-facing messages: a Notice plus a matching console line, so
 *  every user-visible failure leaves a trace a bug report can quote.
 *
 *  Deliberately NEVER throws — obsidian-lifeos's equivalent throws at error
 *  level, but our error notices sit inside catch blocks that intentionally
 *  continue (a failed write reports false and keeps the user's text). Code that
 *  must abort throws explicitly at its own call site.
 *
 *  `silent` logs without a Notice, for background failures the user needn't see.
 *
 *  The info level logs via console.debug, not console.info: Obsidian's review
 *  rules allow only warn/error/debug, and the config forbids disabling them
 *  inline. Nothing is lost that matters — warn/error (the levels a bug report
 *  actually quotes) are untouched; info is success chatter, and console.debug
 *  still prints it under DevTools' Verbose level. */
export function logMessage(
	message: string,
	level: LogLevel = "info",
	opts?: { silent?: boolean; durationMs?: number }
): void {
	if (!opts?.silent) new Notice(message, opts?.durationMs ?? (level === "error" ? 10000 : undefined));
	const line = `Tadabbur: ${message}`;
	if (level === "error") console.error(line);
	else if (level === "warn") console.warn(line);
	else console.debug(line);
}
