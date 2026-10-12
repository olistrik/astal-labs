import app from "ags/gtk4/app"
import { Astal, Gdk } from "ags/gtk4"
import Clock from "./Clock"
import NiriMinimap from "./NiriMinimap"
import NiriWorkspaces from "./NiriWorkspaces"

export default function Bar(gdkmonitor: Gdk.Monitor) {
    const { TOP, LEFT, RIGHT } = Astal.WindowAnchor

    return <window
        visible
        class="Bar"
        gdkmonitor={gdkmonitor}
        exclusivity={Astal.Exclusivity.EXCLUSIVE}
        anchor={TOP | LEFT | RIGHT}
        application={app}>
        <centerbox cssName="centerbox">
            <NiriWorkspaces $type="start" monitor={gdkmonitor} />
            <NiriMinimap $type="center" monitor={gdkmonitor} />
            <Clock $type="end" />
        </centerbox>
    </window>
}
