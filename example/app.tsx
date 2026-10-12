import {
    start,
    createBar,
    createMenu,
    themes,
    NiriWorkspaces,
    NiriMinimap,
    Clock,
    Group,
    MediaPanel,
    Network,
    NetworkPanel,
    Battery,
    hasBattery,
    Brightness,
    hasBacklight,
    Bluetooth,
    BluetoothPanel,
    Volume,
    Microphone,
    AudioPanel,
} from "@astal-labs/core"

// A menu drops down below the bar. Items open one on click, passing `panel` instead
// gives an item a small popover.
const connectivity = createMenu(() => [<NetworkPanel />, <BluetoothPanel />])
const audio = createMenu(() => [<AudioPanel />, <MediaPanel />])

// Every item in the bar is its own component, pick and order them as you like.
// Wrap items in a Group to put them in one pill.
const Bar = createBar((monitor) => ({
    start: <NiriWorkspaces monitor={monitor} />,
    center: <NiriMinimap monitor={monitor} />,
    end: [
        <Group>
            <Network onClicked={connectivity.toggle} />
            <Bluetooth onClicked={connectivity.toggle} />
        </Group>,
        <Group>
            {hasBattery() && <Battery />}
            {hasBacklight() && <Brightness />}
        </Group>,
        <Group>
            <Volume onClicked={audio.toggle} />
            <Microphone onClicked={audio.toggle} />
        </Group>,
        <Clock />,
    ],
}))

start({
    instanceName: "astal-labs-example",
    // a built-in theme by name, or your own: here tokyo-night with orange as the primary
    // colour and the pills as dark as the bar menus
    theme: {
        ...themes["tokyo-night"],
        primary: themes["tokyo-night"].orange,
        surface: themes["tokyo-night"].bg,
    },
    windows: [Bar],
})
