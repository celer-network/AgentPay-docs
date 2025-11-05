# Off-Chain Protocols

This section describes the hop-by-hop and end-to-end protocols that power AgentPay’s off-chain payment network. AgentPay achieves high throughput and scalability at both levels through two key architectural principles:

* **At the hop-by-hop layer**, the duplex channel is split into two unidirectional simplex states, allowing peers to send and receive payments concurrently with minimal coordination.
* **At the end-to-end layer**, the payment and application channels are decoupled, so multi-hop payments can be routed efficiently without carrying full application logic across the path.

Together, these design choices enable agents to exchange payments with sub-second latency, while preserving full security and on-chain enforceability in case of dispute.

The following sections explain how peers update off-chain channel states, relay conditional payments across multiple hops, and maintain consistent global settlement guarantees through cryptographic proofs and cooperative message signing.
