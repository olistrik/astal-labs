{
  system ? builtins.currentSystem,
}:

let
  sources = import ./npins;
  pkgs = import ./nix/pkgs.nix { inherit sources system; };
  astal = import ./nix/astal.nix { inherit pkgs; src = sources.astal; };

  # Only used to bundle, the bundle brings its own libraries.
  agsCli = import ./nix/ags.nix { inherit pkgs astal; src = sources.ags; };

  # The same cli with everything core needs on its GI path and PATH, for `ags run` while developing.
  ags = import ./nix/ags.nix {
    inherit pkgs astal;
    src = sources.ags;
    extraPackages =
      (with astal; [ io astal4 battery bluetooth network wireplumber mpris ])
      # TLS for cover art, and the tools the brightness service, network panel and audio panel call
      ++ (with pkgs; [ glib-networking brightnessctl networkmanager pipewire ]);
  };

  core = ./core;
  bundle = import ./nix/bundle.nix { inherit pkgs astal core; ags = agsCli; };
  example = bundle {
    src = ./example;
    name = "astal-labs-example";
    entry = "app.tsx";
  };
in
{
  # For use from other projects:
  #   astal-labs = import sources.astal-labs { };
  #   astal-labs.bundle { src = ./.; name = "my-shell"; entry = "app.tsx"; }
  # and for a dev shell: astal-labs.pkgs, astal-labs.ags and astal-labs.core (see ags-config's shell.nix).
  inherit core bundle ags pkgs example;
  default = example;
}
