/** Colour tokens every core component is styled with. */
export type Theme = {
    /** Window and bar background. */
    bg: string
    /** Raised or inactive things on top of `bg`. */
    surface: string
    border: string
    fg: string
    /** Secondary text. */
    muted: string
    /** The main accent: focus, selection, active state. */
    primary: string
    red: string
    orange: string
    yellow: string
    green: string
    cyan: string
    blue: string
    magenta: string
}

export const themes = {
    "tokyo-night": {
        bg: "#1a1b26",
        surface: "#292e42",
        border: "#414868",
        fg: "#c0caf5",
        muted: "#565f89",
        primary: "#7aa2f7",
        red: "#f7768e",
        orange: "#ff9e64",
        yellow: "#e0af68",
        green: "#9ece6a",
        cyan: "#7dcfff",
        blue: "#7aa2f7",
        magenta: "#bb9af7",
    },
    "tokyo-night-storm": {
        bg: "#24283b",
        surface: "#292e42",
        border: "#414868",
        fg: "#c0caf5",
        muted: "#565f89",
        primary: "#7aa2f7",
        red: "#f7768e",
        orange: "#ff9e64",
        yellow: "#e0af68",
        green: "#9ece6a",
        cyan: "#7dcfff",
        blue: "#7aa2f7",
        magenta: "#bb9af7",
    },
    "tokyo-night-day": {
        bg: "#e1e2e7",
        surface: "#c4c8da",
        border: "#a8aecb",
        fg: "#3760bf",
        muted: "#848cb5",
        primary: "#2e7de9",
        red: "#f52a65",
        orange: "#b15c00",
        yellow: "#8c6c3e",
        green: "#587539",
        cyan: "#007197",
        blue: "#2e7de9",
        magenta: "#9854f1",
    },
} satisfies Record<string, Theme>

export type ThemeName = keyof typeof themes

/** A built-in theme by name, or a complete custom theme. */
export type ThemeSpec = ThemeName | Theme

export function resolveTheme(spec: ThemeSpec): Theme {
    return typeof spec === "string" ? themes[spec] : spec
}

/**
 * GTK css that defines the theme as `@astal_*` colours. The names libadwaita
 * and GTK's stock Adwaita style use are remapped too, so stock widgets
 * (popovers, calendars, ...) follow the theme as well.
 */
export function themeCss(theme: Theme): string {
    const colours: Record<string, string> = {
        astal_bg: theme.bg,
        astal_surface: theme.surface,
        astal_border: theme.border,
        astal_fg: theme.fg,
        astal_muted: theme.muted,
        astal_primary: theme.primary,
        astal_red: theme.red,
        astal_orange: theme.orange,
        astal_yellow: theme.yellow,
        astal_green: theme.green,
        astal_cyan: theme.cyan,
        astal_blue: theme.blue,
        astal_magenta: theme.magenta,

        window_bg_color: theme.bg,
        window_fg_color: theme.fg,
        view_bg_color: theme.bg,
        view_fg_color: theme.fg,
        card_bg_color: theme.surface,
        card_fg_color: theme.fg,
        popover_bg_color: theme.surface,
        popover_fg_color: theme.fg,
        accent_color: theme.primary,
        accent_bg_color: theme.primary,
        accent_fg_color: theme.bg,
        destructive_color: theme.red,
        destructive_bg_color: theme.red,
        success_color: theme.green,
        warning_color: theme.yellow,
        error_color: theme.red,
        borders: theme.border,
    }

    return Object.entries(colours)
        .map(([name, value]) => `@define-color ${name} ${value};`)
        .join("\n")
}
