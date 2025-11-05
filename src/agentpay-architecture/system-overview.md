# System Overview

Celer AgentPay provides a scalable, trust-free, and privacy-preserving infrastructure for real-time micropayments among autonomous AI agents, decentralized services, and human users. It enables agents to exchange value continuously—paying per inference, per data query, or per compute task—while maintaining blockchain-grade security and instant off-chain finality.

The system architecture separates payment execution, application logic, and network routing into distinct but interoperable layers. This modular design ensures high throughput, minimal latency, and flexible integration with a wide variety of blockchain ecosystems and AI-agent frameworks.

***

### System Architecture&#x20;

<img src="../.gitbook/assets/Screenshot 2025-10-29 at 10.57.23 AM.png" alt=""><figcaption></figcaption>

The figure above illustrates the high-level architecture of the AgentPay network. It consists of three main components: the **payment channel**, the **app channel**, and the **nodes connected by these channels**. Together they enable secure, low-latency economic interactions off-chain, with on-chain settlement only when necessary.

**Payment channel.** This is the hop-by-hop value-transfer layer, combining on-chain channel contracts with an off-chain payment protocol. The shared contracts keep only minimal states for each adjacent pair of peers, while the off-chain protocol defines how peers exchange and advance signed states and when to invoke the rare on-chain calls. Payments can carry _arbitrary conditions based on on-chain-verifiable states_, enabling programmable logic such as “pay if result verified” or “release tokens once oracle confirms.” Multi-hop routing allows a payment to traverse a path of channels (e.g., A→B→C→D) with instant off-chain finality at each hop and enforceability on-chain if disputed.

**App channel.** This is the application-logic layer, combining end-to-end app contracts with a virtual off-chain channel protocol between the session participants. Dashed lines in the figure above indicate these _virtual modules, which connect agents directly without intermediate hops or on-chain initialization_. App channels express arbitrary logic—such as inference fulfillment, data delivery, or API metering—and expose a standard query interface so that payment conditions can depend on app outcomes. An on-chain contract is only deployed if a dispute arises, allowing agents to execute complex application logic entirely off-chain while keeping costs low and interactions efficient.

**Nodes connected by channels.** Each node runs the payment channel protocol and participates in the AI agent network by opening a payment channel with at least one peer. The network protocol itself is a homogeneous peer-to-peer system—every node follows the same protocol and can communicate directly with others. However, roles can differentiate based on liquidity, uptime, and capability: nodes with higher capital reserves and stronger reliability act as **service nodes** (server-like), maintaining many channels, relaying payments, and improving connectivity; **regular agent nodes** (client-like) typically connect to one or more service nodes, can go offline when idle, and still retain full custody and settlement rights. The boundary between these roles is fluid, and any node can evolve into a service node by contributing liquidity and uptime.

***

### Design Principles

AgentPay is designed to provide a high-performance, low-cost, and trust-free platform for decentralized applications and AI-agent payments, without compromising security or decentralization. The protocol design follows careful consideration of activity, cost, and failure patterns in large-scale distributed systems. The following principles guide the architecture, listed in order of priority.

**Minimize on-chain footprint.** On-chain operations are expensive and slow. AgentPay keeps nearly all state transitions off-chain and interacts with the blockchain only when absolutely necessary—such as during deposits, withdrawals, or dispute resolution. Each on-chain operation is deeply optimized to reduce gas consumption by avoiding redundant contract deployment, minimizing the number of transactions per business-level action, and keeping per-channel storage compact.

**Minimize relay-node on-chain interaction.** To achieve scalability and robustness, the system follows an end-to-end principle: complexity is pushed to the edge of the network. Intermediate service nodes that relay payments should have minimal need to perform on-chain operations or view calls. Responsibility for dispute handling remains with the sender and receiver, simplifying the relay nodes’ role and improving network resilience against failures or attacks.

**Minimize on-chain view calls.** While view calls do not consume gas, they can still become performance and cost bottlenecks when used heavily in production. Most entities rely on external RPC providers for blockchain queries, which introduces latency and cost. AgentPay therefore minimizes view calls by caching required data locally and exchanging verified state information directly between peers whenever possible.

**Minimize off-chain communication overhead.** Although off-chain communication is far faster than on-chain interaction, it must still be optimized for latency and reliability. The AgentPay protocol reduces message round trips and storage I/O for every operation to achieve high throughput. Efficient message encoding and lightweight acknowledgment patterns ensure stable real-time performance, even under high network load.

**Adopt a decoupled architecture.** AgentPay separates payment channels from application channels through a simple conditional interface. This modular design reduces system complexity, improves scalability, and allows payment conditions to depend on arbitrary on-chain or off-chain verifiable states. The decoupled structure enables composable interactions between agents, allowing new application types and services to integrate without changing the core payment logic.

**Enable decentralized, peer-controlled versioning.** Unlike proxy-based upgrade patterns that rely on centralized administrators and fragile storage layouts, AgentPay adopts a versioned contract architecture where each channel can migrate independently to a new contract version once both peers agree. This eliminates proxy complexity, removes the need for trusted upgrade controllers, and allows seamless logic evolution without downtime. Structured modular contracts and protobuf-based serialization ensure forward compatibility and smooth feature extension across agents and chains.

***

### Summary

Celer AgentPay enables real-time, trust-free payments among autonomous AI agents by combining on-chain security with off-chain performance. Its architecture separates the payment channel, app channel, and agent network—supporting programmable conditional payments, lightweight virtual application sessions, and a homogeneous peer-to-peer network of agents and service nodes.

Guided by principles that minimize on-chain cost, reduce communication overhead, and preserve modularity, AgentPay provides a scalable and extensible foundation for autonomous economic coordination across blockchains and AI ecosystems.\
