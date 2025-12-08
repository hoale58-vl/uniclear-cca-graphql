import { createConfig, factory } from "ponder";
import { UniClearLauncherAbi } from "./abis/UniClearLauncherAbi";
import { CCAAbi } from "./abis/CCAAbi";
import { http, parseAbiItem } from "viem";

const AuctionCreatedEvent = parseAbiItem(
  "event AuctionCreated(address indexed auction,address indexed token,address indexed creator,(address raisedCurrency,int24 tickSpacing,uint64 startBlock,uint64 endBlock,uint64 claimBlock,uint256 floorPrice,uint128 requiredCurrencyRaised,uint128 auctionSupply) auctionConfig)"
);

export default createConfig({
  chains: {
    unichainSepolia: {
      id: 1301,
      rpc: http("https://unichain-sepolia.drpc.org"),
      ws: "wss://unichain-sepolia.drpc.org",
      ethGetLogsBlockRange: 5000,
    },
    unichain: {
      id: 130,
      rpc: http("https://unichain.drpc.org"),
      ws: "wss://unichain.drpc.org",
      ethGetLogsBlockRange: 5000,
    },
    base: {
      id: 8453,
      rpc: http("https://base.drpc.org"),
      ws: "wss://base-rpc.publicnode.com",
      ethGetLogsBlockRange: 5000,
    },
  },
  contracts: {
    UniClearLauncher: {
      abi: UniClearLauncherAbi,
      chain: {
        "unichainSepolia": {
          address: "0x11908772F5adc0872F4567A30560D38e5CDEF51d",
          startBlock: 37966493,
        },
        "unichain": {
          address: "0x44eDFBFdE4B4317e6cb9448427BBC535f9981fE6",
          startBlock: 34181764,
        },
        "base": {
          address: "0xC4beD85D81004fC9326023E5B31392239179ee96",
          startBlock: 39203832,
        }
      },
    },
    UniClearAuction: {
      abi: CCAAbi,
      chain: {
        "unichainSepolia": {
          address: factory({
            address: "0x11908772F5adc0872F4567A30560D38e5CDEF51d",
            event: AuctionCreatedEvent,
            parameter: "auction",
          }),
          startBlock: 37966493,
        },
        "unichain": {
          address: factory({
            address: "0x44eDFBFdE4B4317e6cb9448427BBC535f9981fE6",
            event: AuctionCreatedEvent,
            parameter: "auction",
          }),
          startBlock: 34181764,
        },
        "base": {
          address: factory({
            address: "0xC4beD85D81004fC9326023E5B31392239179ee96",
            event: AuctionCreatedEvent,
            parameter: "auction",
          }),
          startBlock: 39203832,
        }
      },
    },
  },
});