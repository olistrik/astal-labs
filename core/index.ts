import { createRoot } from "ags"
import app from "ags/gtk4/app"
import { Gdk, Gtk } from "ags/gtk4"
import style from "./style.scss"
import { resolveTheme, themeCss, type ThemeSpec } from "./theme"

export { default as Bar, createBar, type BarLayout } from "./widget/Bar"
export { default as Group } from "./widget/Group"
export { default as BarItem, type BarItemProps, type ItemOptions } from "./widget/BarItem"
export { default as NiriMinimap } from "./widget/NiriMinimap"
export { default as Clock } from "./widget/Clock"
export { default as NiriWorkspaces } from "./widget/NiriWorkspaces"
export { default as Network } from "./widget/Network"
export { default as Battery, hasBattery } from "./widget/Battery"
export { default as Brightness, hasBacklight } from "./widget/Brightness"
export { default as Bluetooth } from "./widget/Bluetooth"
export { default as Volume } from "./widget/Volume"
export { default as Microphone } from "./widget/Microphone"
export { default as Media } from "./widget/Media"
export { default as MediaPanel } from "./widget/MediaPanel"
export { default as MediaPlayerPanel } from "./widget/MediaPlayerPanel"
export { createMenu, type Menu } from "./widget/Menu"
export { default as NetworkPanel } from "./widget/NetworkPanel"
export { default as BluetoothPanel } from "./widget/BluetoothPanel"
export { default as AudioPanel } from "./widget/AudioPanel"
export { default as BrightnessService } from "./service/brightness"
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
    windows: factories,
    instanceName = "astal-labs",
    theme = "tokyo-night",
    css = "",
}: Config) {
    app.start({
        css: [themeCss(resolveTheme(theme)), style, css].join("\n"),
        instanceName,
        main() {
            // with every monitor unplugged there are no windows, which must not quit the app
            app.hold()
            const display = Gdk.Display.get_default()!
            const monitors = display.get_monitors()
            const open = new Map<Gdk.Monitor, { windows: Array<Gtk.Window>; dispose: () => void }>()

            // windows follow the monitors: built for new ones, torn down for unplugged ones
            const sync = () => {
                const current = new Set(app.get_monitors())

                for (const [monitor, { windows, dispose }] of open) {
                    if (current.has(monitor)) continue
                    open.delete(monitor)
                    dispose()
                    windows.forEach((window) => window.destroy())
                }

                for (const monitor of current) {
                    if (open.has(monitor)) continue
                    // its own scope, so the widgets' bindings go away with the monitor
                    createRoot((dispose) => open.set(monitor, { windows: factories.map((factory) => factory(monitor)), dispose }))
                }
            }

            monitors.connect("items-changed", sync)
            sync()
        },
    })
}
