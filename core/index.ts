import app from "ags/gtk4/app"
import { Gdk, Gtk } from "ags/gtk4"
import style from "./style.scss"
import { resolveTheme, themeCss, type ThemeSpec } from "./theme"

export { default as Bar } from "./widget/Bar"
export { default as NiriMinimap } from "./widget/NiriMinimap"
export { default as NiriWorkspaces } from "./widget/NiriWorkspaces"
export { themes, type Theme, type ThemeName, type ThemeSpec } from "./theme"

/** A window factory, called once for every monitor. */
export type WindowFactory = (monitor: Gdk.Monitor) => Gtk.Window

export type Config = {
    windows: Array<WindowFactory>
    instanceName?: string
    /**
     * A built-in theme by name, or a complete custom theme.
     * To tweak a built-in one: `{ ...themes["tokyo-night"], primary: "#bb9af7" }`.
     */
    theme?: ThemeSpec
    /** Extra css, loaded after the core styles. Theme colours are available as `@astal_*`. */
    css?: string
}

export function start({
    windows,
    instanceName = "astal-labs",
    theme = "tokyo-night",
    css = "",
}: Config) {
    app.start({
        css: [themeCss(resolveTheme(theme)), style, css].join("\n"),
        instanceName,
        main() {
            for (const window of windows) {
                app.get_monitors().map(window)
            }
        },
    })
}
