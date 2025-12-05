import { index, onchainTable, relations, primaryKey } from "ponder";

export const auction = onchainTable("auction", (t) => ({
  chainId: t.integer().notNull(),
  address: t.hex().notNull(), // Auction contract address
  creator: t.hex().notNull(),

  // token
  tokenAddress: t.hex().notNull(),
  totalCleared: t.bigint().notNull(),
  tokenName: t.text().notNull(),
  tokenSymbol: t.text().notNull(),

  // raisedCurrency
  currency: t.hex().notNull(),
  currencyRaised: t.bigint().notNull(),
  requiredCurrencyRaised: t.bigint().notNull(),

  // Timeline
  createdAt: t.integer().notNull(),
  lastUpdatedAt: t.integer().notNull(),
  startBlock: t.bigint().notNull(),
  endBlock: t.bigint().notNull(),
  claimBlock: t.bigint().notNull(),
  isGraduated: t.boolean().notNull().default(false),

  // Price
  floorPrice: t.bigint().notNull(),
  clearingPrice: t.bigint().notNull(),
  tickSpacing: t.integer().notNull(),
  auctionSupply: t.bigint().notNull(),

  // Count
  totalBids: t.integer().notNull().default(0),
  totalBidders: t.integer().notNull().default(0),

  // Metadata
  metadataUri: t.text()
}), (table) => ({
  pk: primaryKey({ columns: [table.chainId, table.address] }),
  creatorIdx: index().on(table.creator),
  tokenIdx: index().on(table.tokenAddress),
  currencyIdx: index().on(table.currency),
  graduatedIdx: index().on(table.isGraduated),
  createdAtIdx: index().on(table.createdAt),
}));

export const bid = onchainTable("bid", (t) => ({
  chainId: t.integer().notNull(),
  bidId: t.bigint().notNull(),
  auctionAddress: t.hex().notNull(),
  owner: t.hex().notNull(),
  maxPrice: t.bigint().notNull(),
  amount: t.bigint().notNull(),
  tokensFilled: t.bigint(),
  currencyRefunded: t.bigint(),
  // Blocks
  startBlock: t.bigint().notNull(),
  exitedBlock: t.bigint(),
  claimedBlock: t.bigint(),
  lastFulfilledBlock: t.bigint(),
  outbidBlock: t.bigint(),

  createdAt: t.integer().notNull(),
  lastUpdatedAt: t.integer().notNull(),

  txHash: t.hex().notNull(),
}), (table) => ({
  pk: primaryKey({ columns: [table.chainId, table.auctionAddress, table.bidId] }),
  ownerIdx: index().on(table.owner),
  maxPriceIdx: index().on(table.maxPrice),
  createdAtIdx: index().on(table.createdAt),
  lastFulfilledBlockIdx: index().on(table.lastFulfilledBlock),
  outbidBlockIdx: index().on(table.outbidBlock),
}));

export const checkpoint = onchainTable("checkpoint", (t) => ({
  chainId: t.integer().notNull(),
  auctionAddress: t.hex().notNull(),
  blockNumber: t.bigint().notNull(),
  clearingPrice: t.bigint().notNull(),
  totalCleared: t.bigint().notNull(),
  currencyRaisedAtClearingPrice: t.bigint().notNull(), // Q96_X7
  cumulativeMpsPerPrice: t.bigint().notNull(),
  cumulativeMps: t.integer().notNull(),
  prevBlock: t.bigint(),
  nextBlock: t.bigint(),
  createdAt: t.integer().notNull(),
}), (table) => ({
  pk: primaryKey({ columns: [table.chainId, table.auctionAddress, table.blockNumber] }),
  auctionIdx: index().on(table.auctionAddress),
  blockNumberIdx: index().on(table.blockNumber),
  clearingPriceIdx: index().on(table.clearingPrice),
}));

export const bidRelations = relations(bid, ({ one }) => ({
  lastFulfilledCheckpoint: one(checkpoint, { fields: [bid.chainId, bid.auctionAddress, bid.lastFulfilledBlock], references: [checkpoint.chainId, checkpoint.auctionAddress, checkpoint.blockNumber] }),
  outbidCheckpoint: one(checkpoint, { fields: [bid.chainId, bid.auctionAddress, bid.outbidBlock], references: [checkpoint.chainId, checkpoint.auctionAddress, checkpoint.blockNumber] }),
}));

export const auctionBidder = onchainTable("auctionBidder", (t) => ({
  chainId: t.integer().notNull(),
  auctionAddress: t.hex().notNull(),
  owner: t.hex().notNull(),
  totalBids: t.integer().notNull(),
  currencySpent: t.bigint().notNull(),
}), (table) => ({
  pk: primaryKey({ columns: [table.chainId, table.auctionAddress, table.owner] }),
}));
