# High Level Design - dxw towtruck

## What is this document?
The purpose of this document is to facilitate a more structured and efficient approach to documenting dxw techical projects. 

An HLD aims to describe a digital service or product and then define the service, technology, data and security architecture.

The document is not designed to be a complete Technical Design and should remain high-level, providing a holistic view where multiple components and underpinning services collaborate to deliver a unified solution. It should provide sufficient information for a technical individual who is unfamiliar with the product to understand the scope, the key technology and design decisions, the non-functional requirements and how the solution meets those requirements.

This document should act as a central location to either record information directly or point people in the direction of relevant information.

This document should record important decisions to do with the project.

The template aims to provide prompts and guidelines that help our Tech Leads to consider critical aspects when designing a service or product.

It may not be necessary to complete all sections if they are not relevant to the service or product but they should at least be considered.


## Project Overview
What is the dxw towtruck project?

dxw have over 700 repositories within their own Github account. These need to be maintained and monitored for security updates. New versions of the packages, frameworks, and languages we include within projects are constantly being released. These are not always actioned as it's hard to get a clear picture of the repoositories and emails can be easily missed. It is important that we can easily see what is a priority for updating and what may have been forgotten.

It is proposed that we build a simple, centralised dashboard that allows for a clear overview of the status of our repositories.

### Requirements
- The service should be accessible to people within dxw
- The service should pull in all repositories from dxw organisation on Github 
- The service should show information to help prioritise and alert users to repositories that need looking at
- The service should need minimal maintainance
- The service should be easy to understand from a user and a developer point of view

### High level use cases
- As a user, I need to see that a repository has a critical update that needs manual intervention
- As a user, I need to be able to prioritise which repository needs to be reviewed

### Users
| User    | Desc |
| -------- | ------- |
| Developer  | Developers can use the tool to monitor and prioritise repositories for maintainence |
| Head of Development | A Head of Development can use the tool to see the overall health of the Github account and the projects |

### What impact do we expect to see from our work?
- We want to see a tool that fits into a regular cycle of work to review repositories
- We want to see better prioritisation of repositories
- We want to see less repositories with out of date packages

## Implementation

### ADRs
Key architectural and technical decisions on the project will be recorded as ADR's and can be found within the [ADR directory](/doc/architecture/decisions/)

### Document links
| Name    | Desc |
| -------- | ------- |
| [Miro](https://miro.com/app/board/uXjVKi0V260=/?share_link_id=334574911344)  | Main Miro board |
| [Slack](https://dxw.slack.com/archives/C07KVF495MY) | Project chat |

### Context diagram
Todo

### Logical overview
Todo

### Components
| Towtruck UI |  |
| :--------   | :--- |
| **Description** | The UI repo for Towtruck |
| **Languages** | Javascript |
| **Frameworks** | Nunjucks |
| **Repository** | https://github.com/dxw/towtruck |
| **Notes** | |


### Metrics and Measurement
Todo
- Are there any metrics or analytics in place
- How will we measure success?

### What is the support and maintainence strategy?
Todo
