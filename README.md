BlockVault

A decentralized, permission-driven file sharing platform — combining IPFS for distributed storage and Ethereum smart contracts for cryptographic access control. BlockVault delivers tamper-resistant, auditable, and permissioned file sharing with a modern Web3 UX.

✨ Highlights

Decentralized storage (IPFS) — content-addressed, redundant, and censorship resistant

On-chain access control — grant/revoke via Ethereum smart contracts

Wallet authentication — MetaMask (EIP-191 / EIP-712)

Auditability — immutable transaction logs and event indexing

Operational resilience — pinning provider failover, background workers, cache invalidation

🧭 Table of contents

Quick Overview

Architecture

Features

Getting Started

Local Development

Smart Contracts

Testing

Environment Variables

Contributing

License & Credits

🔎 Quick Overview

BlockVault is built for teams and researchers who need secure, auditable file sharing without centralized trust. Files are stored on IPFS and referenced by content identifiers (CIDs). Access is enforced on-chain, so owners can grant or revoke access to specific Ethereum addresses. The backend indexes on-chain events, manages pinning jobs, and provides authenticated APIs for the UI.

🏗 Architecture

Frontend: React (TypeScript), Tailwind CSS, Ethers.js — wallet auth, upload UI, access management

Backend: Node.js (TypeScript), Express/Fastify — IPFS adapters, pinning queue, indexer, ACL logic

Storage: IPFS (Web3.Storage / Pinata) + optional self-hosted IPFS cluster

Blockchain: Solidity contracts on Ethereum (testnets for dev) — File registry + ACL events

DB & Cache: PostgreSQL (metadata, logs), Redis (cache, queues)

Workers: Background workers (BullMQ/RabbitMQ) for pin jobs, retries, and index processing

✨ Features

Wallet-based sign-in (MetaMask)

Upload & pin files to IPFS (client or server mediated)

On-chain registration of file metadata (CID, owner, size, timestamp)

Grant / revoke access (whitelist / blacklist semantics)

Group & organization management (bulk sharing)

Audit logs with tx hashes and timestamps

Optional client-side encryption (CEK per recipient)

Relayer support for batched on-chain operations (optional, HSM/KMS required)
