# Channel Operations

This section explains the key **on-chain operations** in AgentPay, including opening channels, depositing and withdrawing funds, resolving payments, and closing channels. Although most payments occur off-chain for efficiency, the system is optimized to handle the occasional on-chain interactions with **minimal cost and latency**.

The **AgentPayLedger** contract manages each channel’s on-chain lifecycle and acts as the main entry point for user operations. Every payment channel transitions through the following five states:

* `Uninitialized` — the channel has not yet been created in the current AgentPayLedger.
* `Operable` — the channel is active and available for regular use.
* `Settling` — the channel is undergoing unilateral settlement.
* `Closed` — the channel has been finalized and closed.
* `Migrated` — the channel has been moved to another AgentPayLedger version.

***

### Open Channel

The AgentPayLedger contract provides an `openChannel` API that enables participants to create and fund a payment channel in a single transaction. The API accepts a co-signed channel initializer message from both peers:

```protobuf
message PaymentChannelInitializer {
    // token type and initial balance distribution between peers
    TokenDistribution init_distribution = 1;
    // expiration time for this initializer
    uint64 open_deadline = 2 [(soltype) = "uint"];
    // time window to challenge unilateral actions
    uint64 dispute_timeout = 3 [(soltype) = "uint"];
    // index of the peer receiving any native tokens (e.g., msg.value)
    uint64 msg_value_receiver = 4 [(soltype) = "uint"];
    // chain id of the intended target chain
    uint64 chain_id = 5 [(soltype) = "uint"];
    // address of the intended target ledger
    bytes ledger_address = 6 [(soltype) = "address"];
}
```

Upon receiving a valid initializer, the AgentPayLedger executes the following steps atomically:

1. Creates a wallet in AgentPayWallet, using the returned wallet address to derive the unique `channel_id = Hash(walletAddress, ledgerAddress, Hash(channelInitializer))`.
2. Initializes the channel entry in on-chain storage with the provided parameters.
3. Transfers the specified token amounts—either ERC-20 or native tokens—from the peers to the AgentPayWallet according to the agreed initial distribution.

This single-step process allows peers to open a fully funded, operational channel without multiple setup transactions.

***

### Deposit

Anyone — not just the channel peers — can deposit funds into an existing payment channel by calling the `deposit` API of AgentPayLedger. The function takes three arguments: the **channel ID**, the **receiver address**, and the **deposit amount**.

The AgentPayLedger contract verifies that the token type matches the channel configuration, then transfers the tokens from the sender to the channel’s wallet managed by AgentPayWallet.

While all tokens ultimately reside in the AgentPayWallet contract, ERC-20 token deposits still require a prior `approve` call granting AgentPayLedger permission to transfer the tokens on behalf of the depositor.

***

### Withdraw

Peers can withdraw funds from a channel at any time. **AgentPayLedger** supports two withdrawal modes:

* **Cooperative withdrawal** — completed instantly in a single transaction when both peers agree.
* **Unilateral withdrawal** — used when a peer is unavailable, requiring two transactions and a challenge period.

#### **Cooperative withdraw**

When both peers are online and cooperative, the withdrawer can execute a withdrawal in one transaction by calling the `cooperativeWithdraw` API and providing the co-signed message:

```protobuf
message CooperativeWithdrawInfo {
    bytes channel_id = 1 [(soltype) = "bytes32"];
    uint64 seq_num = 2 [(soltype) = "uint"];                // unique sequence number
    AccountAmtPair withdraw = 3;                            // recipient and amount
    uint64 withdraw_deadline = 4 [(soltype) = "uint"];
    bytes recipient_channel_id = 5 [(soltype) = "bytes32"]; // optional
}
```

Upon verification, **AgentPayLedger** transfers tokens from the channel’s **AgentPayWallet** either to the specified recipient account (field 3) or to another channel (field 5). This second option enables service nodes to quickly rebalance liquidity across multiple channels without first withdrawing on-chain.

#### **Unilateral withdraw**

If a peer cannot reach its counterparty for co-signing, it can initiate a unilateral withdrawal using `intendWithdraw(channel_id, amount, recipient_channel_id)`. This starts a **challenge window**, during which the counterparty may call `vetoWithdraw` to dispute the request. Once the window closes without objection, the withdrawer finalizes the operation by calling `confirmWithdraw`.

This two-step mechanism guarantees both liveness and fairness when one peer is temporarily offline.

***

### Resolve Payment

