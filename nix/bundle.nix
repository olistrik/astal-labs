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
    pkgs.gjs
  ] ++ extraPackages;

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
