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
describe("Create New Group", async function () {
  it("Create New Group", async function () {
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
  it("Check group state variables", async function() {
    expect(await firstGroup.director()).to.equal(await user1.getAddress());
    expect(await firstGroup.name()).to.equal("firstGroup");
    expect(await firstGroup.description()).to.equal("firstGroupDescription");
    expect(await firstGroup.members(0)).to.equal(user1.address);
    expect(await firstGroup.members(1)).to.equal(user2.address);
  })
})

describe("test addMember() function", async function(){
    it("addMember() -> fail with non director", async function(){
        await expect(firstGroup.connect(user2).addMember(user3)).to.be.revertedWith("Only director can call this function");
    })
    it("addMember() -> fail with already existing member", async function(){
        await expect(firstGroup.connect(user1).addMember(user2)).to.be.revertedWith("Already existing member!");
    })
    it("addMember() -> fail with zero address checking", async function(){
        await expect(firstGroup.connect(user1).addMember(ethers.ZeroAddress)).to.be.revertedWith("Invalid Address");
    })
    it("addMember() -> pass", async function(){
        await firstGroup.connect(user1).addMember(user3);
        expect(await firstGroup.members(2)).to.equal(user3);
    })
})

describe("test leaveGroup() function", async function(){
    it("leaveGroup() -> fail with non Member", async function(){
        await expect(firstGroup.connect(developmentTeam).leaveGroup()).to.be.revertedWith("Only members can call this function");
    })
    it("leaveGroup() -> pass", async function(){
        await firstGroup.connect(user3).leaveGroup();
        expect(await firstGroup.numberOfMembers()).to.equal(2);
    })
})


describe("test mint() function", async function(){
    const nftURI_1 = "ipfs://firstNFT.jpg";
    const nftURI_2 = "ipfs://secondNFT.jpg";
    const nftURI_3 = "ipfs://thirdNFT.jpg";
    const nftURI_4 = "ipfs://fourthNFT.jpg";
    const nftURI_5 = "ipfs://fifthNFT.jpg";

    it("mint() -> fail with non Director", async function(){
        await expect(firstGroup.connect(user2).mint(nftURI_1)).to.be.revertedWith("Only director can call this function");
    })
    it("mint() -> pass", async function(){
        await firstGroup.connect(user1).mint(nftURI_1);
        await firstGroup.connect(user1).mint(nftURI_2);
        await firstGroup.connect(user1).mint(nftURI_3);
        await firstGroup.connect(user1).mint(nftURI_4);
        await firstGroup.connect(user1).mint(nftURI_5);
        expect(await firstGroup.numberOfNFT()).to.equal(5);
    })
})

describe("test listToEnglishAuction()", function(){
    it("listToEnglishAuction() ->fail with non exist NFT", async function(){
        await expect(firstGroup.connect(user1).listToEnglishAuction(5, 1000, 2000)).to.be.revertedWith("NFT does not exist!");
    })
    it("listToEnglishAuction() ->pass", async function(){
        await firstGroup.connect(user1).listToEnglishAuction(0, 1000, 2000);
        expect(await firstGroup.listedState(0)).to.equal(true);
    })
    it("listToEnglishAuction() ->fail with already listed NFT", async function(){
        await expect(firstGroup.connect(user1).listToEnglishAuction(0, 1000, 2000)).to.be.revertedWith("Already listed!");
    })  
})

describe("test listToDutchAuction()", function(){
    it("listToDutchAuction() ->fail with non exist NFT", async function(){
        await expect(firstGroup.connect(user1).listToDutchAuction(5, 1000, 100, 3600)).to.be.revertedWith("NFT does not exist!");
    })
    it("listToDutchAuction() ->fail with invalid dutch information", async function(){
        await expect(firstGroup.connect(user1).listToDutchAuction(1, 1000, 1100, 3600)).to.be.revertedWith("Invalid Dutch information!");
        
    })
    it("listToDutchAuction() ->pass", async function(){
        await firstGroup.connect(user1).listToDutchAuction(1, 1000, 100, 3600);
        expect(await firstGroup.listedState(1)).to.equal(true);
    })
    it("listToDutchAuction() ->fail with already listed NFT", async function(){
        await expect(firstGroup.connect(user1).listToDutchAuction(1, 1000, 100, 3600)).to.be.revertedWith("Already listed!");
    })  
})

describe("test listToOfferingSale()", function(){
    it("listToOfferingSale() ->fail with non exist NFT", async function(){
        await expect(firstGroup.connect(user1).listToOfferingSale(5, 1000)).to.be.revertedWith("NFT does not exist!");
    })
    it("listToOfferingSale() ->pass", async function(){
        await firstGroup.connect(user1).listToOfferingSale(2, 1000);
        expect(await firstGroup.listedState(2)).to.equal(true);
    })
    it("listToOfferingSale() ->fail with already listed NFT", async function(){
        await expect(firstGroup.connect(user1).listToOfferingSale(2, 1000)).to.be.revertedWith("Already listed!");
    })  
})

describe("test executeBurnTransaction() function", async function(){
    it("executeBurnTransaction() -> fail with non Director", async function(){
        await expect(firstGroup.connect(user2).executeBurnTransaction(3)).to.be.revertedWith("Only director can call this function");
    })
    it("executeBurnTransaction() -> fail with non exist NFT", async function(){
        await expect(firstGroup.connect(user1).executeBurnTransaction(5)).to.be.revertedWith("NFT does not exist!");
    })
    it("executeBurnTransaction() -> fail with already listed NFT", async function(){
        await expect(firstGroup.connect(user1).executeBurnTransaction(0)).to.be.revertedWith("Already listed!");
    })
    it("executeBurnTransaction() -> pass", async function(){
        await firstGroup.connect(user1).executeBurnTransaction(3);
        expect(await firstGroup.numberOfBurnedNFT()).to.equal(1);
    })
})

describe("test cancelListing() function", async function(){
    it("cancelListing() -> fail with non exist NFT", async function(){
        await expect(firstGroup.connect(user1).cancelListing(5)).to.be.revertedWith("NFT does not exist!");
    })
    it("cancelListing() -> fail with non Director", async function(){
        await expect(firstGroup.connect(user2).cancelListing(0)).to.be.revertedWith("Only director can call this function");
    })
    it("cancelListing() -> fail with not listed NFT", async function(){
        await expect(firstGroup.connect(user1).cancelListing(4)).to.be.revertedWith("Not Listed!");
    })
    it("cancelListing() -> pass", async function(){
        await firstGroup.connect(user1).cancelListing(1);
        expect(await firstGroup.listedState(1)).to.equal(false);
    })
})

/// Test with Marketplace.sol
describe("test endEnglishAuction()", async function(){
    it("send USDC from owner to buyer1", async function(){
        await USDC_Contract.approve(buyer1, 1e5);
        await USDC_Contract.connect(buyer1).transferFrom(owner, buyer1, 1e5);
    })
    it("make bid to EnglishAuction", async function(){
        await USDC_Contract.connect(buyer1).approve(Marketplace_Address, 1500);
        await Marketplace.connect(buyer1).makeBidToEnglishAuction(0, 1500);
    })
    it("make current time to finishing time", async function(){ 
        await time.increaseTo((await time.latest()) + 2050);
    })
    it("end English Auction -> fail with non director", async function(){
        await expect(firstGroup.connect(user2).endEnglishAuction(0)).to.be.revertedWith("Only director can call this function");
    })
    it("end English Auction -> fail with non exist NFT", async function(){
        await expect(firstGroup.connect(user1).endEnglishAuction(5)).to.be.revertedWith("NFT does not exist!");
    })
    it("end English Auction -> fail with Not Listed NFT", async function(){
        await expect(firstGroup.connect(user1).endEnglishAuction(4)).to.be.revertedWith("Not listed!");
    })
    it("end English Auction -> pass", async function(){
        await expect(firstGroup.connect(user1).endEnglishAuction(0));
    })
})

describe("test executeOfferingSaleTransaction()", async function(){
    it("make bid to OfferingSale", async function(){
        await USDC_Contract.connect(buyer1).approve(Marketplace_Address, 1500);
        await Marketplace.connect(buyer1).makeBidToOfferingSale(0, 1500);
    })
    it("end executeOfferingSaleTransaction -> fail with non director", async function(){
        await expect(firstGroup.connect(user2).executeOfferingSaleTransaction(0)).to.be.revertedWith("Only director can call this function");
    })
    it("end English Auction -> fail with non exist", async function(){
        await expect(firstGroup.connect(user1).executeOfferingSaleTransaction(5)).to.be.revertedWith("Invalid transaction id");
    })
    it("end English Auction -> pass", async function(){
        await expect(firstGroup.connect(user1).executeOfferingSaleTransaction(0));
    })
})
 
describe("test setNewDirector() function", async function(){
    it("setNewDirector() -> fail with non Director", async function(){
        await expect(firstGroup.connect(user2).setNewDirector(user2)).to.be.revertedWith("Only director can call this function");
    })
    it("setNewDirector() -> fail with new non-member", async function(){
        await expect(firstGroup.connect(user1).setNewDirector(developmentTeam)).to.be.revertedWith("Only members can be director!");
    })
    it("setNewDirector() -> pass", async function(){
        await firstGroup.connect(user1).setNewDirector(user2);
        expect(await firstGroup.director()).to.equal(user2);
    })

})

describe("test setTeamScore() function", async function(){
    it("setTeamScore() -> fail with non Factory", async function(){
        await expect(firstGroup.connect(user2).setTeamScore(50)).to.be.revertedWith("Only factory can call this function.");
    })
    it("setTeamScore() -> pass", async function(){
        await Factory.connect(owner).setTeamScoreForCreatorGroup(0, 50);
        expect(await firstGroup.teamScore()).to.equal(50);
    })
})

describe("test withdrawFromMarketplace() function", async function(){
    it("withdrawFromMarketplace() -> fail with non director", async function(){
        await expect(firstGroup.connect(user1).withdrawFromMarketplace()).to.be.revertedWith("Only director can call this function");
    })
    it("withdrawFromMarketplace() -> pass", async function(){
        await firstGroup.connect(user2).withdrawFromMarketplace();
        expect(await firstGroup.totalEarning()).to.equal(3000 * 0.85);
    })
})

describe("test withdraw() function", async function(){
    it("withdraw() -> fail with non member", async function(){
        await expect(firstGroup.connect(buyer1).withdraw()).to.be.revertedWith("Only members can call this function");
    })
    it("withdraw() -> pass", async function(){
        await firstGroup.connect(user1).withdraw();
        expect(await Marketplace.balanceOfUser(user1)).to.equal(850);
    })
    it("withdraw() -> pass", async function(){
        await firstGroup.connect(user2).withdraw();
        expect(await Marketplace.balanceOfUser(user2)).to.equal(850);
    })
})