When peers cannot cooperatively clear a payment off-chain, they can resolve it on-chain through the **PayResolver** contract before the payment’s resolve deadline (field 6 of the [ConditionalPay message](core-data-structures.md#conditional-payment)). The resolver validates the payment’s final outcome and records it in the global **PayRegistry**, serving as a shared on-chain reference for all related channels.

Payments can be resolved either by evaluating their **conditions** or by submitting a **vouched result** co-signed by the source and destination.

#### **Resolve payment by conditions**

The `resolvePaymentByConditions` API of **PayResolver** is used once all conditions of a payment are finalized on-chain. The call includes:

1. The complete _ConditionalPay_ data.
2. All _hash preimages_ for any hash-lock conditions.

The contract verifies the preimages, queries each condition’s outcome, and computes the resulting amount, which is then written to the **PayRegistry**.

All conditions must be finalized before the call executes; otherwise, the transaction will revert. For payments referencing **virtual contracts**, those must first be instantiated on-chain through the [VirtContractResolver](contracts-architecture.md#virtcontractresolver) contract — invoked only in the dispute path, when an off-chain virtual App contract needs to be materialized for resolution.

Only the **payment source** or **destination** can initiate this operation; relay nodes never do. The complete flow is described in the [off-chain protocol](../off-chain-protocols/) section.

#### Resolve Payment by Vouched Result

Relay nodes never need to evaluate payment conditions themselves. In routed payments, conditions are relevant only to the original source and final destination, while intermediate relays care solely about the amount they should safely receive from upstream and forward downstream.

AgentPay supports **vouched resolution**, where the payment source and destination co-sign an agreed result. This vouched proof allows any relay to securely resolve a disputed payment with its direct peer on-chain, even if that peer becomes uncooperative.

```protobuf
message VouchedCondPayResult {
    bytes cond_pay_result = 1; // serialized CondPayResult
    bytes sig_of_src = 2;
    bytes sig_of_dest = 3;
}
message CondPayResult {
    bytes cond_pay = 1;        // serialized ConditionalPay
    bytes amount = 2 [(soltype) = "uint256"];
}
```

Any node holding this co-signed proof can call the `resolvePaymentByVouchedResult` API to finalize the payment and record it in the **PayRegistry**. As detailed in the off-chain protocol, relays can also use this vouched proof to clear their own corresponding off-chain payments with upstream peers.

#### Dispute the Payment Result

All nodes involved in a routed payment reference the same result in **PayRegistry**, ensuring consistency and fairness even if the payment source and destination collude to submit conflicting results.

**PayResolver** updates the registry according to the following rules:

* If the resolved amount equals `transfer_func.max_transfer` (field 2 of the [TransferFunction](core-data-structures.md#transfer-function) referenced by field 5 of ConditionalPay), the result is immediately finalized.
* Otherwise, a **challenge window** (field 7 of ConditionalPay) opens, during which others may re-resolve the payment with additional evidence.

During the challenge period, a result can only be updated **to a higher amount**, never lower—a protection mechanism for relay nodes aligned with off-chain protocol guarantees. The result becomes final when the challenge window closes or the resolve deadline passes, whichever comes first.

***

### Settle / Close Channel

A node can choose to **settle or close a channel** with its peer either **cooperatively** or **unilaterally**, similar to the withdrawal operation. Cooperative settling is preferred since it completes in a single transaction, while unilateral settling is used only when peers cannot agree or one party becomes unresponsive.

#### **Cooperative Settle**

The `cooperativeSettle` API in **AgentPayLedger** allows peers to close a channel instantly with a co-signed request containing the final balance distribution.

```protobuf
message CooperativeSettleInfo {
    bytes channel_id = 1 [(soltype) = "bytes32"];
    // a sequence number greater than both simplex channels' sequence numbers
    uint64 seq_num = 2 [(soltype) = "uint"];
    // final balance distributions to the two peers
    repeated AccountAmtPair settle_balance = 3;
    // until when this message remains valid
    uint64 settle_deadline = 4 [(soltype) = "uint"];
}
```

Upon receiving a valid co-signed request, **AgentPayLedger** closes the channel and distributes balances according to field 3. All off-chain simplex states and pending conditional payments are ignored — the cooperative signature itself serves as the final agreement.

#### **Unilateral Settle**

If cooperation is not possible, a peer can initiate a unilateral settle by calling `intendSettle`, providing the latest co-signed off-chain simplex states as input. **AgentPayLedger** computes the final balance distribution using these states and the outcomes of pending payments retrieved from the **PayRegistry**.

A **challenge window** is then opened, allowing the counterparty to submit newer simplex states with higher sequence numbers if available. Once the window closes, the initiating peer can finalize the process by calling `confirmSettle`, which closes the channel and releases the final balances accordingly.
