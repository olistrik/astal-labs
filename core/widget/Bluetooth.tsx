import { createBinding, createComputed } from "ags"
import AstalBluetooth from "gi://AstalBluetooth?version=0.1"
import BarItem, { type ItemOptions } from "./BarItem"

/**
 * Bluetooth power and connection state, labelled with the connected device.
 * Right click toggles power, left click opens the `panel`, e.g. a `BluetoothPanel`.
 */
export default function Bluetooth(options: ItemOptions) {
    const bluetooth = AstalBluetooth.get_default()
    const powered = createBinding(bluetooth, "isPowered")
    const connected = createBinding(bluetooth, "isConnected")
    const devices = createBinding(bluetooth, "devices")

    const device = createComputed(() => {
        const [isConnected, all] = [connected(), devices()]
        return isConnected ? (all.find((d) => d.connected)?.alias ?? "") : ""
    })

    return (
        <BarItem
            onSecondaryClicked={() => bluetooth.toggle()}
            {...options}
            classes={createComputed(() => {
                if (!powered()) return "Bluetooth off"
                return connected() ? "Bluetooth connected" : "Bluetooth"
            })}
            icon={powered((on) => (on ? "bluetooth-active-symbolic" : "bluetooth-disabled-symbolic"))}
            label={device}
            tooltip={device((d) => d || "Bluetooth")}
        />
    )
}
