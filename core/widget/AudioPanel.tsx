import { For, createBinding, createComputed, onCleanup } from "ags"
import { Gtk } from "ags/gtk4"
import AstalWp from "gi://AstalWp?version=0.1"
import { refreshRoutes, unavailable } from "../service/audio-routes"

function Section({
    kind,
    showUnavailable,
}: {
    kind: "speaker" | "microphone"
    showUnavailable: boolean
}) {
    const audio = AstalWp.get_default()!.audio!
    const key = kind === "speaker" ? "defaultSpeaker" : "defaultMicrophone"
    const endpoints = createBinding(audio, kind === "speaker" ? "speakers" : "microphones")
    const current = createBinding(audio, key)

    // newest device first, but the one in use on top
    const sorted = createComputed(() =>
        [...endpoints()].sort((a, b) => Number(b === current()) - Number(a === current()) || b.id - a.id),
    )

    refreshRoutes()
    onCleanup(endpoints.subscribe(refreshRoutes))

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
            <For each={sorted}>
                {(endpoint) => {
                    const isDefault = createBinding(endpoint, "isDefault")

                    // plugging something in changes the routes of the device
                    onCleanup(createBinding(endpoint, "routes").subscribe(refreshRoutes))

                    return (
                        <button
                            class={isDefault((d) => (d ? "PanelRow active" : "PanelRow"))}
                            visible={createComputed(
                                () => showUnavailable || isDefault() || !unavailable().has(endpoint.id),
                            )}
                            focusOnClick={false}
                            onClicked={() => endpoint.set_is_default(true)}
                        >
                            <label label={createBinding(endpoint, "description")((d) => d ?? "")} xalign={0} />
                        </button>
                    )
                }}
            </For>
        </box>
    )
}

/**
 * Volume slider and device picker for the output and the microphone. Meant for
 * a popover or window, see the `panel` option of the status items.
 *
 * Devices are listed newest first, with the one in use on top. Devices that
 * are not plugged in are hidden, unless they are the default; pass
 * `showUnavailable` to list them anyway.
 */
export default function AudioPanel({ showUnavailable = false }: { showUnavailable?: boolean }) {
    return (
        <box class="Panel AudioPanel" orientation={Gtk.Orientation.VERTICAL}>
            <Section kind="speaker" showUnavailable={showUnavailable} />
            <Section kind="microphone" showUnavailable={showUnavailable} />
        </box>
    )
}
