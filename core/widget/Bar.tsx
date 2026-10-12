import app from "ags/gtk4/app"
import { Astal, Gtk, Gdk } from "ags/gtk4"
import { createPoll } from "ags/time"
import NiriMinimap from "./NiriMinimap"
import NiriWorkspaces from "./NiriWorkspaces"

export default function Bar(gdkmonitor: Gdk.Monitor) {
    const time = createPoll("", 1000, "date")
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
            <button
                $type="end"
                onClicked={() => print("hello")}
                halign={Gtk.Align.CENTER}
            >
                <label label={time} />
            </button>
        </centerbox>
    </window>
}
