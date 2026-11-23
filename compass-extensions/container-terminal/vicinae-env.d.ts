/// <reference types="@vicinae/api">

/*
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 */

type ExtensionPreferences = {
  /** Container runtimes - Include containers managed by Podman in the search results. */
	"enablePodman"?: boolean;

	/** Include containers managed by Docker in the search results. */
	"enableDocker"?: boolean;

	/** Include Distrobox containers in the search results. */
	"enableDistrobox"?: boolean;

	/** Containers - Show stopped containers too. A stopped container is started before its shell opens. */
	"includeStopped"?: boolean;

	/** Terminal emulator - The terminal used to open the container shell. {command} is replaced with the shell command. */
	"terminal"?: "ghostty -e {command}" | "gnome-terminal -- {command}" | "konsole -e {command}" | "kitty {command}" | "alacritty -e {command}" | "wezterm start -- {command}" | "xterm -e {command}" | "custom";

	/** Custom terminal command - Used when the terminal emulator is set to Custom command. Include {command} where the shell command belongs. */
	"customTerminalTemplate"?: string;

	/** Shell inside containers - The shell started inside Podman and Docker containers. Distrobox uses its own entry command. */
	"containerShell"?: string;
}

declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Command: Open Container in Terminal */
	export type Containers = Omit<ExtensionPreferences, never> & {
		
	}
}

declare namespace ToolPreferences {
  
}

declare namespace Arguments {
  /** Command: Open Container in Terminal */
	export type Containers = {
		
	}
}