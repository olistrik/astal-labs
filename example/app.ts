import { start, Bar } from "@astal-labs/core"

start({
    instanceName: "astal-labs-example",
    // "tokyo-night" is the default; or pass your own, e.g.
    //   theme: { ...themes["tokyo-night"], primary: "#bb9af7" }
    theme: "tokyo-night",
    windows: [Bar],
})
