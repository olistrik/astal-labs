import { For, createBinding } from "ags"
import { Gtk } from "ags/gtk4"
import AstalBluetooth from "gi://AstalBluetooth?version=0.1"
import { percent } from "../util"

/**
 * Bluetooth devices, connected ones first: power switch, scan button, and a
 * row per device that connects or disconnects when clicked. Meant for a popover
 * or window, see the `panel` option of the status items.
 */
export default function BluetoothPanel() {
    const bluetooth = AstalBluetooth.get_default()
    const adapter = bluetooth.adapter

    const devices = createBinding(bluetooth, "devices")((all) =>
        all.filter((d) => d.name !== null).sort((a, b) => Number(b.connected) - Number(a.connected)),
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
            <For each={devices}>
                {(device) => (
                    <button
                        class={createBinding(device, "connected")((c) => (c ? "PanelRow active" : "PanelRow"))}
                        focusOnClick={false}
                        onClicked={() =>
                            device.connected
                                ? device.disconnect_device(() => {})
                                : device.connect_device((_, error) => {
                                      if (error) console.error(`[bluetooth] connecting to ${device.name} failed`, error)
                                  })
                        }
                    >
                        <box>
                            <image iconName={device.icon ? `${device.icon}-symbolic` : "bluetooth-active-symbolic"} />
                            <label label={device.name} hexpand xalign={0} />
                            <label
                                label={createBinding(device, "batteryPercentage")(percent)}
                                visible={createBinding(device, "batteryPercentage")((p) => p > 0)}
                            />
                        </box>
                    </button>
                )}
            </For>
        </box>
    )
}
