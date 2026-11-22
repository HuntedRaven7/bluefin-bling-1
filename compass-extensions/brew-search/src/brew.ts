import { spawnSync } from "node:child_process";

export type PackageKind = "formula" | "cask";

export type BrewPackage = {
	name: string;
	kind: PackageKind;
};

export type BrewOptions = {
	brewPath: string;
	includeFormulae: boolean;
	includeCasks: boolean;
};

type BrewResult = { ok: true; stdout: string } | { ok: false; error: string };

function runBrew(brewPath: string, args: string[]): BrewResult {
	try {
		const result = spawnSync(brewPath, args, {
			encoding: "utf8",
			timeout: 10000,
			maxBuffer: 4 * 1024 * 1024,
		});
		if (result.error) return { ok: false, error: result.error.message };
		if (result.status !== 0) {
			const detail = (result.stderr || result.stdout || "").trim();
			return { ok: false, error: detail || `brew exited with ${result.status}` };
		}
		return { ok: true, stdout: result.stdout ?? "" };
	} catch (cause) {
		return { ok: false, error: cause instanceof Error ? cause.message : String(cause) };
	}
}

function parseNames(stdout: string): string[] {
	return stdout
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => /^[a-zA-Z0-9][a-zA-Z0-9+._@-]*$/.test(line));
}

/** Search formulae and casks. Returns either results or the first real error. */
export function searchBrew(
	options: BrewOptions,
	query: string,
): { packages: BrewPackage[]; error: string | null } {
	const term = query.trim();
	if (term.length === 0) return { packages: [], error: null };

	const packages: BrewPackage[] = [];
	const seen = new Set<string>();

	const collect = (kind: PackageKind, stdout: string) => {
		for (const name of parseNames(stdout)) {
			const key = `${kind}:${name}`;
			if (seen.has(key)) continue;
			seen.add(key);
			packages.push({ name, kind });
		}
	};

	if (options.includeFormulae) {
		const result = runBrew(options.brewPath, ["search", "--formula", term]);
		if (!result.ok) return { packages: [], error: result.error };
		collect("formula", result.stdout);
	}

	if (options.includeCasks) {
		const result = runBrew(options.brewPath, ["search", "--cask", term]);
		if (!result.ok && packages.length === 0) {
			return { packages: [], error: result.error };
		}
		if (result.ok) collect("cask", result.stdout);
	}

	return { packages, error: null };
}

/** Install argv for a searched package. Never interpolates a shell string. */
export function installArgs(pkg: BrewPackage): string[] {
	return pkg.kind === "cask"
		? ["install", "--cask", pkg.name]
		: ["install", pkg.name];
}

export function packageUrl(pkg: BrewPackage): string {
	const section = pkg.kind === "cask" ? "cask" : "formula";
	return `https://formulae.brew.sh/${section}/${pkg.name}`;
}
