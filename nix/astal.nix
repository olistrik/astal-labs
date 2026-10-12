# Non-flake evaluation of the astal flake outputs we need.
{ pkgs, src }:

let
  self = {
    packages.${pkgs.stdenv.hostPlatform.system} = {
      io = mkPkg "${src}/lib/astal/io";
      astal3 = mkPkg "${src}/lib/astal/gtk3";
      astal4 = mkPkg "${src}/lib/astal/gtk4";
      quarrel = mkPkg "${src}/lib/quarrel";
      mpris = mkPkg "${src}/lib/mpris";
      battery = mkPkg "${src}/lib/battery";
      bluetooth = mkPkg "${src}/lib/bluetooth";
      network = mkPkg "${src}/lib/network";
      wireplumber = mkPkg "${src}/lib/wireplumber";
    };
  };

  mkPkg =
    path:
    import path {
      inherit self pkgs;
      mkAstalPkg = import "${src}/nix/mkAstalPkg.nix" pkgs;
    };
in
self.packages.${pkgs.stdenv.hostPlatform.system}
