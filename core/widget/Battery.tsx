import { createBinding, createComputed } from "ags"
import AstalBattery from "gi://AstalBattery?version=0.1"
import BarItem, { type ItemOptions } from "./BarItem"
import { percent } from "../util"

/** Laptops have one, desktops don't: use this to decide whether to show `Battery`. */
export const hasBattery = () => AstalBattery.get_default().isPresent

/** Battery icon and percentage. Gets `low` and `critical` classes while discharging. */
export default function Battery(options: ItemOptions) {
    const battery = AstalBattery.get_default()
    const level = createBinding(battery, "percentage")
    const charging = createBinding(battery, "charging")

    return (
        <BarItem
            {...options}
            icon={createBinding(battery, "batteryIconName")}
            label={level(percent)}
            tooltip={level(percent)}
            classes={createComputed(() => {
                if (charging()) return "Battery charging"
                if (level() <= 0.1) return "Battery critical"
                if (level() <= 0.25) return "Battery low"
                return "Battery"
            })}
        />
    )
}
