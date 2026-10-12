import { createRoot } from "ags"
import app from "ags/gtk4/app"
import { Astal, Gdk, Gtk } from "ags/gtk4"

export type Menu = {
    toggle: () => void
    show: () => void
    hide: () => void
}

/**
 * A menu that drops down from the top right, below the bar, on whichever
 * monitor is focused. `content` is called once, the first time it is shown.
 * It closes on Escape and when clicking outside of it.
 *
 *     const system = createMenu(() => <><BluetoothPanel /><AudioPanel /></>)
 *     <Volume onClicked={system.toggle} />
 */
export function createMenu(content: () => JSX.Element | Array<JSX.Element>): Menu {
    const { TOP, BOTTOM, LEFT, RIGHT } = Astal.WindowAnchor
    let window: Gtk.Window | undefined

    const create = () => {
        let backdrop: Gtk.Box

        return <window
            class="MenuWindow"
            visible={false}
            application={app}
            keymode={Astal.Keymode.ON_DEMAND}
            anchor={TOP | BOTTOM | LEFT | RIGHT}
            $={(self) => {
                const keys = new Gtk.EventControllerKey()
                keys.connect("key-pressed", (_, key) => {
                    if (key !== Gdk.KEY_Escape) return false
                    self.hide()
                    return true
                })
                self.add_controller(keys)
            }}>
            <box
                class="MenuBackdrop"
                $={(self) => {
                    backdrop = self
                    const click = new Gtk.GestureClick()
                    click.connect("pressed", (_, _n, x, y) => {
                        // only clicks on the empty area, not on the menu itself
                        if (backdrop.pick(x, y, Gtk.PickFlags.DEFAULT) === backdrop) backdrop.get_root()?.hide()
                    })
                    self.add_controller(click)
                }}>
                <box class="Menu" orientation={Gtk.Orientation.VERTICAL} halign={Gtk.Align.END} valign={Gtk.Align.START} hexpand vexpand>
                    {content()}
                </box>
            </box>
        </window> as Gtk.Window
    }

    // built on first use, which is outside of any tracking scope, so give it its own
    const get = () => (window ??= createRoot(create))

    return {
        toggle: () => (get().visible ? get().hide() : get().show()),
        show: () => get().show(),
        hide: () => window?.hide(),
    }
}
