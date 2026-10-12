import app from "ags/gtk4/app"
import { Gdk, Gtk } from "ags/gtk4"
import style from "./style.scss"

export { default as Bar } from "./widget/Bar"

/** A window factory, called once for every monitor. */
export type WindowFactory = (monitor: Gdk.Monitor) => Gtk.Window

export type Config = {
    windows: Array<WindowFactory>
    instanceName?: string
    /** Extra css, loaded after the core styles. */
    css?: string
}

export function start({ windows, instanceName = "astal-labs", css = "" }: Config) {
    app.start({
        css: `${style}\n${css}`,
        instanceName,
        main() {
            for (const window of windows) {
                app.get_monitors().map(window)
            }
        },
    })
}
