// This file contains the deployed contract addresses and ABIs for the frontend to use
export const INSURACLE_ADDRESS = "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853";
export const MOCK_ORACLE_ADDRESS = "0x0165878A594ca255338adfa4d48449f69242Eb8F";
import INSURACLE_ABI_JSON from "../../../insuracle-abi.json";
import MOCK_ORACLE_ABI_JSON from "../../../artifacts/contracts/mocks/MockV3Aggregator.sol/MockV3Aggregator.json";
export const INSURACLE_ABI = INSURACLE_ABI_JSON as any;
export const MOCK_ORACLE_ABI = MOCK_ORACLE_ABI_JSON.abi as any;
