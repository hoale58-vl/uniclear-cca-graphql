# UniClear GraphQL Indexer

A GraphQL indexer for UniClear auction platform built with [Ponder](https://ponder.sh/). This indexer tracks and indexes auction events, bids, and checkpoints from the UniClear protocol on Unichain.

## Overview

UniClear is a decentralized auction platform. This indexer provides a GraphQL API to query auction data, including:

- Auction creation and configuration
- Bid placement and tracking
- Clearing price checkpoints
- Token distribution and claims
- Bidder statistics

## Features

- Real-time indexing of UniClear auction events
- GraphQL API for querying auction data
- Support for Unichain Sepolia and Unichain mainnet
- Relational data model with optimized indexes
- Historical checkpoint tracking for clearing prices

## Data Schema

### Auction

Tracks auction contracts and their configuration:

- Address and creator
- Token information (address, name, symbol)
- Currency details and fundraising targets
- Timeline (start, end, claim blocks)
- Pricing information (floor price, clearing price)
- Statistics (total bids, bidders, cleared tokens)

### Bid

Individual bid records:

- Bid ID and auction reference
- Owner and bid parameters (max price, amount)
- Fill and refund tracking
- Status tracking (created, exited, claimed)
- Transaction hash

### Checkpoint

Historical snapshots of auction state:

- Block-level clearing price data
- Total cleared tokens at each checkpoint
- Cumulative statistics
- Linked list structure for efficient querying

### Auction Bidder

Aggregated bidder statistics per auction:

- Total bids placed
- Total currency spent

## GraphQL Query Examples

### Get all auctions

```graphql
query {
  auctions {
    items {
      address
      tokenName
      tokenSymbol
      clearingPrice
      totalCleared
      isGraduated
    }
  }
}
```

### Get bids for an auction

```graphql
query {
  bids(where: { auctionAddress: "0x..." }) {
    items {
      bidId
      owner
      maxPrice
      amount
      tokensFilled
    }
  }
}
```

### Get clearing price checkpoints

```graphql
query {
  checkpoints(
    where: { auctionAddress: "0x..." }
    orderBy: "blockNumber"
    orderDirection: "asc"
  ) {
    items {
      blockNumber
      clearingPrice
      totalCleared
    }
  }
}
```

## Contracts

| Contract | Unichain Sepolia |
|----------|------------------|
| UniClearLauncher | `0xd2465E107f25df9afC09Bfd0f533E9F4fF22B31F` |
| Start Block | 37277649 |

The indexer also tracks all auction contracts created via the factory pattern.

## Architecture

This indexer uses [Ponder](https://ponder.sh/) to:

1. Listen to blockchain events from UniClear contracts
2. Process and transform event data
3. Store data in a relational database (SQLite or PostgreSQL)
4. Serve data via an auto-generated GraphQL API

## Docker Support

A Dockerfile is included for containerized deployments:

```bash
docker build -t uniclear-indexer .
docker run -p 42069:42069 uniclear-indexer
```

## License

GPL-3.0

## Support

For issues and questions, please open an issue in the repository.
