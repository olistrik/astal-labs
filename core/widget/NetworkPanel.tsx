import { For, createBinding, createComputed } from "ags"
import { Gtk } from "ags/gtk4"
import { execAsync } from "ags/process"
import AstalNetwork from "gi://AstalNetwork?version=0.1"

/**
 * Wifi access points, strongest first: enable switch, scan button, and a row
 * per network that connects when clicked (through `nmcli`, which has to be in
 * PATH). Meant for a popover or window, see the `panel` option of the status items.
 */
export default function NetworkPanel() {
    const wifi = AstalNetwork.get_default().wifi
    if (!wifi) return <label class="Panel NetworkPanel" label="No Wi-Fi device" />

    const ssid = createBinding(wifi, "ssid")
    const accessPoints = createBinding(wifi, "accessPoints")

    const list = createComputed(() => {
        // the same network shows up once per access point, keep the strongest
        const strongest = new Map<string, AstalNetwork.AccessPoint>()
        for (const ap of accessPoints()) {
            if (ap.ssid && (strongest.get(ap.ssid)?.strength ?? -1) < ap.strength) strongest.set(ap.ssid, ap)
        }

        return [...strongest.values()].sort(
            (a, b) => Number(b.ssid === ssid()) - Number(a.ssid === ssid()) || b.strength - a.strength,
        )
    })

    return (
        <box class="Panel NetworkPanel" orientation={Gtk.Orientation.VERTICAL}>
            <box class="PanelHeader">
                <label label="Wi-Fi" hexpand xalign={0} />
                <button class="PanelButton" focusOnClick={false} onClicked={() => wifi.scan()}>
                    <image
                        iconName="view-refresh-symbolic"
                        class={createBinding(wifi, "scanning")((s) => (s ? "scanning" : ""))}
                    />
                </button>
                <switch
                    valign={Gtk.Align.CENTER}
                    active={createBinding(wifi, "enabled")}
                    onNotifyActive={(self) => {
                        if (self.active !== wifi.enabled) wifi.set_enabled(self.active)
                    }}
                />
            </box>
            <For each={list}>
                {(ap) => (
                    <button
                        class={ssid((s) => (s === ap.ssid ? "PanelRow active" : "PanelRow"))}
                        focusOnClick={false}
                        onClicked={() =>
                            execAsync(["nmcli", "device", "wifi", "connect", ap.bssid]).catch((error) =>
                                console.error(`[network] connecting to ${ap.ssid} failed`, error),
                            )
                        }
                    >
                        <box>
                            <image iconName={ap.iconName} />
                            <label label={ap.ssid} hexpand xalign={0} />
                        </box>
                    </button>
                )}
            </For>
        </box>
    )
}
