import { ponder } from "ponder:registry";
import schema from "ponder:schema";
import { ERC20Abi } from "../abis/ERC20Abi";

ponder.on("UniClearLauncher:AuctionCreated", async ({ event, context }) => {
  const { token, auction, auctionConfig, creator } = event.args;
  const { raisedCurrency, tickSpacing, startBlock, endBlock, claimBlock, floorPrice, requiredCurrencyRaised, auctionSupply } = auctionConfig;

  const [name, symbol] = await Promise.all([context.client.readContract({
    abi: ERC20Abi,
    address: token,
    functionName: "name",
    args: [],
  }),
  context.client.readContract({
    abi: ERC20Abi,
    address: token,
    functionName: "symbol",
    args: [],
  })]);

  // Create auction record
  await context.db.insert(schema.auction).values({
    // ChainId
    chainId: context.chain.id,

    // Auction contract address
    address: auction,
    creator,

    // token
    tokenAddress: token,
    totalCleared: 0n,
    tokenName: name,
    tokenSymbol: symbol,

    // currency
    currency: raisedCurrency,
    currencyRaised: 0n,
    requiredCurrencyRaised: requiredCurrencyRaised, // event need emit

    // Timeline
    createdAt: Number(event.block.timestamp),
    lastUpdatedAt: Number(event.block.timestamp),
    startBlock,
    endBlock,
    claimBlock,
    isGraduated: false,

    // Price
    floorPrice,
    clearingPrice: floorPrice,
    tickSpacing,
    auctionSupply
  });
});

ponder.on("UniClearLauncher:MetadataUriUpdated", async ({ event, context }) => {
  const { auctionAddress, metadataUri } = event.args;

  // Update auction metadata uri
  await context.db.update(schema.auction, { chainId: context.chain.id, address: auctionAddress })
          .set((_row) => ({ metadataUri: metadataUri }));
});

