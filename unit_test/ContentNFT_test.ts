import { ethers } from "hardhat";
import { expect } from "chai";
import creatorGroupABI from "./abis/creatorGroup.json";
import collectionABI from "./abis/contentNFT.json";

let USDC_Address: any;
let USDC_Contract: any;
let Marketplace: any;
let Marketplace_Address: any;
let Factory: any;
let Factory_Address: any;
let owner: any;
let user1: any;
let user2: any;
let user3: any;
let developmentTeam: any;
const percentForSeller: number = 85;
const mintFee: number = 0;
const burnFee: number = 0;
const USDC_TOTAL_SUPPLY = 1e10;
before("USDC, Marketplace, Factory Contracts Deployment", function () {
  it("setting accounts", async function () {
    [owner, user1, user2, user3, developmentTeam] = await ethers.getSigners();
    console.log("\tOwner Address\t", await owner.getAddress());
    console.log("\tUser1 Address\t", await user1.getAddress());
    console.log("\tUser2 Address\t", await user2.getAddress());
    console.log("\tUser3 Address\t", await user3.getAddress());
    console.log(
      "\tdevelopmentTeam Address\t",
      await developmentTeam.getAddress()
    );
  });
  it("deploy USDC Contract", async function () {
    const instanceUSDC = await ethers.getContractFactory("USDCToken");
    USDC_Contract = await instanceUSDC.deploy(USDC_TOTAL_SUPPLY);
    USDC_Address = await USDC_Contract.getAddress();
    console.log("\tUSDC Contract deployed at:", USDC_Address);
  });
  it("deploy Marketplace Contract", async function () {
    const instanceMarketplace = await ethers.getContractFactory("Marketplace");
    Marketplace = await instanceMarketplace.deploy(
      developmentTeam,
      percentForSeller,
      USDC_Address
    );
    Marketplace_Address = await Marketplace.getAddress();
    console.log("\tMarketplace Contract deployed at:", Marketplace_Address);
  });
  it("deploy Factory Contract", async function () {
    const instanceGroup = await ethers.getContractFactory("CreatorGroup");
    const Group = await instanceGroup.deploy();
    const Group_Address = await Group.getAddress();
    const instanceContent = await ethers.getContractFactory("ContentNFT");
    const Content = await instanceContent.deploy();
    const Content_Address = await Content.getAddress();
    const instanceFactory = await ethers.getContractFactory("Factory");
    Factory = await instanceFactory.deploy(
      Group_Address,
      Content_Address,
      Marketplace_Address,
      developmentTeam,
      mintFee,
      burnFee,
      USDC_Address
    );
    Factory_Address = await Factory.getAddress();
    console.log("\tFactory Contract deployed at:", Factory_Address);
  });
});


let collection_Address: any;
let collection: any;
let firstGroupAddress: any;
let firstGroup: any;
describe("Create New Collection", async function () {
  it("Create New Group -> New Collection", async function () {
    const firstGroupName = "firstGroup";
    const firstGroupDescription = "firstGroupDescription";
    const firstGroupMembers = [user1, user2, user3];
    await Factory.connect(user1).createGroup(
      firstGroupName,
      firstGroupDescription,
      firstGroupMembers
    );
    firstGroupAddress = await Factory.getCreatorGroupAddress(0);
    console.log("\tfirstGroup Address\t", firstGroupAddress);
    firstGroup = await ethers.getContractAt(
      creatorGroupABI,
      await Factory.getCreatorGroupAddress(0)
    );
    collection_Address = await firstGroup.collectionAddress();
    console.log("\tCollection Address\t", collection_Address);
  });
  it("Check collection state variables", async function () {
    collection = await ethers.getContractAt(collectionABI, collection_Address);
    expect(await collection.name()).to.equal("firstGroup");
    expect(await collection.symbol()).to.equal("firstGroup");
    expect(await collection.owner()).to.equal(firstGroupAddress);
  });
});
describe("test mint() function", async function () {
     it("Mint NFT -> pass", async function(){
        await firstGroup.connect(user1).mint("ipfs://firstToken.png") ;
        expect(await collection.balanceOf(firstGroupAddress)).to.equal(1);
        expect(await collection.ownerOf(1)).to.equal(firstGroupAddress);
        expect(await collection.tokenURI(1)).to.equal("ipfs://firstToken.png");
     })
     it("Mint NFT -> fail with non director", async function(){
        await expect(firstGroup.connect(user2).mint("ipfs://firstToken.png")).to.be.revertedWith("Only director can call this function");
     })

})

describe("test tokenURI() function", async function(){
  it("tokenURI() -> pass", async function(){
    expect(await collection.tokenURI(1)).to.equal("ipfs://firstToken.png");
  })
  it("tokenURI() -> fail", async function(){
     expect(await collection.tokenURI(2)).to.equal("");
  })
})

describe("test getLoyaltyFee() function", async function () {
  it("getLoyaltyFee() -> pass", async function(){
    expect(await collection.getLoyaltyFee(1)).to.equal(0);
  })

})

describe("test burn() function", async function () {
  it("Burn NFT -> fail with non director", async function(){
    await expect(collection.connect(user2).burn(1)).to.be.revertedWith("only owner can burn");
  })
  it("Burn NFT -> pass", async function(){
        await firstGroup.connect(user1).executeBurnTransaction(0) ;
        expect(await collection.balanceOf(firstGroupAddress)).to.equal(0);
        const CUSTOM_ERROR = "ERC721NonexistentToken";
        await expect(collection.ownerOf(1)).to.be.revertedWithCustomError(collection, CUSTOM_ERROR);
    })
})