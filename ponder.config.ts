import { createConfig, factory } from "ponder";
import { UniClearLauncherAbi } from "./abis/UniClearLauncherAbi";
import { CCAAbi } from "./abis/CCAAbi";
import { http, parseAbiItem } from "viem";

const AuctionCreatedEvent = parseAbiItem("event AuctionCreated(address auction,address token,address creator,(address raisedCurrency,int24 tickSpacing,uint64 startBlock,uint64 endBlock,uint64 claimBlock,uint256 floorPrice,uint128 requiredCurrencyRaised,uint128 auctionSupply) config)");;

export default createConfig({
  chains: {
    unichainSepolia: {
      id: 1301,
      rpc: http("https://unichain-sepolia.drpc.org")
    },
    unichain: {
      id: 130,
      rpc: http("https://unichain.drpc.org")
    },
  },
  contracts: {
    UniClearLauncher: {
      abi: UniClearLauncherAbi,
      chain: "unichainSepolia",
      address: "0xd2465E107f25df9afC09Bfd0f533E9F4fF22B31F",
      startBlock: 37277649,
    },
    UniClearAuction: {
      abi: CCAAbi,
      chain: "unichainSepolia",
      address: factory({
        address: "0xd2465E107f25df9afC09Bfd0f533E9F4fF22B31F",
        event: AuctionCreatedEvent,
        parameter: "auction",
      }),
      startBlock: 37277649,
    },
  },
});