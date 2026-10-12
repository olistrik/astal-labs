import { For, createBinding, createState } from "ags"
import { Gtk } from "ags/gtk4"
import { execAsync } from "ags/process"
import AstalBluetooth from "gi://AstalBluetooth?version=0.1"
import { percent } from "../util"

/**
 * Bluetooth devices, paired and connected ones first: power switch, scan button,
 * and a row per device. Clicking connects or disconnects a paired device; for a
 * device that is not paired yet (start a scan to find them) it pairs, trusts
 * and connects, through `bluetoothctl`, which has to be in PATH. Devices that
 * ask for a PIN or passkey are not supported, there is no pairing agent.
 * Meant for a popover or window, see the `panel` option of the status items.
 */
export default function BluetoothPanel() {
    const bluetooth = AstalBluetooth.get_default()
    const adapter = bluetooth.adapter

    const devices = createBinding(bluetooth, "devices")((all) =>
        all
            .filter((d) => d.name !== null)
            .sort((a, b) => Number(b.connected) - Number(a.connected) || Number(b.paired) - Number(a.paired)),
    )

    return (
        <box class="Panel BluetoothPanel" orientation={Gtk.Orientation.VERTICAL}>
            <box class="PanelHeader">
                <label label="Bluetooth" hexpand xalign={0} />
                <button
                    class="PanelButton"
                    focusOnClick={false}
                    visible={adapter !== null}
                    onClicked={() => (adapter?.discovering ? adapter.stop_discovery() : adapter?.start_discovery())}
                >
                    <image
                        iconName="view-refresh-symbolic"
                        class={adapter ? createBinding(adapter, "discovering")((d) => (d ? "scanning" : "")) : ""}
                    />
                </button>
                <switch
                    valign={Gtk.Align.CENTER}
                    active={createBinding(bluetooth, "isPowered")}
                    onNotifyActive={(self) => {
                        if (self.active !== bluetooth.isPowered) adapter?.set_powered(self.active)
                    }}
                />
            </box>
            <For each={devices}>{(device) => <DeviceRow device={device} />}</For>
        </box>
    )
}

function DeviceRow({ device }: { device: AstalBluetooth.Device }) {
    const [busy, setBusy] = createState(false)
    const connected = createBinding(device, "connected")
    const paired = createBinding(device, "paired")

    const fail = (what: string) => (error: unknown) => console.error(`[bluetooth] ${what} ${device.name} failed`, error)

    const connectDevice = () =>
        new Promise<void>((resolve, reject) =>
            device.connect_device((_, error) => (error ? reject(error) : resolve())),
        )

    const activate = () => {
        if (busy.peek()) return

        if (device.connected) {
            device.disconnect_device(() => {})
        } else if (device.paired) {
            device.connect_device((_, error) => error && fail("connecting to")(error))
        } else {
            setBusy(true)
            execAsync(["bluetoothctl", "--timeout", "30", "pair", device.address])
                .then(() => {
                    device.set_trusted(true)
                    return connectDevice()
                })
                .catch(fail("pairing with"))
                .finally(() => setBusy(false))
        }
    }

    return (
        <button
            class={connected((c) => (c ? "PanelRow active" : "PanelRow"))}
            sensitive={busy((b) => !b)}
            focusOnClick={false}
            onClicked={activate}
        >
            <box>
                <image iconName={device.icon ? `${device.icon}-symbolic` : "bluetooth-active-symbolic"} />
                <label label={device.name} hexpand xalign={0} />
                <label
                    class="PanelHint"
                    label={busy((b) => (b ? "Pairing…" : "Pair"))}
                    visible={paired((p) => !p)}
                />
                <label
                    label={createBinding(device, "batteryPercentage")(percent)}
                    visible={createBinding(device, "batteryPercentage")((p) => p > 0)}
                />
            </box>
        </button>
    )
}
