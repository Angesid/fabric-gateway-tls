import { createPrivateKey } from "crypto";
import { promises as fs } from "fs";
import { Client, credentials } from "@grpc/grpc-js";
import {
  connect,
  Gateway,
  GrpcClient,
  Identity,
  Signer,
  signers,
} from "@hyperledger/fabric-gateway";
import { decodeBlob, getFirstDirFileName } from "@lib/utils";
import { PEER, TLS_DIR_PATH, CERT_DIR_PATH, KEY_DIR_PATH } from "@config";
import { createLogger } from "@plugins/logger";

/**
 *  Gateway Service Logger
 */
const logger = createLogger("Gateway");

/**
 * Establishes a new gRPC connection to the Fabric peer.
 *
 * @returns {Promise<Client>} A promise that resolves to a gRPC client connected to the peer.
 */
export async function newGrpcConnection(): Promise<Client> {
  const tlsRootCert = await fs.readFile(TLS_DIR_PATH);
  const tlsCredentials = credentials.createSsl(tlsRootCert);
  return new Client(PEER.endpoint, tlsCredentials, {
    "grpc.ssl_target_name_override": PEER.alias,
  });
}

/**
 * Creates a new identity for interacting with the Hyperledger Fabric network.
 *
 * @returns {Promise<Identity>} A promise that resolves to an Identity object containing MSP ID and credentials.
 */
export async function newIdentity(): Promise<Identity> {
  const certPath = await getFirstDirFileName(CERT_DIR_PATH);
  const credentials = await fs.readFile(certPath);
  return { mspId: PEER.mspId, credentials: new Uint8Array(credentials) };
}

/**
 * Creates a new signer using the private key.
 *
 * @returns {Promise<Signer>} A promise that resolves to a signer for transaction signing.
 */
export async function newSigner(): Promise<Signer> {
  const keyPath = await getFirstDirFileName(KEY_DIR_PATH);
  const privateKeyPem = await fs.readFile(keyPath);
  const privateKey = createPrivateKey(privateKeyPem);
  return signers.newPrivateKeySigner(privateKey);
}

/**
 * Creates and configures a new Hyperledger Fabric Gateway connection.
 *
 * @returns {Promise<Gateway>} A promise that resolves to a connected Fabric Gateway instance.
 */
export async function createGateway(): Promise<Gateway> {
  const client = await newGrpcConnection();
  return connect({
    client: client as unknown as GrpcClient, //FIXME Workaround for type mismatch, might cause errors (!)
    identity: await newIdentity(),
    signer: await newSigner(),
    evaluateOptions: () => {
      return { deadline: Date.now() + 5000 };
    },
    endorseOptions: () => ({ deadline: Date.now() + 15000 }),
    submitOptions: () => ({ deadline: Date.now() + 10000 }),
    commitStatusOptions: () => ({ deadline: Date.now() + 60000 }),
  });
}

/**
 * Retrieves a block from the blockchain based on its index.
 *
 * @param {Gateway} gateway - The Fabric Gateway instance.
 * @param {string} channelName - The name of the channel to query.
 * @param {number} index - The block number to retrieve.
 * @returns {Promise<any>} A promise that resolves to the block data.
 * @throws {Error} If the block retrieval fails.
 */
export async function getBlock(
  gateway: Gateway,
  channelName: string,
  index: number
): Promise<any> {
  try {
    const network = gateway.getNetwork(channelName);
    const contract = network.getContract("qscc"); // Query system chaincode
    const resultBytes = await contract.evaluateTransaction(
      "GetBlockByNumber",
      channelName,
      index.toString()
    );
    return JSON.parse(resultBytes.toString());
  } catch (error) {
    logger.error(error);
    throw new Error(`Failed to retrieve block: ${error}`);
  }
}

/**
 * Queries the Fabric blockchain via a smart contract.
 *
 * @template T The expected response type.
 * @param {Gateway} gateway - The Fabric Gateway instance.
 * @param {string} channelName - The name of the channel.
 * @param {string} chaincode - The chaincode to query.
 * @param {string} method - The method to invoke.
 * @param {string[]} args - Arguments for the query.
 * @returns {Promise<T>} A promise that resolves to the parsed query result.
 */
export async function queryGateway<T>(
  gateway: Gateway,
  channelName: string,
  chaincode: string,
  method: string,
  args: string[]
): Promise<T> {
  try {
    const network = gateway.getNetwork(channelName);
    const contract = network.getContract(chaincode);
    const resultBytes = await contract.evaluateTransaction(method, ...args);
    return JSON.parse(decodeBlob(resultBytes)) as T;
  } catch (error) {
    logger.error(error);
    throw new Error(`Failed to query gateway: ${error}`);
  }
}

/**
 * Invokes a transaction on the Fabric blockchain via a smart contract.
 *
 * @template T The expected response type.
 * @param {Gateway} gateway - The Fabric Gateway instance.
 * @param {string} channelName - The name of the channel.
 * @param {string} chaincode - The chaincode to invoke.
 * @param {string} method - The method to invoke.
 * @param {string[]} args - Arguments for the transaction.
 * @returns {Promise<T>} A promise that resolves to the parsed transaction result.
 */
export async function invokeGateway<T>(
  gateway: Gateway,
  channelName: string,
  chaincode: string,
  method: string,
  args: string[]
): Promise<T> {
  try {
    const network = gateway.getNetwork(channelName);
    const contract = network.getContract(chaincode);
    const resultBytes = await contract.submitTransaction(method, ...args);
    return JSON.parse(decodeBlob(resultBytes)) as T;
  } catch (error) {
    logger.error(error);
    throw new Error(`Failed to invoke gateway: ${error}`);
  }
}
