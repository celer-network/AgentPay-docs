# Off-Chain Availability Problem

Off-chain systems like AgentPay achieve scalability and low cost by moving most interactions away from the blockchain. The tradeoff is that participants — whether human users or autonomous AI agents — must keep their latest off-chain states available and be able to respond if a counterparty initiates an on-chain dispute.

In the early era of user-operated state channels, this **“always-online” requirement** was a major usability barrier. In the AI Agent world, the issue is less frequent since agents typically operate on persistent infrastructure, but the **risk remains non-negligible**. A node crash, a configuration bug, or a service outage during a dispute window could still result in permanent fund loss or incorrect settlement.

While dispute windows are designed to be long enough to tolerate temporary downtime or network interruptions, they cannot prevent problems caused by **prolonged unavailability** — for example, when an agent is offline for days, loses access to its stored state proofs, or fails to monitor on-chain events.

If such a failure occurs, the blockchain will finalize the most recently submitted state, even if it is outdated or maliciously chosen by the counterparty. This can lead to irreversible outcomes such as lost funds or invalid app states. The burden of maintaining continuous online availability thus fundamentally contradicts the goal of a fully autonomous and fault-tolerant agent system.

To eliminate this dependence, AgentPay introduces the **State Guardian Network (SGN)** — a decentralized network of bonded validators that provides **state availability and protection as a service**. SGN securely stores cryptographic commitments of off-chain states and automatically acts on-chain during disputes or expirations, ensuring correct outcomes even when participants are offline. With SGN, the liveness and reliability of AgentPay channels and App sessions no longer rely on user or agent uptime, but on the **economic security** of a decentralized validator network.
