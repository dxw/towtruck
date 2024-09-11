# 3. Store repository data in JSON blob

Date: 2024-09-10

## Status

Accepted

## Context

- The data we need to make a usable dashboard cannot be constructed from a single API call.
- At a minimum to display the number of open PRs for a repo we will need to GET an organisations repos and then GET on each repo.
- If we then want to sort this data (EG to show which repos have the most open PRs) we will then need to call all of these endpoints again for each repo.
- Therefore we will need to store this data somewhere
- The project is in a nascent stage
- Per [ADR-0002](./0002-keep-dependencies-to-a-minimum.md) we are keeping dependencies to a minimum
- A decision on a database and a database structure at this point could constrain future development
- The data used in the application is read-only


## Decision

We will store the data the application needs in JSON.

## Consequences

- The data can be persisted between deployments. This wouldn't be possible if stored in-memory.
- We don't have to describe a rigid database structure.
- We don't have to add any dependencies.
- Initial deployments will be more simple
- We won't be able to query the data using SQL
- It may be harder to keep the data up to date as we won't have a database engine to lean on. We will have to perform updates manually.
- We should revist this decision once the project is off the ground.
