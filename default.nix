{
  system ? builtins.currentSystem,
}:

let
  sources = import ./npins;
  pkgs = import ./nix/pkgs.nix { inherit sources system; };
  astal = import ./nix/astal.nix { inherit pkgs; src = sources.astal; };
  ags = import ./nix/ags.nix { inherit pkgs astal; src = sources.ags; };

  core = ./core;
  bundle = import ./nix/bundle.nix { inherit pkgs ags astal core; };
  example = bundle {
    src = ./example;
    name = "astal-labs-example";
    entry = "app.tsx";
  };
in
{
  # For use from other projects:
  #   astal-labs = import sources.astal-labs { };
  #   astal-labs.bundle { src = ./.; name = "my-shell"; }
  inherit core bundle example;
  default = example;
}
