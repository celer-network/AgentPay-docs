# On-Chain Contracts

This section describes the core structure of the Celer AgentPay generalized state-channel system, its on-chain contract design, and the API flows for on-chain operations.

The AgentPay contract suite comprises a small set of smart contracts that bind the core abstractions (channels, payments, conditions) to minimal, verifiable on-chain states. These contracts define only the interaction logic between two peers; the network emerges by composing many such peer-to-peer channels via the off-chain protocol (covered in the next section).

The following sections describe the core data structures and architecture components of the AgentPay contracts, walk through common channel operations, and feature the unique contract versioning design to allow decentralized, peer-controlled contract upgrade.
