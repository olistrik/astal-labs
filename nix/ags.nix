# Non-flake evaluation of the ags flake's `ags` package.
{
  pkgs,
  astal,
  src,
  extraPackages ? [ ],
}:

pkgs.callPackage "${src}/nix" {
  inherit (astal) astal3 astal4;
  astal-io = astal.io;
  version = builtins.replaceStrings [ "\n" ] [ "" ] (builtins.readFile "${src}/cli/version");
  inherit extraPackages;
}
