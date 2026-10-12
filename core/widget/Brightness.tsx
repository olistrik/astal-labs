import { createBinding } from "ags"
import Brightness from "../service/brightness"
import BarItem, { type ItemOptions } from "./BarItem"
import { percent } from "../util"

const STEP = 0.02

/** Whether this machine has a backlight, use this to decide whether to show `Brightness`. */
export const hasBacklight = () => Brightness.get_default().hasScreen

/** Screen brightness, scroll to change it. */
export default function BrightnessItem(options: ItemOptions) {
    const brightness = Brightness.get_default()
    const level = createBinding(brightness, "screen")

    return (
        <BarItem
            onScroll={(direction) => (brightness.screen -= direction * STEP)}
            {...options}
            classes="Brightness"
            icon="display-brightness-symbolic"
            label={level(percent)}
            tooltip={level((v) => `Brightness ${percent(v)}`)}
        />
    )
}
