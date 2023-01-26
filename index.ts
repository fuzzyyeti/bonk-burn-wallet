import dotenv from "dotenv";
import { getSigner } from "./getSigner";
import BN from "bn.js";
import express from "express";
import { getBurned } from "./data";
import cors from 'cors'
import { tradeSolForBonk, burnBonk } from "./actions";
import { AnchorProvider, web3 } from "@project-serum/anchor";

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());

//Endpoint to create a dashboard counter for total burned
app.get("/burncount",cors(), async (req, res) => {
	const burned = await getBurned();
  return res.send(burned)
});
``

//Point the webhook to this endpoint. It expects a Helius enhanced transaction
app.post("/webhook", (req, res) => {
  const { body } = req;
  const data = body[0];
  if (data.type !== "TRANSFER" && data.type !== "NFT_SALE") {
    res.sendStatus(500).send("wrong event type");
  }
  const { provider, keypair } = getSigner();
  const royaltyWalletTransfers = data.nativeTransfers.filter((t: any) => 
    t.toUserAccount === provider.publicKey!.toBase58())
  if (royaltyWalletTransfers.length === 0) {
    res.send("No royalty transfer, nothing to do");
  }
  const amountToSwap = royaltyWalletTransfers.reduce((acc: number, t: any) => acc + t.amount, 0);
  console.log("ready to interact with the chain", amountToSwap);
  onChainActions(amountToSwap, provider, keypair)
  res.send("swap and burn kicked off");
});

const onChainActions = async (amountToSwap: BN, provider: AnchorProvider, signer: web3.Keypair) => {
  await tradeSolForBonk(new BN(amountToSwap), provider);
  await burnBonk(provider, signer)
}

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});