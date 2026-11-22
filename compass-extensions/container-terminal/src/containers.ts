import { spawnSync } from "node:child_process";

export type Runtime = "podman" | "docker" | "distrobox";

export type Container = {
	id: string;
	name: string;
	image: string;
	status: string;
	state: string;
	runtime: Runtime;
};

export type DiscoveryOptions = {
	enablePodman: boolean;
	enableDocker: boolean;
	enableDistrobox: boolean;
	includeStopped: boolean;
};

// Tab separated so image names with spaces cannot shift columns.
const OCI_FORMAT = "{{.ID}}\t{{.Names}}\t{{.Image}}\t{{.Status}}\t{{.State}}";

function output(bin: string, args: string[]): string | null {
	try {
		const result = spawnSync(bin, args, {
			encoding: "utf8",
			timeout: 5000,
			maxBuffer: 4 * 1024 * 1024,
		});
		if (result.error || result.status !== 0) return null;
		return result.stdout ?? "";
	} catch {
		return null;
	}
}

function isAvailable(bin: string): boolean {
	return output(bin, ["--version"]) !== null;
}

function parseOci(text: string, runtime: "podman" | "docker"): Container[] {
	return text
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line.length > 0)
		.map((line) => line.split("\t"))
		.filter((parts) => parts.length >= 5)
		.map((parts) => ({
			id: parts[0].trim(),
			name: parts[1].trim(),
			image: parts[2].trim(),
			status: parts[3].trim(),
			state: parts[4].trim().toLowerCase(),
			runtime,
		}))
		.filter((container) => container.name.length > 0);
}

/** `distrobox list` prints a human table. Parse only its data rows. */
function parseDistrobox(text: string): Container[] {
	return text
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line.includes("|"))
		.map((line) => line.split("|").map((part) => part.trim()))
		.filter((parts) => parts.length >= 4 && /^\d+$/.test(parts[0]))
		.map((parts) => {
			const status = parts[3];
			return {
				id: parts[1],
				name: parts[1],
				image: parts[2],
				status,
				state: /^(up|running)/i.test(status) ? "running" : "exited",
				runtime: "distrobox" as const,
			};
		});
}

/**
 * Discover containers from every enabled runtime that is actually installed.
 * A missing or failing runtime is skipped rather than failing the whole search.
 */
export function listContainers(options: DiscoveryOptions): Container[] {
	const found: Container[] = [];
	const seen = new Set<string>();

	const add = (containers: Container[]) => {
		for (const container of containers) {
			if (!options.includeStopped && container.state !== "running") continue;
			const key = `${container.runtime}:${container.name}`;
			if (seen.has(key)) continue;
			seen.add(key);
			found.push(container);
		}
	};

	if (options.enablePodman && isAvailable("podman")) {
		const args = ["ps"];
		if (!options.includeStopped) args.push("--filter", "status=running");
		args.push("--format", OCI_FORMAT);
		const text = output("podman", args);
		if (text !== null) add(parseOci(text, "podman"));
	}

	if (options.enableDocker && isAvailable("docker")) {
		const args = ["ps"];
		if (!options.includeStopped) args.push("--filter", "status=running");
		args.push("--format", OCI_FORMAT);
		const text = output("docker", args);
		if (text !== null) add(parseOci(text, "docker"));
	}

	if (options.enableDistrobox && isAvailable("distrobox")) {
		const text = output("distrobox", ["list", "--no-color"]);
		if (text !== null) add(parseDistrobox(text));
	}

	return found.sort(
		(a, b) =>
			a.runtime.localeCompare(b.runtime) || a.name.localeCompare(b.name),
	);
}
