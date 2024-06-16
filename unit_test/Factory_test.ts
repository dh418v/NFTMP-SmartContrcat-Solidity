import { ethers } from "hardhat";
import { expect } from "chai";
import creatorGroupABI from "./abis/creatorGroup.json";

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
before("USDC, Marketplace Contracts Deployment", function () {
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
});

let Group_Address: any;
let Content_Address: any;
describe("Create Factory contract", async function () {
  it("deploy Factory Contract", async function () {
    const instanceGroup = await ethers.getContractFactory("CreatorGroup");
    const Group = await instanceGroup.deploy();
    Group_Address = await Group.getAddress();
    const instanceContent = await ethers.getContractFactory("ContentNFT");
    const Content = await instanceContent.deploy();
    Content_Address = await Content.getAddress();
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
  it("check state variables of Factory Contract", async function () {
    expect(await Factory.owner()).equal(owner);
    expect(await Factory.developmentTeam()).equal(developmentTeam);
    expect(await Factory.marketplace()).equal(Marketplace_Address);
    expect(await Factory.implementGroup()).equal(Group_Address);
    expect(await Factory.implementContent()).equal(Content_Address);
    expect(await Factory.mintFee()).equal(mintFee);
    expect(await Factory.burnFee()).equal(burnFee);
    expect(await Factory.USDC()).equal(USDC_Address);
  });
});

describe("test createGroup() function", async function () {
  it("firstGroup Creation", async function () {
    const firstGroupName = "firstGroup";
    const firstGroupDescription = "firstGroupDescription";
    const firstGroupMembers = [user1, user2, user3];
    await Factory.connect(user1).createGroup(
      firstGroupName,
      firstGroupDescription,
      firstGroupMembers
    );
    const firstGroupAddress = await Factory.getCreatorGroupAddress(0);
    console.log("\tfirstGroup Address\t", firstGroupAddress);
  });
  it("secondGroup Creation", async function () {
    const secondGroupName = "secondGroup";
    const secondGroupDescription = "secondGroupDescription";
    const secondGroupMembers = [user1, user2];
    await Factory.connect(user1).createGroup(
      secondGroupName,
      secondGroupDescription,
      secondGroupMembers
    );
    const secondGroupAddress = await Factory.getCreatorGroupAddress(1);
    console.log("\tsecondGroup Address\t", secondGroupAddress);
  });
  it("check state variables of firstGroup", async function () {
    const firstGroup = await ethers.getContractAt(
      creatorGroupABI,
      await Factory.getCreatorGroupAddress(0)
    );
    expect(await firstGroup.name()).to.equal("firstGroup");
    expect(await firstGroup.description()).to.equal("firstGroupDescription");
    expect(await firstGroup.members(0)).to.equal(user1.address);
    expect(await firstGroup.members(1)).to.equal(user2.address);
    expect(await firstGroup.members(2)).to.equal(user3.address);
  });
  it("check state variables of secondGroup", async function () {
    const secondGroup = await ethers.getContractAt(
      creatorGroupABI,
      await Factory.getCreatorGroupAddress(1)
    );
    expect(await secondGroup.name()).to.equal("secondGroup");
    expect(await secondGroup.description()).to.equal("secondGroupDescription");
    expect(await secondGroup.members(0)).to.equal(user1.address);
    expect(await secondGroup.members(1)).to.equal(user2.address);
  });
  it("Check if the number of the members is 0", async function () {
    await expect(
      Factory.connect(user1).createGroup(
        "thirdGroup",
        "thirdGroupDescription",
        []
      )
    ).to.be.revertedWith("At least one owner is required");
  });
  it("Check if the caller is the first member", async function () {
    await expect(
      Factory.connect(user1).createGroup(
        "thirdGroup",
        "thirdGroupDescription",
        [user2, user1]
      )
    ).to.be.revertedWith("The first member must be the caller");
  });
});

describe("test setTeamScoreForCreatorGroup() function", async function () {
  it("setTeamScoreForCreatorGroup -> pass", async function () {
    await Factory.connect(owner).setTeamScoreForCreatorGroup(0, 50);
    const firstGroup = await ethers.getContractAt(
      creatorGroupABI,
      await Factory.getCreatorGroupAddress(0)
    );
    expect(await firstGroup.teamScore()).to.equal(50);
  });
  it("check non owner can calls this function", async function () {
    await expect(
      Factory.connect(user1).setTeamScoreForCreatorGroup(0, 50)
    ).to.be.revertedWith("Only owner can call this function");
  });
  it("check teamScore which is out of [0, 100] can pass", async function () {
    await expect(
      Factory.connect(owner).setTeamScoreForCreatorGroup(0, 101)
    ).to.be.revertedWith("Invalid score");
  });
  it("check id is out of range", async function () {
    await expect(
      Factory.connect(owner).setTeamScoreForCreatorGroup(10, 50)
    ).to.be.revertedWith("Invalid creator group");
  });
});
describe("test withdraw() function", async function () {
  it("at first send USDC to Factory Contract", async function () {
    await USDC_Contract.connect(owner).transfer(Factory_Address, 5 * 1e6);
    expect(await USDC_Contract.balanceOf(Factory_Address)).to.equal(5 * 1e6);
  });
  it("check non owner can calls this function", async function () {
    await expect(Factory.connect(user1).withdraw()).to.be.revertedWith(
      "Invalid withdrawer"
    );
  });
  it("withdraw -> pass", async function () {
    await Factory.connect(developmentTeam).withdraw();
    expect(await USDC_Contract.balanceOf(Factory_Address)).to.equal(0);
    expect(await USDC_Contract.balanceOf(developmentTeam)).to.equal(5 * 1e6);
  });
});
