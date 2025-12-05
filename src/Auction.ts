import { ponder } from "ponder:registry";
import schema from "ponder:schema";
import { CCAAbi } from "../abis/CCAAbi";
import { and, lt, lte, eq, isNull } from "drizzle-orm";

// event BidSubmitted(uint256 indexed id, address indexed owner, uint256 price, uint128 amount);
ponder.on("UniClearAuction:BidSubmitted", async ({ event, context }) => {
    const { id, owner, price, amount } = event.args;
    const auctionAddress = event.log.address;
    const chainId = context.chain.id;

    // Create bid record
    await context.db.insert(schema.bid).values({
        // ChainId
        chainId,
        bidId: id,
        auctionAddress,
        owner,
        maxPrice: price,
        amount,
        startBlock: event.block.number,
        // exitedBlock == 0 (null), not exit
        // exitedBlock > 0 and tokensFilled > 0, not claimed
        // exitedBlock > 0 and tokensFilled == 0 (null), not graduated or graduated but claimed

        createdAt: Number(event.block.timestamp),
        lastUpdatedAt: Number(event.block.timestamp),
        txHash: event.transaction.hash
    });

    // Update auctionBidder
    const row = await context.db
        .insert(schema.auctionBidder)
        .values({ chainId, auctionAddress, owner, totalBids: 1, currencySpent: amount })
        .onConflictDoUpdate((_row) => ({ totalBids: _row.totalBids + 1, currencySpent: _row.currencySpent + amount }));
    const isNewBidder = row.totalBids === 1;

    // Update auction count
    await context.db.update(schema.auction, { chainId, address: auctionAddress })
        .set((_row) => ({ totalBids: _row.totalBids + 1, totalBidders: _row.totalBidders + (isNewBidder ? 1 : 0) }));
});

// event BidExited(uint256 indexed bidId, address indexed owner, uint256 tokensFilled, uint256 currencyRefunded);
ponder.on("UniClearAuction:BidExited", async ({ event, context }) => {
    const { bidId, tokensFilled, currencyRefunded } = event.args;
    const auctionAddress = event.log.address;
    const chainId = context.chain.id;

    // Update bid record to mark as exited
    await context.db
        .update(schema.bid, { chainId, auctionAddress, bidId })
        .set({
            exitedBlock: event.block.number,
            tokensFilled,
            currencyRefunded,
            lastUpdatedAt: Number(event.block.timestamp),
        });
});

// event TokensClaimed(uint256 indexed bidId, address indexed owner, uint256 tokensFilled);
ponder.on("UniClearAuction:TokensClaimed", async ({ event, context }) => {
    const { bidId, owner, tokensFilled } = event.args;
    const auctionAddress = event.log.address;
    const chainId = context.chain.id;

    // Update bid record to mark as claimed
    await context.db
        .update(schema.bid, { chainId, auctionAddress, bidId })
        .set({
            tokensFilled: 0n,
            claimedBlock: event.block.number,
            lastUpdatedAt: Number(event.block.timestamp),
        });
});

// event CheckpointUpdated(uint256 blockNumber, uint256 clearingPrice, uint24 cumulativeMps);
ponder.on("UniClearAuction:CheckpointUpdated", async ({ event, context }) => {
    const { blockNumber, clearingPrice, cumulativeMps } = event.args;
    const auctionAddress = event.log.address;
    const chainId = context.chain.id;

    // Read full checkpoint data from contract
    const [currencyRaised, totalCleared, checkpointData] = await Promise.all([context.client.readContract({
        abi: CCAAbi,
        address: auctionAddress,
        functionName: "currencyRaised",
        args: [],
    }),
    context.client.readContract({
        abi: CCAAbi,
        address: auctionAddress,
        functionName: "totalCleared",
        args: [],
    }),
    context.client.readContract({
        abi: CCAAbi,
        address: auctionAddress,
        functionName: "checkpoints",
        args: [blockNumber],
    })
    ]);

    // Insert checkpoint record
    await context.db.insert(schema.checkpoint).values({
        // ChainId
        chainId: context.chain.id,
        auctionAddress,
        blockNumber,
        totalCleared,
        clearingPrice,
        currencyRaisedAtClearingPrice: checkpointData.currencyRaisedAtClearingPriceQ96_X7,
        cumulativeMpsPerPrice: checkpointData.cumulativeMpsPerPrice,
        cumulativeMps,
        prevBlock: checkpointData.prev > 0n ? checkpointData.prev : null,
        nextBlock: checkpointData.next > 0n ? checkpointData.next : null,
        createdAt: Number(event.block.timestamp),
    });

    // Update auction process
    await context.db
        .update(schema.auction, { chainId, address: auctionAddress })
        .set({
            currencyRaised,
            totalCleared,
            lastUpdatedAt: Number(event.block.timestamp),
        });

    // Update outbit and fullfilled checkpoint -> are much slower than the store API
    if (checkpointData.prev) {
        const lastFulfilledCheckpointBlock = checkpointData.prev;
        await context.db.sql
            .update(schema.bid)
            .set({ lastFulfilledBlock: lastFulfilledCheckpointBlock })
            .where(
                and(
                    eq(schema.bid.auctionAddress, auctionAddress),
                    isNull(schema.bid.lastFulfilledBlock),
                    lte(schema.bid.maxPrice, clearingPrice)
                )
            );
    }

    await context.db.sql
        .update(schema.bid)
        .set({ outbidBlock: blockNumber })
        .where(
            and(
                eq(schema.bid.auctionAddress, auctionAddress),
                lt(schema.bid.maxPrice, clearingPrice)
            )
        );
});

// event ClearingPriceUpdated(uint256 blockNumber, uint256 clearingPrice);
ponder.on("UniClearAuction:ClearingPriceUpdated", async ({ event, context }) => {
    const { blockNumber, clearingPrice } = event.args;
    const auctionAddress = event.log.address;
    const chainId = context.chain.id;

    // Update auction clearing price
    await context.db
        .update(schema.auction, { chainId, address: auctionAddress })
        .set({
            clearingPrice: clearingPrice,
            lastUpdatedAt: Number(event.block.timestamp),
        });
});

ponder.on("UniClearAuction:NextActiveTickUpdated", async ({ event, context }) => {
});

ponder.on("UniClearAuction:TickInitialized", async ({ event, context }) => {
});

ponder.on("UniClearAuction:TokensReceived", async ({ event, context }) => {
});
