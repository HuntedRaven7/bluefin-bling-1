/// <reference types="@vicinae/api">

/*
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 */

type ExtensionPreferences = {
  /** Homebrew executable - Path to brew on the host, used for installs. Searches use the formulae.brew.sh API because the worker cannot execute Linuxbrew. Bluefin usually uses /home/linuxbrew/.linuxbrew/bin/brew. */
	"brewPath"?: string;

	/** Package types - Include command-line formulae in search results. */
	"includeFormulae"?: boolean;

	/** Include desktop casks in search results. */
	"includeCasks"?: boolean;
}

declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Command: Search Brew Packages */
	export type Packages = Omit<ExtensionPreferences, never> & {
		
	}
}

declare namespace ToolPreferences {
  
}

declare namespace Arguments {
  /** Command: Search Brew Packages */
	export type Packages = {
		
	}
}