import { index, onchainTable, relations } from "ponder";

export const auction = onchainTable("auction", (t) => ({
  address: t.hex().primaryKey(), // Auction contract address
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
  creatorIdx: index().on(table.creator),
  tokenIdx: index().on(table.tokenAddress),
  currencyIdx: index().on(table.currency),
  graduatedIdx: index().on(table.isGraduated),
  createdAtIdx: index().on(table.createdAt),
}));

export const bid = onchainTable("bid", (t) => ({
  id: t.text().primaryKey(), // auctionAddress-bidId
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
  lastFulfilledCheckpointId: t.text(),
  outbidCheckpointId: t.text(),

  createdAt: t.integer().notNull(),
  lastUpdatedAt: t.integer().notNull(),

  txHash: t.hex().notNull(),
}), (table) => ({
  auctionIdx: index().on(table.auctionAddress),
  ownerIdx: index().on(table.owner),
  maxPriceIdx: index().on(table.maxPrice),
  createdAtIdx: index().on(table.createdAt),
  lastFulfilledCheckpointIdx: index().on(table.lastFulfilledCheckpointId),
}));

export const checkpoint = onchainTable("checkpoint", (t) => ({
  id: t.text().primaryKey(), // auctionAddress-blockNumber
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
  auctionIdx: index().on(table.auctionAddress),
  blockNumberIdx: index().on(table.blockNumber),
  clearingPriceIdx: index().on(table.clearingPrice),
}));

export const bidRelations = relations(bid, ({ one }) => ({ 
  lastFulfilledCheckpoint: one(checkpoint, { fields: [bid.lastFulfilledCheckpointId], references: [checkpoint.id] }), 
  outbidCheckpoint: one(checkpoint, { fields: [bid.outbidCheckpointId], references: [checkpoint.id] }), 
})); 

export const auctionBidder = onchainTable("auctionBidder", (t) => ({
  id: t.text().primaryKey(), // auctionAddress-owner
  totalBids: t.integer().notNull(),
  currencySpent: t.bigint().notNull(),
}));
