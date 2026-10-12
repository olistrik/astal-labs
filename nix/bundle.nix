# Builds an ags (gtk4) project that imports `@astal-labs/core`.
{
  pkgs,
  ags,
  astal,
  core,
}:

{
  src,
  name,
  entry ? "app.ts",
  extraPackages ? [ ],
}:

pkgs.stdenv.mkDerivation {
  inherit name src;

  nativeBuildInputs = with pkgs; [
    wrapGAppsHook3
    gobject-introspection
    ags
  ];

  buildInputs = [
    astal.io
    astal.astal4
    astal.battery
    astal.bluetooth
    astal.network
    astal.mpris
    astal.wireplumber
    pkgs.gjs
    pkgs.glib-networking # TLS, for cover art
  ] ++ extraPackages;

  # brightnessctl and nmcli are called by the brightness service and the network panel
  preFixup = ''
    gappsWrapperArgs+=(--prefix PATH : ${
      pkgs.lib.makeBinPath [
        pkgs.brightnessctl
        pkgs.networkmanager
        pkgs.pipewire
      ]
    })
  '';

  installPhase = ''
    runHook preInstall

    mkdir -p $out/bin $out/share
    cp -r * $out/share
    ags bundle ${entry} $out/bin/${name} --gtk 4 \
      --alias "@astal-labs/core=${core}" \
      -d "SRC='$out/share'"

    runHook postInstall
  '';

  meta.mainProgram = name;
}
