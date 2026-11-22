import {
	Action,
	ActionPanel,
	getPreferenceValues,
	Icon,
	List,
	open,
	runInTerminal,
	showToast,
	Toast,
} from "@vicinae/api";
import { useEffect, useState } from "react";
import { installArgs, packageUrl, searchBrew, type BrewPackage } from "./brew.js";

type Preferences = {
	brewPath: string;
	includeFormulae: boolean;
	includeCasks: boolean;
};

export default function Packages() {
	const prefs = getPreferenceValues<Preferences>();
	const [query, setQuery] = useState("");
	const [packages, setPackages] = useState<BrewPackage[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const term = query.trim();
		if (term.length === 0) {
			setPackages([]);
			setError(null);
			setIsLoading(false);
			return;
		}

		setIsLoading(true);
		const timer = setTimeout(() => {
			const result = searchBrew(
				{
					brewPath: prefs.brewPath || "/home/linuxbrew/.linuxbrew/bin/brew",
					includeFormulae: prefs.includeFormulae !== false,
					includeCasks: prefs.includeCasks !== false,
				},
				term,
			);
			setPackages(result.packages);
			setError(result.error);
			setIsLoading(false);
		}, 200);

		return () => clearTimeout(timer);
	}, [query, prefs.brewPath, prefs.includeFormulae, prefs.includeCasks]);

	async function install(pkg: BrewPackage) {
		await showToast({
			style: Toast.Style.Animated,
			title: `Installing ${pkg.name}`,
			message: `${pkg.kind} · follow the progress in the terminal`,
		});
		try {
			await runInTerminal(
				[prefs.brewPath || "/home/linuxbrew/.linuxbrew/bin/brew", ...installArgs(pkg)],
				{ hold: true, title: `brew install ${pkg.name}` },
			);
			await showToast({
				style: Toast.Style.Success,
				title: `Started installing ${pkg.name}`,
			});
		} catch (cause) {
			await showToast({
				style: Toast.Style.Failure,
				title: `Could not install ${pkg.name}`,
				message: cause instanceof Error ? cause.message : String(cause),
			});
		}
	}

	return (
		<List
			isLoading={isLoading}
			searchBarPlaceholder="Search formulae and casks…"
			onSearchTextChange={setQuery}
		>
			{query.trim().length === 0 ? (
				<List.Item
					key="hint"
					title="Type to search Homebrew"
					subtitle="Searches formulae and casks on the host, then installs with brew install."
					icon="🍺"
				/>
			) : error ? (
				<List.Item
					key="error"
					title="Homebrew search failed"
					subtitle={error}
					icon="⚠️"
				/>
			) : packages.length === 0 && !isLoading ? (
				<List.Item
					key="empty"
					title="No packages found"
					subtitle={`Nothing matched “${query.trim()}”.`}
					icon="📭"
				/>
			) : (
				<List.Section title="Results">
					{packages.map((pkg) => (
						<List.Item
							key={`${pkg.kind}:${pkg.name}`}
							title={pkg.name}
							subtitle={pkg.kind === "cask" ? "Cask · desktop app" : "Formula · CLI"}
							icon={pkg.kind === "cask" ? "📦" : "⚙️"}
							keywords={[pkg.kind, "brew", "homebrew"]}
							actions={
								<ActionPanel>
									<Action
										title={`Install ${pkg.name}`}
										icon={Icon.Box}
										onAction={() => install(pkg)}
									/>
									<Action
										title="Open on formulae.brew.sh"
										icon={Icon.Terminal}
										onAction={() => open(packageUrl(pkg))}
									/>
									<Action.CopyToClipboard
										title="Copy install command"
										content={`brew install ${pkg.kind === "cask" ? "--cask " : ""}${pkg.name}`}
									/>
								</ActionPanel>
							}
						/>
					))}
				</List.Section>
			)}
		</List>
	);
}
