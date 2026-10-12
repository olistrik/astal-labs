import app from "ags/gtk4/app"
import { Astal, Gdk, Gtk } from "ags/gtk4"
import Clock from "./Clock"
import NiriMinimap from "./NiriMinimap"
import NiriWorkspaces from "./NiriWorkspaces"

type Children = JSX.Element | Array<JSX.Element>

/** What goes in the three slots of the bar. */
export type BarLayout = {
    start?: Children
    center?: Children
    end?: Children
}

/**
 * A bar window factory for `windows`. `layout` is called once for every
 * monitor, so every bar gets its own widgets.
 */
export function createBar(layout: (monitor: Gdk.Monitor) => BarLayout) {
    return function Bar(gdkmonitor: Gdk.Monitor): Gtk.Window {
        const { TOP, LEFT, RIGHT } = Astal.WindowAnchor
        const { start, center, end } = layout(gdkmonitor)

        return <window
            visible
            class="Bar"
            gdkmonitor={gdkmonitor}
            exclusivity={Astal.Exclusivity.EXCLUSIVE}
            anchor={TOP | LEFT | RIGHT}
            application={app}>
            <centerbox cssName="centerbox">
                <box $type="start">{start}</box>
                <box $type="center">{center}</box>
                <box $type="end">{end}</box>
            </centerbox>
        </window>
    }
}

/** The default bar: niri workspaces and minimap, and a clock. */
export default createBar((monitor) => ({
    start: <NiriWorkspaces monitor={monitor} />,
    center: <NiriMinimap monitor={monitor} />,
    end: <Clock />,
}))
