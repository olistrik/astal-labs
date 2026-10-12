import { For, createBinding } from "ags"
import { Gtk } from "ags/gtk4"
import AstalWp from "gi://AstalWp?version=0.1"

function Section({ kind }: { kind: "speaker" | "microphone" }) {
    const audio = AstalWp.get_default()!.audio!
    const key = kind === "speaker" ? "defaultSpeaker" : "defaultMicrophone"
    const endpoints = createBinding(audio, kind === "speaker" ? "speakers" : "microphones")

    return (
        <box orientation={Gtk.Orientation.VERTICAL}>
            <label class="PanelTitle" label={kind === "speaker" ? "Output" : "Microphone"} xalign={0} />
            <box class="PanelSlider">
                <button
                    class="PanelButton"
                    focusOnClick={false}
                    onClicked={() => audio[key]!.set_mute(!audio[key]!.mute)}
                >
                    <image iconName={createBinding(audio, key, "volumeIcon")} />
                </button>
                <slider
                    hexpand
                    value={createBinding(audio, key, "volume")}
                    onChangeValue={({ value }) => audio[key]!.set_volume(value)}
                />
            </box>
            <For each={endpoints}>
                {(endpoint) => (
                    <button
                        class={createBinding(endpoint, "isDefault")((d) => (d ? "PanelRow active" : "PanelRow"))}
                        focusOnClick={false}
                        onClicked={() => endpoint.set_is_default(true)}
                    >
                        <label label={createBinding(endpoint, "description")((d) => d ?? "")} xalign={0} />
                    </button>
                )}
            </For>
        </box>
    )
}

/**
 * Volume slider and device picker for the output and the microphone. Meant for
 * a popover or window, see the `panel` option of the status items.
 */
export default function AudioPanel() {
    return (
        <box class="Panel AudioPanel" orientation={Gtk.Orientation.VERTICAL}>
            <Section kind="speaker" />
            <Section kind="microphone" />
        </box>
    )
}
