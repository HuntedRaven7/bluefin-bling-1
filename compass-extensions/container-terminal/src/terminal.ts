import { spawn } from "node:child_process";
import type { Container } from "./containers.js";

export type TerminalPrefs = {
	terminal?: string;
	customTerminalTemplate?: string;
	containerShell?: string;
};

/** Single-quote a word for POSIX shells, including embedded quotes. */
export function shellQuote(word: string): string {
	return `'${word.replace(/'/g, "'\\''")}'`;
}

/** Build the command that opens a shell in the chosen container. */
export function shellCommandFor(container: Container, shell: string): string {
	const bin = shellQuote(container.runtime);

	if (container.runtime === "distrobox") {
		return `distrobox enter ${shellQuote(container.name)}`;
	}

	const target = shellQuote(container.id);
	const shellBin = shellQuote(shell.trim() || "/bin/sh");
	const exec = `${bin} exec -it ${target} ${shellBin}`;

	// A stopped container has to be started before exec can attach to it.
	return container.state === "running"
		? exec
		: `${bin} start ${target} && ${exec}`;
}

/** Resolve the user's terminal preference to a {command} template. */
export function terminalTemplate(prefs: TerminalPrefs): string {
	const chosen = prefs.terminal || "ghostty -e {command}";
	if (chosen === "custom") {
		return prefs.customTerminalTemplate || "ghostty -e {command}";
	}
	return chosen;
}

/** Expand {command} in a terminal template into a complete shell command. */
export function expandTemplate(template: string, command: string): string {
	const rendered = template.includes("{command}")
		? template.split("{command}").join(command)
		: `${template} ${command}`;
	return rendered.trim();
}

/**
 * Launch the terminal detached from the launcher so the shell survives after
 * Compass closes its window. The engine worker is allowed to execute system
 * programs; the terminal itself is the only process we start here.
 */
export function launchInTerminal(prefs: TerminalPrefs, container: Container): void {
	const command = shellCommandFor(container, prefs.containerShell || "");
	const full = expandTemplate(terminalTemplate(prefs), command);
	const child = spawn("/bin/sh", ["-c", full], {
		detached: true,
		stdio: "ignore",
	});
	child.on("error", () => {
		// A detached terminal cannot report failures back to the launcher.
		// The command is surfaced in the action's toast before we get here.
	});
	child.unref();
}
