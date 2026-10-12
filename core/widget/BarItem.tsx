import { Accessor, createComputed, createRoot, createState } from "ags"
import { Gdk, Gtk } from "ags/gtk4"
import { toAccessor } from "../util"

export type BarItemProps = {
    icon: string | Accessor<string>
    /** Text next to the icon, see `labelMode`. */
    label?: string | Accessor<string>
    /** Whether the label is always shown, only while hovering, or never. */
    labelMode?: "hover" | "always" | "never"
    tooltip?: string | Accessor<string>
    /** Extra css classes, on top of `BarItem`. */
    classes?: string | Accessor<string>
    onClicked?: () => void
    onSecondaryClicked?: () => void
    /** Called with -1 when scrolling up and 1 when scrolling down. */
    onScroll?: (direction: -1 | 1) => void
    /** Content of a popover that opens on click, unless `onClicked` is set. */
    panel?: () => Gtk.Widget
}

/** What every status item lets the composer override. */
export type ItemOptions = Pick<
    BarItemProps,
    "labelMode" | "onClicked" | "onSecondaryClicked" | "onScroll" | "panel"
>

/**
 * The shared shape of the status items (volume, battery, ...): an icon with an
 * optional label that slides out on hover.
 */
export default function BarItem({
    icon,
    label = "",
    labelMode = "hover",
    tooltip,
    classes = "",
    onClicked,
    onSecondaryClicked,
    onScroll,
    panel,
}: BarItemProps) {
    const [hovered, setHovered] = createState(false)
    const text = toAccessor(label)
    const reveal = createComputed(
        () => text() !== "" && (labelMode === "always" || (labelMode === "hover" && hovered())),
    )

    let popover: Gtk.Popover | undefined
    const showPanel = (anchor: Gtk.Widget) => {
        if (!popover) {
            popover = new Gtk.Popover({ child: createRoot(() => panel!()), hasArrow: false })
            popover.set_parent(anchor)
            anchor.connect("destroy", () => popover?.unparent())
        }
        popover.popup()
    }

    return (
        <box
            class={toAccessor(classes)((extra) => `BarItem ${extra}`)}
            tooltipText={tooltip}
            $={(self) => {
                const click = new Gtk.GestureClick({ button: 0 })
                click.connect("pressed", (gesture) => {
                    const button = gesture.get_current_button()
                    if (button === Gdk.BUTTON_PRIMARY) {
                        if (onClicked) onClicked()
                        else if (panel) showPanel(self)
                    } else if (button === Gdk.BUTTON_SECONDARY) onSecondaryClicked?.()
                })
                self.add_controller(click)

                const motion = new Gtk.EventControllerMotion()
                motion.connect("enter", () => setHovered(true))
                motion.connect("leave", () => setHovered(false))
                self.add_controller(motion)

                if (onScroll) {
                    const scroll = new Gtk.EventControllerScroll({
                        flags: Gtk.EventControllerScrollFlags.VERTICAL,
                    })
                    scroll.connect("scroll", (_, _dx, dy) => {
                        if (dy !== 0) onScroll(dy < 0 ? -1 : 1)
                        return true
                    })
                    self.add_controller(scroll)
                }
            }}
        >
            <image iconName={icon} pixelSize={16} />
            <revealer
                transitionType={Gtk.RevealerTransitionType.SLIDE_LEFT}
                revealChild={reveal}
            >
                <label label={text} />
            </revealer>
        </box>
    )
}
