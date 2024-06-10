import { ethers } from "hardhat";
import { expect } from "chai";
import { time } from "@nomicfoundation/hardhat-network-helpers";
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
let buyer1: any;
let developmentTeam: any;
const percentForSeller: number = 85;
const mintFee: number = 0;
const burnFee: number = 0;
const USDC_TOTAL_SUPPLY = 1e10;
before("USDC, Marketplace, Factory Contracts Deployment", function () {
  it("setting accounts", async function () {
    [owner, user1, user2, user3, developmentTeam, buyer1] = await ethers.getSigners();
    console.log("\tOwner Address\t", await owner.getAddress());
    console.log("\tUser1 Address\t", await user1.getAddress());
    console.log("\tUser2 Address\t", await user2.getAddress());
    console.log("\tUser3 Address\t", await user3.getAddress());
    console.log(
      "\tdevelopmentTeam Address\t",
      await developmentTeam.getAddress()
    );
    console.log("\tBuyer1 Address\t", await buyer1.getAddress());
  });
  it("deploy USDC Contract", async function () {
    const instanceUSDC = await ethers.getContractFactory("USDCToken");
    USDC_Contract = await instanceUSDC.connect(owner).deploy(USDC_TOTAL_SUPPLY);
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
let secondGroupAddress: any;
let secondGroup:any;
describe("Create Groups", async function () {
  it("Create First Group", async function () {
    const firstGroupName = "firstGroup";
    const firstGroupDescription = "firstGroupDescription";
    const firstGroupMembers = [user1, user2];
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
    
  });
  it("Check first group state variables", async function() {
    expect(await firstGroup.director()).to.equal(await user1.getAddress());
    expect(await firstGroup.name()).to.equal("firstGroup");
    expect(await firstGroup.description()).to.equal("firstGroupDescription");
    expect(await firstGroup.members(0)).to.equal(user1.address);
    expect(await firstGroup.members(1)).to.equal(user2.address);
  })
  it("Create Second Group", async function () {
    const secondGroupName = "secondGroup";
    const secondGroupDescription = "secondGroupDescription";
    const secondGroupMembers = [user1, user2, user3];
    await Factory.connect(user1).createGroup(
      secondGroupName,
      secondGroupDescription,
      secondGroupMembers
    );
    secondGroupAddress = await Factory.getCreatorGroupAddress(1);
    console.log("\tsecondGroup Address\t", secondGroupAddress);
    secondGroup = await ethers.getContractAt(
      creatorGroupABI,
      await Factory.getCreatorGroupAddress(1)
    );
    
  });
  it("Check second group state variables", async function() {
    expect(await secondGroup.director()).to.equal(await user1.getAddress());
    expect(await secondGroup.name()).to.equal("secondGroup");
    expect(await secondGroup.description()).to.equal("secondGroupDescription");
    expect(await secondGroup.members(0)).to.equal(user1.address);
    expect(await secondGroup.members(1)).to.equal(user2.address);
    expect(await secondGroup.members(2)).to.equal(user3.address);
  })
})

describe("first group list nfts", async function(){
  it("mint nfts", async function(){
    const name1 = "firstNFT";
    const description1 = "firstNFT description";
    const nftURI_1 = "ipfs://firstNFT.jpg";
    await firstGroup.mint()
  })
})
