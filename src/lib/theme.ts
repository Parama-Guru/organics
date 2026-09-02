export const THEME_COOKIE = "OSSIL_THEME";
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export type Theme = "light" | "dark";

export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

/**
 * Runs before first paint, so the page never flashes the wrong theme.
 *
 * The server cannot know the operating system preference, so when there is no
 * stored choice this resolves it on the client. `data-theme` is therefore not
 * always what the server rendered, which is why the documents that use this set
 * `suppressHydrationWarning` on <html>.
 */
export const THEME_SCRIPT = `(function(){try{var d=document.documentElement;if(d.dataset.theme)return;var m=window.matchMedia('(prefers-color-scheme: dark)');d.dataset.theme=m.matches?'dark':'light';}catch(e){}})();`;
