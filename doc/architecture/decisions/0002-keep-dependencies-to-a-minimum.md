# 2. Keep dependencies to a minimum

Date: 2024-09-10

## Status

Accepted

## Context

This project should make maintaining dxw's repos easier.
It becomes self defeating if it needs a lot of maintainence.
Javascript's depedency ecosystem often needs a lot of maintainence.
To begin with the application is a simple dashboard.   

## Decision

We will keep the dependencies of this project to an absolute minimum.

## Consequences

- To begin with this may make development slower as we cannot reach for off-the-shelf solutions but instead will have to create our own.
- The application will need fewer maintainence patches.
- Where possible we will use tools built into the runtime (EG testing, HTTP servers, etc.) as these can be patched via updates to Node
- The code should be easier maintain as developers won't need how to understand how 'Framework X' works but instead they can read the code to understand what it does.
