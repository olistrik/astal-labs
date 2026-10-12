{
  system ? builtins.currentSystem,
}:

let
  sources = import ./npins;
  pkgs = import ./nix/pkgs.nix { inherit sources system; };
  astal = import ./nix/astal.nix { inherit pkgs; src = sources.astal; };
  ags = import ./nix/ags.nix {
    inherit pkgs astal;
    src = sources.ags;
    extraPackages =
      (with astal; [ io astal4 battery bluetooth network wireplumber mpris ])
      # TLS for cover art, and the tools the brightness service and network panel call
      ++ (with pkgs; [ glib-networking brightnessctl networkmanager ]);
  };
in

pkgs.mkShell {
  packages = [
    pkgs.git
    pkgs.bun
    ags
  ];

  # The `ags` package on npm is unrelated; the real one ships with the ags CLI.
  # Link it in after `bun install` for editor types and `ags run`.
  shellHook = ''
    if [ -d node_modules ] && [ "$(readlink node_modules/ags)" != "${ags.jsPackage}" ]; then
      ln -sfn ${ags.jsPackage} node_modules/ags
    fi
  '';
}
