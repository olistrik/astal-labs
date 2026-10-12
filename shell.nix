{
  system ? builtins.currentSystem,
}:

let
  sources = import ./npins;
  pkgs = import ./nix/pkgs.nix { inherit sources system; };
  inherit (import ./. { inherit system; }) ags;
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
