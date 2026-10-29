# Shared image for every lab. Each lab's devcontainer.json points here.
FROM mcr.microsoft.com/devcontainers/base:ubuntu-24.04

# forge-std lives outside the repo so labs need no submodules or `forge install`.
RUN git clone --depth 1 https://github.com/foundry-rs/forge-std /opt/forge-std

USER vscode
RUN curl -L https://foundry.paradigm.xyz | bash \
 && /home/vscode/.foundry/bin/foundryup
ENV PATH="/home/vscode/.foundry/bin:${PATH}"
