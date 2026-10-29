# Local alternative to the dev container: `nix-shell` gives you forge, cast and anvil.
{ pkgs ? import <nixpkgs> { } }:
pkgs.mkShell {
  packages = [ pkgs.foundry pkgs.git ];
}
