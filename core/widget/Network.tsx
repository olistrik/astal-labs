import { createBinding, createComputed } from "ags"
import AstalNetwork from "gi://AstalNetwork?version=0.1"
import BarItem, { type ItemOptions } from "./BarItem"

/**
 * The primary connection: wifi (with its ssid) or wired. Right click toggles wifi.
 * Left click opens the `panel`, e.g. a `NetworkPanel`.
 */
export default function Network(options: ItemOptions) {
    const network = AstalNetwork.get_default()
    const { wifi, wired } = network

    const primary = createBinding(network, "primary")
    const wifiIcon = wifi && createBinding(wifi, "iconName")
    const wifiSsid = wifi && createBinding(wifi, "ssid")
    const wifiEnabled = wifi && createBinding(wifi, "enabled")
    const wiredIcon = wired && createBinding(wired, "iconName")

    const icon = createComputed(() => {
        const [p, wifiName, wiredName] = [primary(), wifiIcon?.(), wiredIcon?.()]
        if (p === AstalNetwork.Primary.WIFI && wifiName) return wifiName
        if (p === AstalNetwork.Primary.WIRED && wiredName) return wiredName
        return "network-offline-symbolic"
    })

    const name = createComputed(() => {
        const [p, ssid] = [primary(), wifiSsid?.()]
        if (p === AstalNetwork.Primary.WIFI) return ssid ?? ""
        if (p === AstalNetwork.Primary.WIRED) return "Wired"
        return ""
    })

    return (
        <BarItem
            onSecondaryClicked={() => wifi?.set_enabled(!wifi.enabled)}
            {...options}
            classes={createComputed(() => (wifiEnabled?.() === false ? "Network disabled" : "Network"))}
            icon={icon}
            label={name}
            tooltip={name((n) => n || "Not connected")}
        />
    )
}
