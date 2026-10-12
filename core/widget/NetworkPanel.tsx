import { Accessor, For, createBinding, createComputed, createState } from "ags"
import { Gtk } from "ags/gtk4"
import { execAsync } from "ags/process"
import AstalNetwork from "gi://AstalNetwork?version=0.1"

const connect = (args: Array<string>) => execAsync(["nmcli", "device", "wifi", "connect", ...args])

/**
 * Wifi access points, strongest first: enable switch, scan button, and a row
 * per network that connects when clicked (through `nmcli`, which has to be in
 * PATH). Networks that need a password nmcli doesn't have yet reveal a password
 * entry, and a final row connects to a hidden network by name. Meant for a
 * popover or window, see the `panel` option of the status items.
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
            <For each={list}>{(ap) => <AccessPointRow ap={ap} active={ssid((s) => s === ap.ssid)} />}</For>
            <HiddenNetwork />
        </box>
    )
}

function AccessPointRow({ ap, active }: { ap: AstalNetwork.AccessPoint; active: Accessor<boolean> }) {
    const [asking, setAsking] = createState(false)
    const [failed, setFailed] = createState(false)

    const submit = (password?: string) => {
        setFailed(false)
        connect([ap.bssid, ...(password ? ["password", password] : [])]).then(
            () => setAsking(false),
            (error) => {
                console.error(`[network] connecting to ${ap.ssid} failed`, error)
                // nmcli has no (correct) password for it, so ask for one
                if (ap.requiresPassword) {
                    setAsking(true)
                    setFailed(Boolean(password))
                }
            },
        )
    }

    return (
        <box orientation={Gtk.Orientation.VERTICAL}>
            <button
                class={active((a) => (a ? "PanelRow active" : "PanelRow"))}
                focusOnClick={false}
                onClicked={() => submit()}
            >
                <box>
                    <image iconName={ap.iconName} />
                    <label label={ap.ssid} hexpand xalign={0} />
                    <image iconName="changes-prevent-symbolic" visible={ap.requiresPassword} />
                </box>
            </button>
            <revealer revealChild={asking}>
                <entry
                    class={failed((f) => (f ? "PanelEntry error" : "PanelEntry"))}
                    visibility={false}
                    placeholderText="Password, then Enter"
                    onActivate={(self) => self.text && submit(self.text)}
                />
            </revealer>
        </box>
    )
}

/** Hidden networks are not in the scan results, so they have to be typed in. */
function HiddenNetwork() {
    const [open, setOpen] = createState(false)
    const [failed, setFailed] = createState(false)
    let name: Gtk.Entry
    let password: Gtk.Entry

    const submit = () => {
        if (!name.text) return
        setFailed(false)
        connect([name.text, "hidden", "yes", ...(password.text ? ["password", password.text] : [])]).then(
            () => {
                setOpen(false)
                name.text = password.text = ""
            },
            (error) => {
                console.error(`[network] connecting to hidden network ${name.text} failed`, error)
                setFailed(true)
            },
        )
    }

    return (
        <box orientation={Gtk.Orientation.VERTICAL}>
            <button class="PanelRow" focusOnClick={false} onClicked={() => setOpen((o) => !o)}>
                <box>
                    <image iconName="list-add-symbolic" />
                    <label label="Hidden network" hexpand xalign={0} />
                </box>
            </button>
            <revealer revealChild={open}>
                <box orientation={Gtk.Orientation.VERTICAL}>
                    <entry
                        class={failed((f) => (f ? "PanelEntry error" : "PanelEntry"))}
                        placeholderText="Network name"
                        $={(self) => (name = self)}
                        onActivate={() => password.grab_focus()}
                    />
                    <entry
                        class={failed((f) => (f ? "PanelEntry error" : "PanelEntry"))}
                        visibility={false}
                        placeholderText="Password (empty for open), then Enter"
                        $={(self) => (password = self)}
                        onActivate={submit}
                    />
                </box>
            </revealer>
        </box>
    )
}
