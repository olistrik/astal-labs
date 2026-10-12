import { For, createBinding } from "ags"
import { Gtk } from "ags/gtk4"
import AstalMpris from "gi://AstalMpris?version=0.1"
import MediaPlayerPanel from "./MediaPlayerPanel"

/** A `MediaPlayerPanel` for every running mpris player. */
export default function MediaPanel() {
    const players = createBinding(AstalMpris.get_default(), "players")

    return (
        <box class="Panel MediaPanel" orientation={Gtk.Orientation.VERTICAL}>
            <label class="PanelTitle" label="Music" xalign={0} />
            <label class="PanelEmpty" label="Nothing playing" visible={players((p) => p.length === 0)} />
            <For each={players}>{(player) => <MediaPlayerPanel player={player} />}</For>
        </box>
    )
}
